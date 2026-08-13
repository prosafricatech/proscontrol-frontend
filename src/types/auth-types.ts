  export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    is_admin: boolean;
    status: "active" | "invited" | "suspended";
    photo_path?: string | null;
    organization_roles?: Array<{ id: string; name: string; [key: string]: any }>;
    [key: string]: any;
  }

  interface OrganizationRole {
    id: string;
    name: string;
    [key: string]: any;
  }
  
  export interface Organization {
    id: string;
    name: string;
    email: string;
    roles?: OrganizationRole[];
    recording_start_date?: string | null;
    is_tra_connected?: boolean;
    base_currency?: {
      code: string;
    };
    active_subscriptions?: {
      modules: {
        id: string;
        name: string;
        settings?: {
          id: string;
          value: any;
        }[];
      }[];
      days_remaining?: number;
      status?: string;
      successor?: any;
    }[];
    [key: string]: any;
  }
  
  export interface AuthUser {
    id: string;
    name: string;
    email: string;
    user: User;
    [key: string]: any;
  }
  
  export interface AuthOrganization {
    organization: Organization;
    permissions?: string[];
    [key: string]: any;
  }

  export interface AuthObject {
    authUser: AuthUser;
    authOrganization: AuthOrganization;
    checkOrganizationPermission?: any
  }
  
  export interface AuthState {
    authToken: string | null;
    authUser: AuthUser;
    authOrganization: AuthOrganization | null;
  }
  
  export interface AuthResponse {
    data?: {
      token?: string;
      authUser?: AuthUser;
      authOrganization?: AuthOrganization;
      [key: string]: any;
    };
    status?: number;
    hasError?: boolean;
    error?: string;
    [key: string]: any;
  }
  
  export interface AuthConfig {
    token?: string | null;
    OrganizationId?: string | null;
    currentUser?: AuthUser;
    currentOrganization?: AuthOrganization | null;
    refresh?: boolean;
  }
  
  export interface TokenMetadata {
    geolocation_accuracy?: number;
    latitude?: number;
    longitude?: number;
    fcm_token?: string;
    [key: string]: any;
  }
  
  export interface BasicAuthContextType {
    signUp: (
      userData: any, 
      successCallback: (data: any) => void, 
      errorCallback: (error: any) => void
    ) => Promise<void>;
    signIn: (
      email: string, 
      password: string, 
      successCallback: (data: any) => void, 
      errorCallback: (error: any) => void
    ) => Promise<void>;
    logout: () => Promise<void>;
    configAuth: (config: AuthConfig) => Promise<void>;
    loadOrganization: (
      organization_id: string, 
      successCallback: (data: any) => void, 
      errorCallback: (error: any) => void
    ) => Promise<void>;
  }