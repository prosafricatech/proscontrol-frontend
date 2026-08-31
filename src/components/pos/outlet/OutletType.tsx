
export interface Counter {
  name: string;
  ledger_ids: number[];
}

export interface Store {
  id: number;
  name: string;
  children?: any;
}

export interface user {
  id: number;
  name: string;
}

export interface Project {
  id: number;
  name: string;
  projectNo?: string;
}

export interface ProductCategory {
  id: number;
  name: string;
}

export interface Outlet {
  id?: number | string;
  name: string;
  address?: string;
  type?: string;
  users: user[];
  stores: Store[];
  counters: Counter[];
  project_id?: number | null;
  project?: Project | null;
  product_categories?: ProductCategory[];
}

export interface AddOutletResponse {
  message: string;
  data?: any; 
}
export interface DeleteOutletResponse {
  message: string;
}
export interface UpdateOutletResponse {
  message: string;
  data?: Outlet;  
}
export interface PaginatedOutletResponse {
  data: Outlet[];
  current_page: number;
  total: number;
  last_page: number;
}
export interface OutletSelectorProps {
  onChange: (value: Outlet | Outlet[] | null) => void;
  multiple?: boolean;
  label?: string;
  defaultValue?: number | null;
  frontError?: { message: string } | null;
}