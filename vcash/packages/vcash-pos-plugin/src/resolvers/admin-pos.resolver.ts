import { Inject } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  AdministratorService,
  Allow,
  Ctx,
  ID,
  Order,
  RequestContext,
  UserInputError,
} from '@vendure/core';

import { posSessionPermission } from '../constants';
import { PosSession } from '../entities/pos-session.entity';
import { PosOrderService } from '../services/pos-order.service';
import { PosSessionService } from '../services/pos-session.service';

/**
 * POS 收银操作 API：班次生命周期（开班/关班/我的班次）。
 * 后续 Task 5 将在此 resolver 追加 addPosItem / checkoutPosOrder 等。
 */
@Resolver()
export class AdminPosResolver {
  constructor(
    @Inject(PosSessionService) private sessionService: PosSessionService,
    @Inject(AdministratorService) private administratorService: AdministratorService,
    @Inject(PosOrderService) private orderService: PosOrderService,
  ) {}

  /**
   * 当前管理员的开班班次。
   * ctx.activeUserId 是 User.id，需先转成 Administrator.id 再查。
   */
  @Query()
  @Allow(posSessionPermission.Read)
  async myPosSession(@Ctx() ctx: RequestContext): Promise<PosSession | null> {
    const admin = await this.resolveOperator(ctx);
    if (!admin) return null;
    return this.sessionService.findMyOpenSession(Number(admin.id));
  }

  @Query()
  @Allow(posSessionPermission.Read)
  async posSession(@Args('id') id: string): Promise<PosSession | null> {
    return this.sessionService.findOne(parseInt(id, 10));
  }

  @Mutation()
  @Allow(posSessionPermission.Create)
  async openSession(
    @Args('input') input: { terminalCode: string; openingFloat?: number },
    @Ctx() ctx: RequestContext,
  ): Promise<PosSession> {
    const admin = await this.resolveOperator(ctx);
    if (!admin) throw new UserInputError('未登录或非管理员账号');
    return this.sessionService.openSession({
      terminalCode: input.terminalCode,
      operatorId: Number(admin.id),
      openingFloat: input.openingFloat,
    });
  }

  @Mutation()
  @Allow(posSessionPermission.Update)
  async closeSession(
    @Args('input') input: {
      sessionId: string;
      closingCash?: number;
      approverId?: string;
    },
  ): Promise<{ session: PosSession; summary: any | null }> {
    const session = await this.sessionService.closeSession({
      sessionId: parseInt(input.sessionId, 10),
      closingCash: input.closingCash ?? 0,
      approverId: input.approverId ? parseInt(input.approverId, 10) : undefined,
    });
    return { session, summary: session.closeSummary };
  }

  @Query()
  @Allow(posSessionPermission.Read)
  async posActiveOrder(@Ctx() ctx: RequestContext): Promise<Order | null> {
    const admin = await this.resolveOperator(ctx);
    if (!admin) return null;
    const session = await this.sessionService.findMyOpenSession(Number(admin.id));
    if (!session || !session.activeOrderId) return null;
    return this.orderService.ensureActiveOrder(ctx, session);
  }

  @Mutation()
  @Allow(posSessionPermission.Update)
  async addPosItem(
    @Args('input') input: {
      productVariantId: string;
      quantity: number;
      discount?: number;
      isGift?: boolean;
      note?: string;
      originalPrice?: number;
    },
    @Ctx() ctx: RequestContext,
  ): Promise<Order> {
    const admin = await this.resolveOperator(ctx);
    if (!admin) throw new UserInputError('未登录或非管理员账号');
    const session = await this.sessionService.findMyOpenSession(Number(admin.id));
    if (!session) throw new UserInputError('当前无开班班次');
    return this.orderService.addPosItem(ctx, session, {
      productVariantId: input.productVariantId,
      quantity: input.quantity,
      discount: input.discount,
      isGift: input.isGift,
      note: input.note,
      originalPrice: input.originalPrice,
    });
  }

  @Mutation()
  @Allow(posSessionPermission.Update)
  async updatePosItem(
    @Args('input') input: { orderLineId: string; quantity: number },
    @Ctx() ctx: RequestContext,
  ): Promise<Order> {
    const admin = await this.resolveOperator(ctx);
    if (!admin) throw new UserInputError('未登录或非管理员账号');
    const session = await this.sessionService.findMyOpenSession(Number(admin.id));
    if (!session) throw new UserInputError('当前无开班班次');
    return this.orderService.updatePosItem(ctx, session, {
      orderLineId: input.orderLineId,
      quantity: input.quantity,
    });
  }

  @Mutation()
  @Allow(posSessionPermission.Update)
  async checkoutPosOrder(
    @Args('input') input: {
      payments: Array<{ method: string; transactionId?: string; metadata?: any }>;
    },
    @Ctx() ctx: RequestContext,
  ): Promise<{ order: Order; payments: any[] }> {
    const admin = await this.resolveOperator(ctx);
    if (!admin) throw new UserInputError('未登录或非管理员账号');
    const session = await this.sessionService.findMyOpenSession(Number(admin.id));
    if (!session) throw new UserInputError('当前无开班班次');
    return this.orderService.checkoutPosOrder(ctx, session, input);
  }

  /**
   * User.id → Administrator。失败返回 undefined（myPosSession 容忍 null，openSession 抛错）。
   */
  private async resolveOperator(ctx: RequestContext) {
    const userId = ctx.activeUserId;
    if (!userId) return undefined;
    return this.administratorService.findOneByUserId(ctx, userId);
  }
}
