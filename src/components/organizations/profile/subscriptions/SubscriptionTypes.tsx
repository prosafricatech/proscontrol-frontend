import { Organization } from '@/types/auth-types';
import { Dayjs } from 'dayjs';

export interface Currency {
  id: number;
  name: string;
  symbol: string;
  code: string;
  exchangeRate: number;
}

export interface ModuleSetting {
  id: number;
  name: string;
  data_type: string;
  description: string;
  value: boolean | string | number;
}

export interface SubscriptionModule {
  id: number;
  name: string;
  rate: number;
  monthly_rate?: number;
  description?: string;
  settings?: ModuleSetting[];
  additional_features?: any;
}

export interface AdditionalFeature {
  id: number;
  subscription_id?: number;
  additional_feature_id?: number;
  quantity: number;
  name?: string;
  rate: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  description: string | null;
  unit?: any;
  feature: {
    id: number;
    name: string;
    description?: string | null;
    measurement_unit_id?: number;
    unit: {
      id: number;
      name: string;
      symbol: string;
    };
  };
}

export interface Subscription {
  id: number;
  organization_id: number;
  organization?: Organization;
  start_date: string | Dayjs;
  end_date: string | Dayjs;
  months: number;
  remarks?: string;
  grace_period: number;
  subscriptionNo?: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: number;
  currency_id: number;
  currency: Currency;
  exchange_rate: number;
  days_remaining: number;
  renewal_window: number;
  status: string;
  modules: SubscriptionModule[];
  additional_features: AdditionalFeature[];
  successor?: {
    id: number;
    organization_id: number;
    start_date: string;
    months: number;
    grace_period: number;
    created_at: string;
    created_by: number;
    currency_id: number;
    days_remaining: number;
    deleted_at: string | null;
    end_date: string;
    exchange_rate: number;
    remarks: string | null;
    renewal_window: number;
    status: string;
    subscriptionNo: string;
    updated_at: string;
  };
}
