export interface ShiftSummary {
  orders: {
    totalCount: number;
    totalAmount: number;
    normalCount: number;
    refundCount: number;
    refundAmount: number;
    heldCount: number;
  };
  paymentsByMethod: Array<{ method: string; count: number; amount: number }>;
  warnings: string[];
}

export interface ReceiptData {
  header: string;
  phone: string;
  address: string;
  footer: string;
  orderCode: string;
  createdAt: string;
  cashier: string;
  lines: Array<{
    name: string;
    qty: number;
    priceUnit: number;
    subtotal: number;
    discount: number;
  }>;
  total: number;
  payments: Array<{ method: string; amount: number }>;
  change: number | null;
}
