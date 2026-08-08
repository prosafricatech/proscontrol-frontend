export interface LeaveRequestType {
  id: number;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  days_requested: number;
  days_granted?: number | null;
  reason?: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'cancelled';
  // Backend-computed — "Waiting for {Role}" while under a pending approval
  // level, same convention as Requisitions; otherwise the ucwords'd status.
  status_label?: string;
  cost_center_id?: number | null;
  approval_chain_id?: number | null;
  reviewed_by?: number | null;
  review_remarks?: string | null;
  reviewed_at?: string | null;
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
  };
  approval_chain?: {
    id?: number;
    levels?: Array<{
      id: number;
      name?: string;
      level_name?: string;
      level?: number;
      position_index?: number;
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
    status_label?: string;
    days_approved?: number;
    remarks?: string;
    approval_date?: string;
    creator?: {
      id?: number;
      name?: string;
    };
  }>;
}
