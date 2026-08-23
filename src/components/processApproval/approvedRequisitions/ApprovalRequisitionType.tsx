import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { User } from '@/types/auth-types';

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

export interface RequisitionSummary {
  id: number;
  requisitionNo: string;
  requisition_date: string;
  cost_center: CostCenter;
  creator: User;
  status_label: string;
  vat_amount: number;
  attachments_count?: number;
  currency?: Currency;
  imprest_ledger?: {
    id: number;
    name: string;
    code?: string;
  } | null;
  leave_items?: Array<{
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
  }>;
}

export interface BaseApprovalRequisition {
  id: number;
  amount: number;
  vat_amount: number;
  approval_date: string;
  creator: User;
  currency: Currency;
  process_type: 'PURCHASE' | 'MATERIAL' | 'PAYMENT' | 'IMPREST';
  remarks: string | null;
  status_label?: string;
  requisition: RequisitionSummary;
  next_approval_level?: ApprovalChainLevel | null;
  leave_items?: RequisitionSummary['leave_items'];
  can_retire?: boolean;
}

export interface PaymentApprovalRequisition extends BaseApprovalRequisition {
  process_type: 'PAYMENT' | 'IMPREST';
  is_fully_paid: boolean;
  payments_count: number;
}

export interface PurchaseApprovalRequisition extends BaseApprovalRequisition {
  process_type: 'PURCHASE';
  is_fully_ordered: boolean;
  purchase_orders_count: number;
}

export interface MaterialApprovalRequisition extends BaseApprovalRequisition {
  process_type: 'MATERIAL';
  is_fully_ordered: boolean;
  is_fully_paid: boolean;
  is_fully_issued: boolean;
  is_fully_fulfilled: boolean;
  has_issues: boolean;
  purchase_orders_count: number;
  payments_count: number;
  issues_count: number;
  imprest_amount?: number;
}

export type ApprovalRequisition =
  | PaymentApprovalRequisition
  | PurchaseApprovalRequisition
  | MaterialApprovalRequisition;
export type ApprovalRequisitionList = ApprovalRequisition[];

export type RequisitionProcessType = BaseApprovalRequisition['process_type'];
export type RequisitionAmount = {
  amount: number;
  vat_amount: number;
};

export const getRequisitionAmount = (
  req: ApprovalRequisition
): RequisitionAmount => ({
  amount: req.amount,
  vat_amount: req.requisition.vat_amount,
});
