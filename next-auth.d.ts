import 'next-auth';

declare module 'next-auth' {
  interface User {
    authUser?: {
      fcmTokens: string[] | null;
      user?: {
        id: number;
        email: string;
        name: string;
        phone: string;
        is_admin: boolean;
        is_staff: boolean;
        roles:
          | {
              id: number;
              name: string;
            }[]
          | null;
        organization_roles: {
          id: number;
          name: string;
        }[];
      };
      permissions: string[];
    };
    authOrganization: {
      organization: Record<string, any>;
      costCenters?: {
        id: number;
        name: string;
        type: string;
        status: string;
        description?: string;
      }[];
      stores: Record<string, any>[];
      permissions: string[];
      base_currency: Record<string, any>;
    };
    accessToken?: string;
  }

  interface Session {
    user: User;
    expires: string;
    error: string;
  }
}
