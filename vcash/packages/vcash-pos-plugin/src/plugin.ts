import { TypeOrmModule } from '@nestjs/typeorm';
import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import gql from 'graphql-tag';

import { posSessionPermission, posTerminalPermission } from './constants';
import { orderCustomFields } from './custom-fields/order-custom-fields';
import { orderLineCustomFields } from './custom-fields/order-line-custom-fields';
import { paymentCustomFields } from './custom-fields/payment-custom-fields';
import { PosSession } from './entities/pos-session.entity';
import { PosTerminal } from './entities/pos-terminal.entity';
import { AdminPosResolver } from './resolvers/admin-pos.resolver';
import { AdminRefundResolver } from './resolvers/admin-refund.resolver';
import { AdminTerminalResolver } from './resolvers/admin-terminal.resolver';
import { AggregatePayService } from './services/aggregate-pay.service';
import { PosOrderService } from './services/pos-order.service';
import { PosSessionService } from './services/pos-session.service';
import { PosTerminalService } from './services/pos-terminal.service';
import { RefundService } from './services/refund.service';
import { ShiftReportService } from './services/shift-report.service';

const adminSchema = gql`
  type PosTerminal {
    id: ID!
    code: String!
    name: String!
    channel: Channel!
    stockLocation: StockLocation!
    active: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    deviceConfig: JSON
  }

  input CreatePosTerminalInput {
    code: String!
    name: String!
    stockLocationId: ID!
    deviceConfig: JSON
  }

  input UpdatePosTerminalInput {
    id: ID!
    name: String
    stockLocationId: ID
    active: Boolean
    deviceConfig: JSON
  }

  extend type Query {
    posTerminals(channelId: ID): [PosTerminal!]!
    posTerminal(id: ID!): PosTerminal
  }

  extend type Mutation {
    createPosTerminal(input: CreatePosTerminalInput!): PosTerminal!
    updatePosTerminal(input: UpdatePosTerminalInput!): PosTerminal!
    deletePosTerminal(id: ID!): Boolean!
  }

  type PosSession {
    id: ID!
    code: String!
    terminal: PosTerminal!
    stockLocation: StockLocation!
    operator: Administrator!
    approver: Administrator
    state: String!
    openedAt: DateTime!
    closedAt: DateTime
    closeSummary: JSON
    openingFloat: Int!
    closingCash: Int!
    activeOrderId: Int
    updatedAt: DateTime!
  }

  input OpenSessionInput {
    terminalCode: String!
    openingFloat: Int
  }

  input CloseSessionInput {
    sessionId: ID!
    closingCash: Int
    approverId: ID
  }

  type CloseSessionResult {
    session: PosSession!
    summary: JSON
  }

  extend type Query {
    myPosSession: PosSession
    posSession(id: ID!): PosSession
  }

  extend type Mutation {
    openSession(input: OpenSessionInput!): PosSession!
    closeSession(input: CloseSessionInput!): CloseSessionResult!
  }

  input AddPosItemInput {
    productVariantId: ID!
    quantity: Int!
    discount: Int
    isGift: Boolean
    note: String
    originalPrice: Int
  }

  input UpdatePosItemInput {
    orderLineId: ID!
    quantity: Int!
  }

  input CheckoutPaymentInput {
    method: String!
    transactionId: String
    metadata: JSON
  }

  input CheckoutInput {
    payments: [CheckoutPaymentInput!]!
  }

  type PosCheckoutResult {
    order: Order!
    payments: [Payment!]!
  }

  extend type Query {
    posActiveOrder: Order
    shiftReportPreview(sessionId: ID!, closingCash: Int): JSON!
    aggregatePayByCode(aggregatePayCode: String!): Payment
    posRefunds(sessionId: ID!): [Refund!]!
  }

  extend type Mutation {
    addPosItem(input: AddPosItemInput!): Order!
    updatePosItem(input: UpdatePosItemInput!): Order!
    checkoutPosOrder(input: CheckoutInput!): PosCheckoutResult!
    createAggregatePay(input: CreateAggregatePayInput!): Payment!
    confirmAggregatePay(paymentId: ID!): Payment!
    settleAggregatePay(paymentId: ID!): Payment!
    failAggregatePay(paymentId: ID!): Payment!
    settleSessionAggregatePays(sessionId: ID!): Int!
    createPosRefund(input: CreatePosRefundInput!): Refund!
    settleManualRefund(input: SettleManualRefundInput!): Refund!
  }

  input CreateAggregatePayInput {
    aggregatePayCode: String!
  }

  input CreatePosRefundInput {
    originalOrderId: ID!
    paymentId: ID!
    amount: Int!
    reason: String
  }

  input SettleManualRefundInput {
    refundId: ID!
    transactionId: String!
  }

  # 扩展核心类型：暴露 Payment.order 和 Refund.payment 便于 POS 场景查询
  extend type Payment {
    order: Order!
  }

  extend type Refund {
    payment: Payment!
  }
`;

@VendurePlugin({
  imports: [
    PluginCommonModule,
    TypeOrmModule.forFeature([PosTerminal, PosSession]),
  ],
  entities: [PosTerminal, PosSession],
  providers: [
    PosTerminalService,
    PosSessionService,
    PosOrderService,
    ShiftReportService,
    AggregatePayService,
    RefundService,
  ],
  exports: [PosOrderService],
  adminApiExtensions: {
    resolvers: [AdminTerminalResolver, AdminPosResolver, AdminRefundResolver],
    schema: adminSchema,
  },
  configuration: (config) => {
    // 注册 PosTerminal + PosSession CRUD 自定义权限定义（superadmin 自动放行，其他角色需显式授予）
    config.authOptions.customPermissions = [
      ...(config.authOptions.customPermissions ?? []),
      posTerminalPermission,
      posSessionPermission,
    ];
    // 注册 Order/OrderLine/Payment custom fields
    config.customFields = {
      ...config.customFields,
      Order: [...(config.customFields?.Order ?? []), ...orderCustomFields],
      OrderLine: [
        ...(config.customFields?.OrderLine ?? []),
        ...orderLineCustomFields,
      ],
      Payment: [...(config.customFields?.Payment ?? []), ...paymentCustomFields],
    };
    return config;
  },
})
export class VcashPosPlugin {}
