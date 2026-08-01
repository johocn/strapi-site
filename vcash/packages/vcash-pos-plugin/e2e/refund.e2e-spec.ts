import path from 'node:path';
import {
  createTestEnvironment,
  registerInitializer,
  SqljsInitializer,
  testConfig,
} from '@vendure/testing';
import { configureDefaultOrderProcess, DefaultLogger, LogLevel } from '@vendure/core';
import gql from 'graphql-tag';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { VcashPosPlugin } from '../src/plugin';

registerInitializer('sqljs', new SqljsInitializer('__data__'));

const posOrderProcess = configureDefaultOrderProcess({
  arrangingPaymentRequiresCustomer: false,
  arrangingPaymentRequiresShipping: false,
});

const CREATE_STOCK_LOCATION = gql`
  mutation CreateStockLocation($name: String!) {
    createStockLocation(input: { name: $name }) { id name }
  }
`;

const CREATE_TERMINAL = gql`
  mutation CreateTerminal($code: String!, $name: String!, $stockLocationId: ID!) {
    createPosTerminal(input: { code: $code, name: $name, stockLocationId: $stockLocationId }) {
      id code name
    }
  }
`;

const OPEN_SESSION = gql`
  mutation OpenSession($terminalCode: String!, $openingFloat: Int) {
    openSession(input: { terminalCode: $terminalCode, openingFloat: $openingFloat }) {
      id code state
    }
  }
`;

const ADD_POS_ITEM = gql`
  mutation AddPosItem($productVariantId: ID!, $quantity: Int!) {
    addPosItem(input: { productVariantId: $productVariantId, quantity: $quantity }) {
      id state total totalWithTax
    }
  }
`;

const CHECKOUT = gql`
  mutation Checkout($payments: [CheckoutPaymentInput!]!) {
    checkoutPosOrder(input: { payments: $payments }) {
      order {
        id code state total totalWithTax
        payments { id amount state method }
      }
    }
  }
`;

const CREATE_POS_REFUND = gql`
  mutation CreatePosRefund($originalOrderId: ID!, $paymentId: ID!, $amount: Int!, $reason: String) {
    createPosRefund(input: {
      originalOrderId: $originalOrderId
      paymentId: $paymentId
      amount: $amount
      reason: $reason
    }) {
      id
      total
      state
      method
      transactionId
      metadata
    }
  }
`;

const POS_REFUNDS = gql`
  query PosRefunds($sessionId: ID!) {
    posRefunds(sessionId: $sessionId) {
      id
      total
      state
      method
      payment { id method }
    }
  }
`;

const SHIFT_REPORT_PREVIEW = gql`
  query ShiftReportPreview($sessionId: ID!, $closingCash: Int) {
    shiftReportPreview(sessionId: $sessionId, closingCash: $closingCash)
  }
`;

const GET_PRODUCTS = gql`
  query GetProducts {
    products {
      items { id name variants { id sku name price } }
    }
  }
`;

const GET_ORDER = gql`
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      state
      total
      payments { id amount state method }
    }
  }
`;

