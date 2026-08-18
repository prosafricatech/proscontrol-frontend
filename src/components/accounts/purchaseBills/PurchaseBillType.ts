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
  stakeholder?: PurchaseBillStakeholder;
  source?: PurchaseBillSource;
}
