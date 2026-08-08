// In EmployeesType.ts
export interface Employee {
  id: number;
  employee_number: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: string;
  email: string;
  phone_number: string;
  address: string;
  date_of_birth: string;
  designation_id?: number;
  basic_salary?: number | null;
  contract_start_date?: string | null;
  national_id: string;
  passport_number?: string;
  photo_path?: string;
  department_id?: number;
  cost_center_id?: number | null;
  manager_id?: number | null;
  payable_ledger_id?: number | null;
  create_payable?: boolean;
  payable_ledger_name?: string | null;
  employment_type?: string;
  join_date?: string;
  user_id?: number | null;
  created_by: number;
  created_at?: string;
  updated_at?: string;
  department: {
    id: number;
    name: string;
    code: string;
  };
  cost_center?: {
    id: number;
    name: string;
  } | null;
  manager?: {
    id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
  } | null;
  active_contract: {
    id: number;
    basic_salary: number;
    contract_type: string;
    status: string;
    designation: {
      id: number;
      title: string;
    };
  };
}
