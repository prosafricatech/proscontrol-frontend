import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';

export interface Product {
  id: number;
  name: string;
  item_name?: string;
  code: string;
  description?: string;
  type?: string;
  vat_exempted?: boolean;
  measurement_unit_id: number;
  unit_symbol?: string;
  product_id?: number;
  product_category_id?: number;
  category?: {
    income_ledger_id?: number;
  };
  measurement_unit: MeasurementUnit;
  primary_unit?: {
    id: number;
    name: string;
    unit_symbol: string;
    conversion_factor?: any;
  };
  secondary_units?: Array<{
    id: number;
    name: string;
    unit_symbol: string;
    conversion_factor: number;
  }>;
  selling_prices?: Array<{
    id: number;
    price: number;
    sales_outlet_id: number;
  }>;
  created_at?: string;
  updated_at?: string;
  main_photo?: ProductPhoto | null;
  thumbnail?: string | null;
  photos?: ProductPhoto[];
}

export interface ProductPhoto {
  id: number;
  path: string;
  full_path: string;
  is_main: boolean;
  sort_order: number;
}

export interface ProductOption {
  id: number;
  name: string;
  code: string;
  product_id?: number;
  unit_symbol?: string;
  thumbnail?: string | null;
  measurement_unit: {
    id: number;
    symbol: string;
  };
  vat_exempted: boolean;
  primary_unit?: {
    id: number;
    unit_symbol: string;
  };
  secondary_units?: Array<{
    id: number;
    unit_symbol: string;
  }>;
}

export interface ProductFormValues {
  id?: number;
  name: string;
  code: string;
  description?: string;
  type?: string;
  product_id?: number;
  vat_exempted: boolean;
  measurement_unit_id: number;
  primary_unit_id?: number;
  secondary_units?: Array<{
    measurement_unit_id: number;
    conversion_factor?: number;
  }>;
}

export interface ProductSellingPrice {
  id?: number;
  product_id: number;
  sales_outlet_id: number;
  price: number;
}

export interface ProductStock {
  id?: number;
  product_id: number;
  store_id: number;
  quantity: number;
  minimum_quantity?: number;
}
