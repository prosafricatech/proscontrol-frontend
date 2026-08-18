export interface Ledger {
  id: number;
  name: string;
  code: string | null;
  ledger_group_id: number;
  alias: string | null;
  stakeholders?: { id: number; name: string }[];
}

export interface LedgerGroup {
  id: number;
  name: string;
  original_name?: string;
  alias: string | null;
  code: string | null;
  description: string | null;
  ledger_group_id: number | null;
  nature_id: number;
  is_editable: number;

  // Nested children
  children_with_ledgers?: LedgerGroup[];
  ledgers?: Ledger[];
}
