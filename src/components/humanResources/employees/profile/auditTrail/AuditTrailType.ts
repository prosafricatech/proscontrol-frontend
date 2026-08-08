export interface Movement {
  id: number;
  from_cost_center_id?: number | null;
  to_cost_center_id?: number | null;
  from_department_id?: number | null;
  to_department_id?: number | null;
  from_manager_id?: number | null;
  to_manager_id?: number | null;
  moved_date: string;
  reason?: string | null;
  created_by: number;
  created_at: string;
  from_cost_center?: {
    id: number;
    name: string;
  } | null;
  to_cost_center?: {
    id: number;
    name: string;
  } | null;
  from_department?: {
    id: number;
    name: string;
  } | null;
  to_department?: {
    id: number;
    name: string;
  } | null;
  from_manager?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
  to_manager?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
  creator?: {
    id: number;
    first_name?: string;
    last_name?: string;
  };
}

export interface SalaryChange {
  id: number;
  from_basic_salary: number;
  to_basic_salary: number;
  effective_date: string;
  reason?: string | null;
  created_by: number;
  created_at: string;
  creator?: {
    id: number;
    first_name?: string;
    last_name?: string;
  };
}

export interface SalaryHistoryResponse {
  contract: {
    id: number;
    employee_id: number;
    employee_name: string;
    current_basic_salary: number;
  };
  salary_changes: SalaryChange[];
}