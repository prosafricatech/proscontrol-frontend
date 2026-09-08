import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';
import { Currency } from '../../masters/Currencies/CurrencyType';

interface DebitLedger {
  id: number;
  name: string;
  ledger_group_id: number;
}

export interface SalesOrder {
  id?: number;
  transaction_date: string | Date;
  saleNo: string;
  reference: string | null;
  amount: number;
  created_at: string;
  currency: Currency;
  currency_id?: number;
  debit_ledger: DebitLedger;
  asset_booking?: {
    id: number;
    code: string;
    start_at: string;
    end_at: string;
    asset_detail?: { id: number; code: string; product_item?: { identification: string } };
  } | null;
  exchange_rate: number;
  has_receipts: boolean;
  is_fully_paid: boolean;
  is_instant_sale: boolean;
  is_invoiceable: boolean;
  is_invoiced: boolean;
  creator?: {
    name: string;
  };
  sales_outlet?: {
    name: string;
  };
  sale_items?: Array<{
    id: number;
    product: {
      name: string;
      vat_exempted?: boolean;
    };
    description?: string;
    quantity: number;
    rate: number;
    measurement_unit: {
      symbol: string;
    };
    vat_exempted?: number; // Add this if needed
  }>;
  items?: Array<{
    id: number;
    product: {
      name: string;
      vat_exempted?: boolean;
    };
    description?: string;
    quantity: number;
    rate: number;
    measurement_unit: {
      symbol: string;
    };
    vat_exempted?: number; // Add this if needed
  }>;
  is_receiptable: boolean;
  payment_method: string;
  receiptable_amount: number;
  remarks: string | null;
  sales_person: string;
  stakeholder: Stakeholder;
  status:
    | 'Complete'
    | 'Fulfilled'
    | 'Partially Fulfilled'
    | 'Over Fulfilled'
    | 'Pending'
    | 'Ordered';
  vat_amount: number;
  vat_percentage: number;
  vfd_receipt: null;
  attachments_count?: number;
}
