export interface PurchaseBillSource {
  id: number;
  orderNo?: string;
  grnNo?: string;
  reference?: string;
  date_received?: string;
}

export interface PurchaseBillStakeholder {
  id: number;
  name: string;
}

export interface PurchaseBillItem {
  product?: { id: number; name?: string; item_name?: string };
  quantity?: number;
  rate?: number;
  amount: number;
}

export interface PurchaseBillAttachment {
  source: 'Purchase Order' | 'Requisition';
  attachment: { id: number; name: string; full_path?: string };
}

export interface PurchaseBill {
  id: number;
  invoiceNo: string;
  transaction_date: string;
  internal_reference?: string;
  supplier_reference?: string;
  narration?: string;
  amount: number;
  vat_amount?: number;
  adjustment_amount?: number;
  net_amount: number;
  approved_payment_amount?: number;
  unapproved_amount?: number;
  // When true, approved_payment_amount/unapproved_amount above are capped
  // against the bill's originating Purchase Order (an advance already
  // approved directly on it) rather than this bill's own value.
  capped_by_purchase_order?: boolean;
  purchase_order_no?: string | null;
  total_amount?: number;
  paid_amount?: number;
  unpaid_amount?: number;
  stakeholder?: PurchaseBillStakeholder;
  source?: PurchaseBillSource;
  items?: PurchaseBillItem[];
  attachments?: PurchaseBillAttachment[];
}
