import { Currency } from '@/components/masters/Currencies/CurrencyType';

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

export interface CertificateApproval {
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

export interface CertificateApprovalChain {
  id?: number;
  process_type?: string;
  levels?: ApprovalChainLevel[];
}

export interface Certificate {
  id?: number | string;
  certificateNo?: string;
  certificate_date?: string | null;
  remarks?: string | null;
  amount?: number | null;
  vat_percentage?: number | null;
  vat_amount?: number | null;
  total_amount?: number | null;
  currency?: Currency | null;
  status?: 'draft' | 'in_review' | 'rejected' | 'approved' | 'invoiced';
  // Backend-computed — "Waiting for {Role}" while under a pending approval
  // level, same convention as LeaveRequest.status_label.
  status_label?: string;
  invoice_date?: string | null;
  approval_chain_id?: number | null;
  approval_chain?: CertificateApprovalChain | null;
  approvals?: CertificateApproval[];
  // Present on the org-wide "Approved Subcontract Certificates" list
  // (project-subcontract-certificates endpoint) — not on the subcontract-scoped list.
  project_subcontract_id?: number | string;
  project?: { id?: number | string; name?: string } | null;
  subcontractor?: { id?: number | string; name?: string } | null;
}
