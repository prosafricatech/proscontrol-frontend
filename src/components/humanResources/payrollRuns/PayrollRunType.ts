export interface PayrollRunType {
  id: number;
  payroll_period_id: number;
  cost_center_id?: number | null;
  employee_id: number;
  employee_contract_id: number;
  basic_salary: number;
  gross_salary?: number;
  paye: number;
  total_allowances?: number;
  total_deductions?: number;
  payslip_count?: number;
  // From PayrollRunController::index()'s ->withCount('payslips') — the
  // number of employees with a payslip on this run. employee_count below
  // is never actually sent by the API; keep using this one.
  payslips_count?: number;
  created_by_user?: {
    first_name: string;
    last_name: string;
  }
  employee_count?: number;
  net_salary?: number;
  requires_approval?: boolean;
  payroll_period?: {
    id: number;
    name?: string;
    month?: number;
    year?: number;
    start_date?: string;
    end_date?: string;
  };
  approval_chain_id?: number | null;
  status?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  designation?: string;
  cost_center?: {
    id?: number;
    name?: string;
  } | null;
  journal_voucher?: {
    id?: number;
    voucher_no?: string;
  };
  payment?: {
    id?: number;
    voucher_no?: string;
  };
  approval_chain?: {
    id?: number;
    levels?: Array<{
      id: number;
      name?: string;
      level_name?: string;
      level?: number;
      status?: string;
      role?: {
        id?: number;
        name?: string;
      };
    }>;
  } | null;
  approvals?: Array<{
    id?: number;
    chain_level_id?: number;
    approval_chain_level_id?: number;
    status?: string;
    label?: string;
    remarks?: string;
    approval_date?: string;
    creator?: {
      id?: number;
      name?: string;
    };
  }>;
  employee?: {
    id: number;
    first_name?: string;
    last_name?: string;
    employee_number?: string;
    department?: {
      id?: number;
      name?: string;
    };
    cost_center?: {
      id?: number;
      name?: string;
    };
  };
  contract?: {
    id: number;
    basic_salary?: number;
    designation?: {
      id?: number;
      title?: string;
    };
  };
  allowances?: Array<{
    id?: number;
    allowance_type_id?: number;
    label?: string;
    amount?: number | string;
    value?: number | string;
    allowance_type?: {
      id?: number;
      name?: string;
    };
  }>;
  deductions?: Array<{
    id?: number;
    deduction_type_id?: number;
    label?: string;
    category?: string;
    is_pre_tax?: boolean;
    amount?: number | string;
    value?: number | string;
    deduction_type?: {
      id?: number;
      name?: string;
      category?: string;
      is_pre_tax?: boolean;
    };
  }>;
  employer_contributions?: Array<{
    id?: number;
    employer_contribution_type_id?: number;
    label?: string;
    category?: string;
    amount?: number | string;
    value?: number | string;
    contribution_type?: {
      id?: number;
      name?: string;
      category?: string;
    };
  }>;
  payslips?: Array<{
    id?: number;
    payroll_run_id?: number;
    employee_id?: number;
    basic_salary?: number;
    gross_salary?: number;
    net_salary?: number;
    paye?: number;
    total_allowances?: number;
    total_deductions?: number;
    [key: string]: any;
  }>;
  status_label?: string;
  next_approval_level?: {
    role?: {
      name?: string;
    };
  };
}

