import { CostCenter } from '@/components/masters/costCenters/CostCenterType';

type EmployeesType = {
  employee_id: number;
  employee_number: string | null;
  name: string;
  bank_name: string | null;
  branch: string | null;
  bank_code: string | null;
  account_number: string | null;
  account_name: string | null;
  net_salary: number;
};

export type SalarySheetType = {
  run: {
    id: number;
    status: string;
    period: {
      year: number;
      month: number;
    };
    cost_center?: CostCenter;
  };
  rows: EmployeesType[];
  total_net_salary: number;
  total_employees: number;
  employees_without_bank_account: number;
  zero_pay_employees?: {
    employee_id: number;
    employee_number: number;
    name: string;
  }[];
};
