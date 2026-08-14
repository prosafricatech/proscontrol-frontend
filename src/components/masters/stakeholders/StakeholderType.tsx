export type StakeholderType = 
  | 'Individual'
  | 'Group'
  | 'Sole Proprietor'
  | 'Partnership'
  | 'Private Limited'
  | 'Public Liability'
  | 'Government Institution'
  | 'Non-Government Organization';

export interface Stakeholder {
  id: number;
  name: string;
  type: StakeholderType;
  tin: string | null;
  vrn: string | null;
  ledger_code?: string | null;
  address: string;
  currency_id?: number | null;
  has_transactions?: boolean;
  currency?: {
    id: number;
    name: string;
    code: string;
    symbol: string;
    name_plural: string;
    symbol_native: string;
  } | null;
  email: string | null;
  phone: string | null;
  remarks: string | null;
  groups?: { id: number; name: string }[];
  website: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: number;
  create_receivable: boolean;
  create_payable: boolean;
}

export type Stakeholders = Stakeholder[];