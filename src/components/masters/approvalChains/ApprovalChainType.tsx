import { CostCenter } from "../costCenters/CostCenterType";
import { Department } from "../../humanResources/departments/DepartmentsType";

export interface ApprovalChain {
    id: number;
    process_type: "PURCHASE" | "PAYMENT" | string;
    cost_center_id: number | null;
    cost_center: CostCenter;
    department_id: number | null;
    department: Department | null;
    remarks?: string | null;
    created_by: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    status: "active" | string;
}

interface Role {
  id: number;
  name: string;
  [key: string]: any;
}

export interface ApprovalChainLevel {
  id?: number;
  approval_chain_id?: number;
  position_index?: number;
  can_finalize?: number;
  can_override?: number;
  label?: string;
  remarks?: string;
  role_id?: number;
  role?: Role;
  status: 'active' | 'inactive' | string;
}

export interface ApprovalChainItem {
  can_finalize: number;
  can_override: number;
  label: string;
  remarks?: string;
  role_id?: number | null; 
  role?: Role | null;
  [key: string]: any;
}
