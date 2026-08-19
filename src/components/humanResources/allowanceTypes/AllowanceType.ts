import { Ledger } from '@/components/accounts/ledgers/LedgerType';

export interface AllowanceType {
  id: number;
  name: string;
  code?: string;
  is_taxable: boolean;
  default_value?: number;
  expense_ledger_id?: number;
  expense_ledger?: Ledger;
  description?: string;
  created_by: number;
  created_at?: string;
  updated_at?: string;
}
