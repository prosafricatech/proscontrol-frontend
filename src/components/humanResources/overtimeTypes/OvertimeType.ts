export interface OvertimeType {
  id: number;
  name: string;
  code?: string;
  multiplier: number;
  is_taxable: boolean;
  description?: string;
  created_by: number;
  created_at?: string;
  updated_at?: string;
}
