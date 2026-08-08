import { DeductionType } from '@/components/humanResources/deductionTypes/DeductionType';
import { Employee } from '@/components/humanResources/employees/EmployeesType';
import { Department } from '@/components/humanResources/departments/DepartmentsType';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import { Currency } from '@/components/organizations/profile/subscriptions/SubscriptionTypes';

export type LoanRequestStatus =
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export interface LoanRequestApprovalChainLevel {
  id: number;
  approval_chain_id: number;
  role_id: number;
  position_index: number;
  label?: string | null;
  can_override: number;
  can_finalize: number;
  remarks?: string | null;
  status: 'active' | 'inactive';
  role?: {
    id: number;
    name: string;
  };
}

export interface LoanRequestApprovalChain {
  id: number;
  process_type: string; // "LOAN"
  cost_center_id?: number | null;
  remarks?: string | null;
  status: 'active' | 'inactive';
  levels?: LoanRequestApprovalChainLevel[];
}

export interface LoanRequestApproval {
  id?: number;
  loan_request_id?: number;
  chain_level_id?: number;
  approval_chain_level_id?: number;
  status?: 'approved' | 'rejected' | 'on hold' | string;
  status_label?: string;
  amount_approved?: number | null;
  installments_approved?: number | null;
  remarks?: string | null;
  approval_date?: string | null;
  creator?: {
    id?: number;
    name?: string;
  };
}

export interface LoanRequestPayment {
  id: number;
  amount: number;
  cost_centers: CostCenter[];
  created_at: string;
  creator: { id: number; name: string; email: string; phone: string };
  credit_ledger_id: number;
  currency: Currency;
  voucherNo: string;
  narration: string;
  reference: string;
}

export interface LoanRequestType {
  id: number;
  employee_id: number;
  cost_center_id: number | null;
  department_id: number | null;
  approval_chain_id: number | null;
  amount: number;
  installments: number;
  amount_approved: number | null;
  installments_approved: number | null;
  installment_amount: number | null;
  reason: string | null;
  requested_at: string | null;
  status: LoanRequestStatus;
  // Backend-computed — "Waiting for {Role}" while under a pending approval
  // level, same convention as Requisitions; otherwise the ucwords'd status.
  status_label?: string;
  deduction_type_id: number | null;
  employee_deduction_id: number | null;
  reviewed_by: number | null;
  review_remarks: string | null;
  reviewed_at: string | null;
  payment_id: number | null;
  disbursed_at: string | null;
  disbursed_by: {
    id: number;
    name: string;
    email: string;
    phone: string;
  } | null;
  disbursement_reference: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  employee?: Employee;
  cost_center?: CostCenter | null;
  department?: Department | null;
  deduction_type?: DeductionType | null;
  payment?: LoanRequestPayment | null;
  approval_chain?: LoanRequestApprovalChain | null;
  approvals?: LoanRequestApproval[];
}
