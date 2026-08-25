export interface LeaveType {
  id: number;
  name: string;
  days_per_year: number;
  cycle_months?: number;
  carry_forward_months?: number | null;
  created_by: number;
  created_at?: string;
  updated_at?: string;
}
