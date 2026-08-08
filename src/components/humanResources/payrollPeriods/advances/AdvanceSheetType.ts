type AdvanceRowType = {
  employee_id: number;
  employee_number: string | null;
  name: string;
  bank_name: string | null;
  branch: string | null;
  bank_code: string | null;
  account_number: string | null;
  account_name: string | null;
  amount: number;
  paid: boolean;
};

export type AdvanceSheetType = {
  period: {
    year: number;
    month: number;
  };
  rows: AdvanceRowType[];
  total_amount: number;
  total_employees: number;
  employees_without_bank_account: number;
};
