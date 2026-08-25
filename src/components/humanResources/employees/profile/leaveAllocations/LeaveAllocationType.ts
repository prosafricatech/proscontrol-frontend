export interface LeaveAllocationType {
  id: number;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date?: string;
  allocated_days: number;
  used_days?: number;
  remaining_days?: number;
  carried_forward_days?: number;
  carried_forward_from_id?: number | null;
  carry_forward_expires_at?: string | null;
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
  leave_type?: {
    id: number;
    name: string;
    days_per_year?: number;
    cycle_months?: number;
    carry_forward_months?: number | null;
  };
}
