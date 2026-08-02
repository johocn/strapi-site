import { Inject, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import {
  ID,
  Order,
  OrderService,
  RequestContext,
  StockMovementService,
  TransactionalConnection,
  UserInputError,
  idsAreEqual,
} from '@vendure/core';
import { Connection } from 'typeorm';

import { PosSession } from '../entities/pos-session.entity';

export interface CreateOrderFromOfflineInput {
  terminalCode: string;
  orderType: string;
  lines: Array<{
    productVariantId: ID;
    quantity: number;
    discount?: number;
    isGift?: boolean;
    note?: string;
    originalPrice?: number;
  }>;
  payments: Array<{
    method: string;
    transactionId?: string;
    metadata?: any;
  }>;
}

/**
 * POS 收银核心服务：
 * - ensureActiveOrder: 班次内有活跃 Order 则复用，否则创建新 Order 并绑定 custom fields
 * - addPosItem: 加商品到 Order，通过 addItemToOrder 第 5 参设置 OrderLine custom fields
 * - updatePosItem: 修改 OrderLine 数量
 * - checkoutPosOrder: transitionToState ArrangingPayment → addManualPaymentToOrder → transitionToState PaymentSettled
 *
 * 关键 API 约束（Vendure 3.6.4 实际签名，已通过 Grep 验证）：
 * 1. OrderService.create(ctx, userId?) 不接受 stockLocationCode/customFields
 * 2. addItemToOrder(ctx, orderId, variantId, qty, customFields?) 第 5 参设 OrderLine 字段
 * 3. addManualPaymentToOrder 必须在事务中；method 字段不校验 PaymentMethod 注册
 * 4. PaymentSettled 需手动 transitionToState；checkPaymentsCoverTotal 默认校验
 */
@Injectable()
export class PosOrderService {
  constructor(
    @InjectConnection() private connection: Connection,
    @Inject(TransactionalConnection) private transactionalConnection: TransactionalConnection,
    @Inject(OrderService) private orderService: OrderService,
    @Inject(StockMovementService) private stockMovementService: StockMovementService,
  ) {}

  /**
   * 确保班次有活跃 Order。无则创建并绑定 custom fields。
   */
  async ensureActiveOrder(ctx: RequestContext, session: PosSession): Promise<Order> {
    if (session.activeOrderId) {
      const existing = await this.orderService.findOne(ctx, session.activeOrderId);
      if (existing && existing.active) {
        return existing;
      }
    }
    // 创建新 Order（create 不接受 customFields，需创建后 update）
    const order = await this.orderService.create(ctx);
    // 设置 Order custom fields
    await this.connection.getRepository(Order).update(order.id, {
      customFields: {
        posSessionId: session.id,
        orderType: 'sale',
        terminalCode: session.terminal.code,
      },
    });
    // 更新 session.activeOrderId
    await this.connection.getRepository(PosSession).update(session.id, {
      activeOrderId: Number(order.id),
    });
    session.activeOrderId = Number(order.id);
    return this.orderService.findOne(ctx, order.id) as Promise<Order>;
  }

  /**
   * 加商品到当前班次 Order。通过 addItemToOrder 第 5 参设置 OrderLine custom fields。
   */
  async addPosItem(
    ctx: RequestContext,
    session: PosSession,
    input: {
      productVariantId: ID;
      quantity: number;
      discount?: number;
      isGift?: boolean;
      note?: string;
      originalPrice?: number;
    },
  ): Promise<Order> {
    const order = await this.ensureActiveOrder(ctx, session);
    const discount = input.discount ?? 100;
    const result = await this.orderService.addItemToOrder(
      ctx,
      order.id,
      input.productVariantId,
      input.quantity,
      {
        originalPrice: input.originalPrice ?? 0,
        discount,
        memberPriceApplied: discount < 100,
        isGift: input.isGift ?? false,
        note: input.note ?? null,
      },
    );
    // addItemToOrder 返回 ErrorResultUnion，需检查是否出错
    if ('errorCode' in result) {
      throw new UserInputError(`加商品失败: ${result.message}`);
    }
    return this.orderService.findOne(ctx, order.id) as Promise<Order>;
  }

  /**
   * 修改 OrderLine 数量。
   */
  async updatePosItem(
    ctx: RequestContext,
    session: PosSession,
    input: { orderLineId: ID; quantity: number },
  ): Promise<Order> {
    if (!session.activeOrderId) {
      throw new UserInputError('当前班次无活跃订单');
    }
    const result = await this.orderService.adjustOrderLine(
      ctx,
      session.activeOrderId,
      input.orderLineId,
      input.quantity,
    );
    if ('errorCode' in result) {
      throw new UserInputError(`修改商品失败: ${result.message}`);
    }
    return this.orderService.findOne(ctx, session.activeOrderId) as Promise<Order>;
  }

  /**
   * 结账：transitionToState ArrangingPayment → addManualPaymentToOrder → transitionToState PaymentSettled。
   * addManualPaymentToOrder 必须在事务中，整个结账流程用 withTransaction 包裹。
   */
  async checkoutPosOrder(
    ctx: RequestContext,
    session: PosSession,
    input: {
      payments: Array<{ method: string; transactionId?: string; metadata?: any }>;
    },
  ): Promise<{ order: Order; payments: any[] }> {
    const order = await this.ensureActiveOrder(ctx, session);
    if (order.lines.length === 0) {
      throw new UserInputError('购物车为空，无法结账');
    }

    const settledPayments: any[] = [];

    await this.transactionalConnection.withTransaction(ctx, async txCtx => {
      // 1. AddingItems → ArrangingPayment
      const arrangeResult = await this.orderService.transitionToState(
        txCtx,
        order.id,
        'ArrangingPayment',
      );
      if ('errorCode' in arrangeResult) {
        throw new UserInputError(`转入 ArrangingPayment 失败: ${arrangeResult.message}`);
      }

      // 2. 逐笔添加 manual payment（内部 Payment 直接 Created → Settled）
      //    defaultPaymentProcess.onTransitionEnd 会在 Payment 覆盖 total 时
      //    自动 transition order 到 PaymentSettled，无需手动调用。
      for (const pay of input.payments) {
        const payResult = await this.orderService.addManualPaymentToOrder(txCtx, {
          orderId: order.id,
          method: pay.method,
          transactionId: pay.transactionId,
          metadata: pay.metadata ?? {},
        });
        if ('errorCode' in payResult) {
          throw new UserInputError(`添加支付失败: ${payResult.message}`);
        }
      }

      // 3. 收集 Payment 快照并校验 order 已到 PaymentSettled
      const finalOrder = await this.orderService.findOne(txCtx, order.id, ['payments', 'lines']);
      if (finalOrder) {
        settledPayments.push(...(finalOrder.payments ?? []));
        if (finalOrder.state !== 'PaymentSettled') {
          throw new UserInputError(
            `结账未完成：订单状态为 ${finalOrder.state}，预期 PaymentSettled（支付金额可能不足）`,
          );
        }
        // 4. POS 无 Fulfillment 步骤，手动触发 SALE 扣减（stockOnHand--, stockAllocated--）
        //    Vendure 默认在 ArrangingPayment→PaymentSettled 时已执行 ALLOCATE（分配），
        //    但 SALE（实际扣减）只在 Fulfillment Shipped 时触发。POS 场景需手动补上。
        const orderLines = finalOrder.lines.map(line => ({
          orderLineId: line.id,
          quantity: line.quantity,
        }));
        await this.stockMovementService.createSalesForOrder(txCtx, orderLines);
      }
    });

    // 4. 清除 session.activeOrderId
    await this.connection.getRepository(PosSession).update(session.id, {
      activeOrderId: null,
    });
    session.activeOrderId = null;

    const finalOrder = await this.orderService.findOne(ctx, order.id, ['payments']);
    return { order: finalOrder as Order, payments: settledPayments };
  }

  /**
   * 离线订单同步入口：创建 Draft Order → 加商品 → 结账。
   * 不依赖 PosSession（离线订单可能没有对应的服务端班次），直接创建独立 Order。
   * 库存不足（addItemToOrder 抛 Insufficient stock）→ 抛 code='OUT_OF_STOCK' 错误。
   */
  async createOrderFromOffline(
    ctx: RequestContext,
    order: CreateOrderFromOfflineInput,
  ): Promise<Order> {
    // 1. 创建 Draft Order
    const newOrder = await this.orderService.create(ctx);
    await this.connection.getRepository(Order).update(newOrder.id, {
      customFields: {
        orderType: order.orderType,
        terminalCode: order.terminalCode,
      },
    });

    // 2. 遍历 lines 加商品
    for (const line of order.lines) {
      const discount = line.discount ?? 100;
      const result = await this.orderService.addItemToOrder(
        ctx,
        newOrder.id,
        line.productVariantId,
        line.quantity,
        {
          originalPrice: line.originalPrice ?? 0,
          discount,
          memberPriceApplied: discount < 100,
          isGift: line.isGift ?? false,
          note: line.note ?? null,
        },
      );
      if ('errorCode' in result) {
        const err: Error & { code?: string } = new Error(result.message);
        if (result.errorCode === 'INSUFFICIENT_STOCK_ERROR') {
          err.code = 'OUT_OF_STOCK';
        }
        throw err;
      }
    }

    // 3. 结账：transitionToState ArrangingPayment → addManualPaymentToOrder（事务）
    await this.transactionalConnection.withTransaction(ctx, async txCtx => {
      const arrangeResult = await this.orderService.transitionToState(
        txCtx,
        newOrder.id,
        'ArrangingPayment',
      );
      if ('errorCode' in arrangeResult) {
        throw new Error(`转入 ArrangingPayment 失败: ${arrangeResult.message}`);
      }

      for (const pay of order.payments) {
        const payResult = await this.orderService.addManualPaymentToOrder(txCtx, {
          orderId: newOrder.id,
          method: pay.method,
          transactionId: pay.transactionId,
          metadata: pay.metadata ?? {},
        });
        if ('errorCode' in payResult) {
          throw new Error(`添加支付失败: ${payResult.message}`);
        }
      }
    });

    // 4. 手动触发 SALE 扣减（与 checkoutPosOrder 同理，POS 无 Fulfillment）
    const settledOrder = await this.orderService.findOne(ctx, newOrder.id, ['payments', 'lines']);
    if (settledOrder && settledOrder.state === 'PaymentSettled') {
      const orderLines = settledOrder.lines.map(line => ({
        orderLineId: line.id,
        quantity: line.quantity,
      }));
      await this.stockMovementService.createSalesForOrder(ctx, orderLines);
    }

    // 5. 返回最终 Order
    const finalOrder = await this.orderService.findOne(ctx, newOrder.id, ['payments']);
    return finalOrder as Order;
  }
}
