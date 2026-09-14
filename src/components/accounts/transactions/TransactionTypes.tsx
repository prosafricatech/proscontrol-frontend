import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import { Currency } from '@/components/masters/Currencies/CurrencyType';

export type TransactionTypes =
  | 'payments'
  | 'receipts'
  | 'journal_vouchers'
  | 'transfers'
  | string;

type Creator = {
  id: number;
  name: string;
  email: string;
  phone: string;
};

export type BaseTransaction = {
  id: number;
  transaction_date: string;
  narration: string;
  reference: string | null;
  cost_centers: CostCenter[];
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
  creator: Creator;
  currency: Currency;
  voucherNo: string;
  requisitionNo?: number;
  requisition_approval_id?: number;
  editable?: boolean;
  attachments_count?: number;
  cancellable?: boolean;
  cancelled_at?: string | null;
  cancel_reason?: string | null;
};

export type PaymentTransaction = BaseTransaction & {
  type: 'payment';
  amount: number;
  requisitionNo: string;
  requisition_approval_id: number;
};

export type ReceiptTransaction = BaseTransaction & {
  type: 'receipt';
  amount: number;
  editable?: boolean;
  journals_sum_amount: number;
  receiptable_id: number | null;
  receiptable_type: string | null;
  debit_ledger_id: number;
};

export type JournalVoucherTransaction = BaseTransaction & {
  type: 'journal_voucher';
  amount: number;
  editable?: boolean;
  journals_sum_amount: number;
};

export type TransferTransaction = BaseTransaction & {
  type: 'transfer';
  amount: number;
  journals_sum_amount: number;
  credit_ledger_id: number;
};

export type Transaction =
  | PaymentTransaction
  | ReceiptTransaction
  | JournalVoucherTransaction
  | TransferTransaction;
