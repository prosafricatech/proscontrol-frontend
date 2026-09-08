export type HrDashboardEmployeeOnLeave = {
  employee_id: number;
  employee_number?: string;
  employee_name: string;
  leave_type?: string;
  start_date?: string;
  end_date?: string;
  returns_in_days: number;
};

export type HrDashboardActiveLoanRow = {
  loan_id: number;
  employee_id: number;
  employee_number?: string;
  employee_name: string;
  amount_approved: number;
  outstanding_balance: number;
  installment_amount: number;
};

export type HrDashboardExpiringContract = {
  contract_id: number;
  employee_id: number;
  employee_number?: string;
  employee_name: string;
  designation?: string;
  contract_type?: string;
  end_date?: string;
  days_remaining: number;
};

export type HrDashboardBirthday = {
  employee_id: number;
  employee_number?: string;
  employee_name: string;
  date_of_birth: string;
  next_birthday: string;
  days_away: number;
};

export type HrDashboardPayrollRun = {
  id: number;
  cost_center_id?: number | null;
  status: string;
};

export type HrDashboardData = {
  employees_on_leave: HrDashboardEmployeeOnLeave[];
  active_loans: {
    total_outstanding: number;
    count: number;
    rows: HrDashboardActiveLoanRow[];
  };
  expiring_contracts: HrDashboardExpiringContract[];
  upcoming_birthdays: HrDashboardBirthday[];
  headcount: {
    total_employees: number;
    new_hires_this_month: number;
  };
  pending_approvals: {
    loan_requests: number;
    leave_requests: number;
  };
  current_payroll: {
    period_id: number;
    period_label: string;
    runs: HrDashboardPayrollRun[];
    has_any_run: boolean;
  } | null;
};
