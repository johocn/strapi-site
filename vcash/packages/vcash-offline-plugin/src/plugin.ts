import { TypeOrmModule } from '@nestjs/typeorm';
import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { VcashPosPlugin } from '@vcash/pos-plugin';
import gql from 'graphql-tag';

import { offlineSyncPermission } from './constants';
import { OfflineSyncQueue } from './entities/offline-sync-queue.entity';
import { AdminSyncResolver } from './resolvers/admin-sync.resolver';
import { OfflineSyncQueueService } from './services/sync-queue.service';
import { SyncOrderService } from './services/sync-order.service';

const adminSchema = gql`
  input SyncOrdersInput {
    orders: [OfflineOrderInput!]!
  }

  input OfflineOrderInput {
    idempotencyKey: String!
    clientCreatedAt: DateTime!
    clientUpdatedAt: DateTime!
    sessionCode: String!
    terminalCode: String!
    orderType: String!
    lines: [OfflineOrderLineInput!]!
    payments: [OfflinePaymentInput!]!
    totalAmount: Int!
  }

  input OfflineOrderLineInput {
    productVariantId: ID!
    quantity: Int!
    discount: Int
    isGift: Boolean
    note: String
    originalPrice: Int
  }

  input OfflinePaymentInput {
    method: String!
    transactionId: String
    metadata: JSON
  }

  type SyncOrdersResult {
    succeeded: [SyncedOrder!]!
    failed: [SyncFailure!]!
  }

  type SyncedOrder {
    idempotencyKey: String!
    orderId: ID!
    orderCode: String!
    status: String!
  }

  type SyncFailure {
    idempotencyKey: String!
    error: String!
    code: String!
    status: String!
  }

  extend type Mutation {
    syncOrders(input: SyncOrdersInput!): SyncOrdersResult!
  }
`;

@VendurePlugin({
  imports: [PluginCommonModule, TypeOrmModule.forFeature([OfflineSyncQueue]), VcashPosPlugin],
  entities: [OfflineSyncQueue],
  providers: [OfflineSyncQueueService, SyncOrderService],
  adminApiExtensions: {
    resolvers: [AdminSyncResolver],
    schema: adminSchema,
  },
  configuration: (config) => {
    config.authOptions.customPermissions = [
      ...(config.authOptions.customPermissions ?? []),
      offlineSyncPermission,
    ];
    return config;
  },
})
export class VcashOfflinePlugin {}
