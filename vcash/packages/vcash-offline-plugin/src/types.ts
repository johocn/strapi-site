export interface OfflineOrderLineRecord {
  productVariantId: string;
  quantity: number;
  discount?: number;
  isGift?: boolean;
  note?: string;
  originalPrice?: number;
}

export interface OfflinePaymentRecord {
  method: string;
  transactionId?: string;
  metadata?: any;
}

export interface OfflineOrderRecord {
  idempotencyKey: string;
  clientCreatedAt: string;
  clientUpdatedAt: string;
  sessionCode: string;
  terminalCode: string;
  orderType: string;
  lines: OfflineOrderLineRecord[];
  payments: OfflinePaymentRecord[];
  totalAmount: number;
}

export interface SyncedOrderResult {
  idempotencyKey: string;
  orderId: number;
  orderCode: string;
  status: 'success' | 'duplicate';
}

export interface SyncFailureResult {
  idempotencyKey: string;
  error: string;
  code: string;
  status: 'failed';
}