describe('退货退款流程', () => {
  const { server, adminClient } = createTestEnvironment({
    ...testConfig,
    logger: new DefaultLogger({ level: LogLevel.Error }),
    orderOptions: { process: [posOrderProcess] },
    plugins: [VcashPosPlugin],
  });

  let variantId: string;
  let sessionId: string;
  let orderId: string;
  let paymentId: string;
  let orderTotal: number;
  const openingFloat = 50000;

  beforeAll(async () => {
    await server.init({
      initialData: {
        defaultLanguage: 'en',
        defaultZone: 'Asia',
        roles: [],
        countries: [{ code: 'CN', name: '中国', zone: 'Asia' }],
        taxRates: [{ name: 'standard', percentage: 0 }],
        shippingMethods: [],
        paymentMethods: [],
        collections: [],
      },
      productsCsvPath: path.join(
        __dirname,
        '../../../server/__tests__/fixtures/products.csv',
      ),
    });
    await adminClient.asSuperAdmin();

    const productsRes = await adminClient.query(GET_PRODUCTS);
    expect(productsRes.products.items.length).toBeGreaterThan(0);
    variantId = productsRes.products.items[0].variants[0].id;

    const sl = await adminClient.query(CREATE_STOCK_LOCATION, { name: '朝阳店' });
    await adminClient.query(CREATE_TERMINAL, {
      code: 'POS-RFD-001',
      name: '退款测试台',
      stockLocationId: sl.createStockLocation.id,
    });

    const session = await adminClient.query(OPEN_SESSION, {
      terminalCode: 'POS-RFD-001',
      openingFloat,
    });
    sessionId = session.openSession.id;
  }, 180000);

  afterAll(async () => {
    await server.destroy();
  });

  it('应先完成一笔现金销售', async () => {
    await adminClient.query(ADD_POS_ITEM, {
      productVariantId: variantId,
      quantity: 3,
    });
    const result = await adminClient.query(CHECKOUT, {
      payments: [{ method: 'cash' }],
    });
    expect(result.checkoutPosOrder.order.state).toBe('PaymentSettled');
    orderId = result.checkoutPosOrder.order.id;
    paymentId = result.checkoutPosOrder.order.payments[0].id;
    orderTotal = result.checkoutPosOrder.order.totalWithTax;
    expect(orderTotal).toBeGreaterThan(0);
  });

  it('应对已完成订单创建现金退款（立即结算）', async () => {
    const refundAmount = Math.floor(orderTotal / 3); // 退 1/3
    const result = await adminClient.query(CREATE_POS_REFUND, {
      originalOrderId: orderId,
      paymentId,
      amount: refundAmount,
      reason: '商品质量问题',
    });
    expect(result.createPosRefund).toBeTruthy();
    // Vendure 3.6.4 用 input.amount 时 Refund.total 为正数
    expect(result.createPosRefund.total).toBe(refundAmount);
    // 现金退款应立即结算
    expect(result.createPosRefund.state).toBe('Settled');
    expect(result.createPosRefund.method).toBe('cash');
    expect(result.createPosRefund.transactionId).toContain('cash-refund-');
  });

  it('posRefunds 应返回班次内的退款列表', async () => {
    const result = await adminClient.query(POS_REFUNDS, { sessionId });
    expect(result.posRefunds).toBeTruthy();
    expect(result.posRefunds.length).toBe(1);
    expect(result.posRefunds[0].state).toBe('Settled');
    expect(result.posRefunds[0].payment.method).toBe('cash');
  });

  it('shiftReportPreview 应统计退款金额', async () => {
    const refundAmount = Math.floor(orderTotal / 3);
    const result = await adminClient.query(SHIFT_REPORT_PREVIEW, { sessionId });
    const summary = result.shiftReportPreview;
    expect(summary).toBeTruthy();
    // 1 笔正常销售 + 0 笔退货 Order（原生 Refund 不计入 orders）
    expect(summary.orders.normalCount).toBe(1);
    expect(summary.orders.refundCount).toBe(1); // 原生 Refund 计入 refundCount
    // refundAmount = |Refund.total|
    expect(summary.orders.refundAmount).toBe(refundAmount);
    // 现金支付方式：amount = orderTotal - refundAmount
    const cashMethod = summary.paymentsByMethod.find((m: any) => m.method === 'cash');
    expect(cashMethod).toBeTruthy();
    expect(cashMethod.amount).toBe(orderTotal - refundAmount);
  });

  it('对未完成订单退款应报错', async () => {
    // 先加商品（不结账）
    await adminClient.query(ADD_POS_ITEM, {
      productVariantId: variantId,
      quantity: 1,
    });
    // 获取当前活跃 Order（AddingItems 状态）
    const activeResult = await adminClient.query(
      gql`query { posActiveOrder { id state } }`,
    );
    const activeOrderId = activeResult.posActiveOrder.id;

    // 尝试对 AddingItems 状态的 Order 退款
    await expect(
      adminClient.query(CREATE_POS_REFUND, {
        originalOrderId: activeOrderId,
        paymentId,
        amount: 100,
      }),
    ).rejects.toThrow();
  });
});
