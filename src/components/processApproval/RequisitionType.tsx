import { User } from '@/types/auth-types';
import { Ledger } from '../accounts/ledgers/LedgerType';
import { CostCenter } from '../masters/costCenters/CostCenterType';
import { Currency } from '../masters/Currencies/CurrencyType';
import { MeasurementUnit } from '../masters/measurementUnits/MeasurementUnitType';
import { Stakeholder } from '../masters/stakeholders/StakeholderType';
import { Product } from '../productAndServices/products/ProductType';

interface Role {
  id: number;
  name: string;
}

export interface ApprovalChainLevel {
  id: number;
  approval_chain_id: number;
  role_id: number;
  is_final: number;
  position_index: number;
  label: string;
  can_override: number;
  can_finalize: number;
  remarks: string | null;
  role: Role;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  deleted_at: string | null;
}

export interface Approval {
  id: number;
  approval_chain_level_id: number;
  items: RequisitionItem[];
  requisition?: Requisition;
  approval_date: string;
  date_required?: string;
  amount: number;
  has_orders?: boolean;
  approval_chain_level: ApprovalChainLevel;
  // Set only when status is 'returned': the earlier level this was sent back
  // to, or null/absent when it was sent all the way back to the requester.
  returned_to_level?: ApprovalChainLevel | null;
  // True once a return-to-requester has been resubmitted — the chain restarted,
  // so this row is historical only (no Approve/Edit/Delete should act on it).
  is_superseded?: boolean;
  creator: User;
  has_payments: boolean;
  is_final: number;
  remarks: string | null;
  status: string;
  status_label: string;
  vat_amount: number;
  narration?: string;
  imprest_ledger?: Ledger;
  imprest_ledger_balance?: { amount: number; side: string };
  // Balance as of this approval's approval_date — for read-only previews.
  imprest_ledger_balance_at_approval?: { amount: number; side: string };
}

export interface ApprovalChain {
  id: number;
  process_type: 'PURCHASE' | 'MATERIAL' | 'PAYMENT' | 'LEAVE_REQUEST' | 'IMPREST';
  cost_center_id: number;
}

export interface LeaveRequisitionItem {
  id?: number;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason?: string;
  employee?: {
    id: number;
    employee_number?: string;
    first_name?: string;
    last_name?: string;
  };
  leave_type?: {
    id: number;
    name?: string;
  };
  [key: string]: any;
}

export interface RelatableTransaction {
  id: number;
  relatableNo: string;
  order_date: string;
  total_amount: number;
  currency?: {
    code: string;
  };
  unapproved_amount: number;
  [key: string]: any;
}

export interface RequisitionLedgerItem {
  ledger_id?: number;
  ledger?: Ledger;
  quantity?: number;
  rate?: number;
  amount?: number;
  relatable_type?: string | null;
  relatable?: RelatableTransaction | null;
  relatable_id?: number | null;
  measurement_unit_id?: number;
  measurement_unit?: MeasurementUnit;
  unit_symbol?: string;
  remarks?: string;
  [key: string]: any;
}

export interface Vendor {
  id: number;
  stakeholder_id?: number;
  stakeholder?: Stakeholder;
  remarks?: string;
  name: string;
}

export interface PurchaseItem {
  id: number;
  product: Product;
  quantity: number;
  relatableNo?: string;
  rate: number;
  measurement_unit: MeasurementUnit;
  remarks: string | null;
  vat_percentage?: number;
  vendors?: Vendor[];
  [key: string]: any;
}

export interface Relatable {
  id: number;
  orderNo: string;
  order_date: string;
}

export interface PaymentItem {
  id: number;
  ledger: Ledger;
  quantity: number;
  rate: number;
  measurement_unit: MeasurementUnit;
  relatable: Relatable | null;
  relatableNo?: string;
  relatable_id: number | null;
  relatable_type: string | null;
  remarks: string | null;
  vat_percentage?: number;
  vendors?: Vendor[];
  [key: string]: any;
}

export interface BaseRequisition {
  id: number;
  requisitionNo: string;
  requisition_date: string;
  date_required?: string;
  amount: number;
  vat_amount: number;
  approval_chain: ApprovalChain;
  approvals: Approval[];
  approvals_count: number;
  attachments: any[];
  attachments_count: number;
  cost_center: CostCenter;
  creator: User;
  currency: Currency;
  next_approval_level: ApprovalChainLevel | null;
  process_type: 'PURCHASE' | 'MATERIAL' | 'PAYMENT' | 'LEAVE_REQUEST' | 'IMPREST';
  reference: string | null;
  remarks: string | null;
  status: string;
  status_label: string;
  // True once the latest action is a return-to-requester: the requester may
  // edit and resubmit, which restarts the chain at level one.
  is_returned_to_requester?: boolean;
  leave_items?: LeaveRequisitionItem[];
  imprest_ledger_id?: number;
  imprest_ledger?: Ledger;
  imprest_ledger_balance?: { amount: number; side: string };
}

export interface PurchaseRequisition extends BaseRequisition {
  process_type: 'PURCHASE';
  items: PurchaseItem[];
  is_fully_ordered: boolean;
}

export interface MaterialRequisition extends BaseRequisition {
  process_type: 'MATERIAL';
  items: PurchaseItem[];
  is_fully_ordered?: boolean;
  is_fully_paid?: boolean;
  is_fully_fulfilled?: boolean;
  has_issues?: boolean;
}

export interface PaymentRequisition extends BaseRequisition {
  process_type: 'PAYMENT';
  items: PaymentItem[];
  is_fully_paid: boolean;
}

export interface ImprestRequisition extends BaseRequisition {
  process_type: 'IMPREST';
  items: PaymentItem[];
  imprest_ledger_id: number;
  imprest_ledger?: Ledger;
  is_fully_ordered?: boolean;
}

export interface LeaveRequestRequisition extends BaseRequisition {
  process_type: 'LEAVE_REQUEST';
  leave_items: LeaveRequisitionItem[];
  is_fully_ordered?: boolean;
}

export type Requisition =
  | PurchaseRequisition
  | MaterialRequisition
  | PaymentRequisition
  | LeaveRequestRequisition
  | ImprestRequisition;
export type RequisitionItem = PurchaseItem | PaymentItem | LeaveRequisitionItem;

// For the list of requisitions
export type RequisitionList = Requisition[];
