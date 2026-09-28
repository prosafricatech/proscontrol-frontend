'use client';

import { useSession } from 'next-auth/react';
import type { SessionOrganization } from './organizations';

/**
 * The signed-in user's prosERP organizations, captured at login. Empty for
 * guests, and for sessions started before the backend returned organizations
 * (they appear after the next sign-in).
 */
export function useUserOrganizations(): SessionOrganization[] {
  const { data } = useSession();
  const organizations = (
    data as { organizations?: SessionOrganization[] } | null
  )?.organizations;
  return Array.isArray(organizations) ? organizations : [];
}
