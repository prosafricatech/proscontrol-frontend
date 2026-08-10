export interface EmployeeDeductionType {
  id: number;
  employee_id: number;
  deduction_type_id: number;
  member_no?: string | null;
  value: number;
  effective_from: string;
  effective_to?: string | null;
  created_by: number;
  created_at?: string;
  updated_at?: string;
  employee?: {
    id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    employee_number?: string;
  };
  deduction_type?: {
    id: number;
    name: string;
    category?: string;
    computation_method?: string;
    is_pre_tax?: boolean;
  };
}
