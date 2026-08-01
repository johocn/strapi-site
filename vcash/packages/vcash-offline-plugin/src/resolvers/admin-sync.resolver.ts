import { Inject } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Allow, Ctx, RequestContext } from '@vendure/core';

import { offlineSyncPermission } from '../constants';
import { SyncOrderService } from '../services/sync-order.service';
import { OfflineOrderRecord, SyncFailureResult, SyncedOrderResult } from '../types';

@Resolver()
export class AdminSyncResolver {
  constructor(@Inject(SyncOrderService) private syncOrderService: SyncOrderService) {}

  @Mutation()
  @Allow(offlineSyncPermission.Update)
  async syncOrders(
    @Args('input') input: { orders: OfflineOrderRecord[] },
    @Ctx() ctx: RequestContext,
  ): Promise<{ succeeded: SyncedOrderResult[]; failed: SyncFailureResult[] }> {
    const succeeded: SyncedOrderResult[] = [];
    const failed: SyncFailureResult[] = [];

    for (const order of input.orders) {
      const result = await this.syncOrderService.syncSingleOrder(ctx, order);
      if (result.status === 'failed') {
        failed.push(result);
      } else {
        succeeded.push(result);
      }
    }

    return { succeeded, failed };
  }
}
