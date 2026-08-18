export interface Currency {
  code?: string;
}

export interface ApprovalChainLevel {
  id: number;
  position_index?: number;
  label?: string;
  role?: {
    id?: number;
    name?: string;
  };
  can_override?: boolean;
  can_finalize?: boolean;
}

export interface ProjectClaimApproval {
  id?: number;
  approval_chain_level_id?: number;
  status?: 'approved' | 'on hold' | 'rejected';
  is_final?: boolean;
  remarks?: string | null;
  approval_date?: string | null;
  creator?: {
    id?: number;
    name?: string;
    email?: string;
    phone?: string;
  };
  approval_chain_level?: ApprovalChainLevel;
}

export interface ProjectClaimApprovalChain {
  id?: number;
  process_type?: string;
  levels?: ApprovalChainLevel[];
}

export interface ProjectClaim {
  id: number;
  claim_date?: string;
  claimNo?: string;
  remarks?: string;
  amount?: number;
  vat_percentage?: number | null;
  vat_amount?: number | null;
  total_amount?: number | null;
  currency?: Currency;
  status?: 'draft' | 'in_review' | 'rejected' | 'approved' | 'invoiced';
  // Backend-computed — "Waiting for {Role}" while under a pending approval
  // level, same convention as LeaveRequest.status_label.
  status_label?: string;
  invoice_date?: string | null;
  approval_chain_id?: number | null;
  approval_chain?: ProjectClaimApprovalChain | null;
  approvals?: ProjectClaimApproval[];
  // Present on the org-wide "Approved Project Payment Claims" list
  // (project-payment-claims org-wide endpoint) — not on the project-scoped list.
  project_id?: number | string;
  project?: { id?: number | string; name?: string } | null;
  client?: { id?: number | string; name?: string } | null;
}
