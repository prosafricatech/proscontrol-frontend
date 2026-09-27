/** What the session keeps per prosERP organization (logos/roles are dropped to keep the cookie small). */
export type SessionOrganization = { id: string; name: string; autoload: boolean };

// Keeps the session cookie bounded even for users in many organizations.
const MAX_ORGANIZATIONS = 100;

/**
 * Normalizes `organizations` from the backend login response (prosERP's
 * `GET /organizations` data: id, name, autoload, logo_path, roles).
 * Autoload organizations first, then by name.
 */
export function toSessionOrganizations(raw: unknown): SessionOrganization[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((org) => org && org.id !== undefined && org.id !== null && typeof org.name === 'string' && org.name.trim())
    .map((org) => ({ id: String(org.id), name: org.name.trim(), autoload: Boolean(Number(org.autoload)) }))
    .sort((a, b) => Number(b.autoload) - Number(a.autoload) || a.name.localeCompare(b.name))
    .slice(0, MAX_ORGANIZATIONS);
}
