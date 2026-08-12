import { MeasurementUnit } from "@/components/masters/measurementUnits/MeasurementUnitType";
import { Product } from "@/components/productAndServices/products/ProductType";

interface SalesOutlet {
  id: number;
  name: string;
  address: string | null;
  status: "active" | "inactive"; 
  type: "shop" | string; 
  created_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  pivot: {
    price_list_item_id: number;
    sales_outlet_id: number;
  };
}

export interface PriceListItem {
  id: number;
  sales_outlet_ids?: number;
  price_list_id: number;
  product_id: number;
  unit_symbol?: string;
  measurement_unit_id: number;
  conversion_factor: number;
  price: number;
  bottom_cap: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  measurement_unit: MeasurementUnit;
  product: Product;
  sales_outlets: SalesOutlet[];
}

export interface PriceList {
  id: number;
  effective_date: string;
  narration: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  items: PriceListItem[];
}