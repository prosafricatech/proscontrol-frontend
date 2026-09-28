/**
 * What the session keeps per prosERP organization. Roles are dropped, and
 * logos are kept only within LOGO_BUDGET_CHARS to keep the session cookie small.
 */
export type SessionOrganization = {
  id: string;
  name: string;
  autoload: boolean;
  logo: string | null;
};

// Keeps the session cookie bounded even for users in many organizations.
const MAX_ORGANIZATIONS = 100;
// prosERP logo URLs are long signed links (~500 chars each); beyond this total,
// the remaining organizations fall back to their initial in the UI.
const LOGO_BUDGET_CHARS = 4000;

function logoUrl(value: unknown): string | null {
  return typeof value === 'string' && value.startsWith('https://')
    ? value
    : null;
}

/**
 * Normalizes `organizations` from the backend login response (prosERP's
 * `GET /organizations` data: id, name, autoload, logo_path, roles).
 * Autoload organizations first, then by name.
 */
export function toSessionOrganizations(raw: unknown): SessionOrganization[] {
  if (!Array.isArray(raw)) return [];

  let logoChars = 0;

  return raw
    .filter(
      (org) =>
        org &&
        org.id !== undefined &&
        org.id !== null &&
        typeof org.name === 'string' &&
        org.name.trim()
    )
    .map((org) => ({
      id: String(org.id),
      name: org.name.trim(),
      autoload: Boolean(Number(org.autoload)),
      logo: logoUrl(org.logo_path),
    }))
    .sort(
      (a, b) =>
        Number(b.autoload) - Number(a.autoload) || a.name.localeCompare(b.name)
    )
    .slice(0, MAX_ORGANIZATIONS)
    .map((org) => {
      if (!org.logo) return org;
      logoChars += org.logo.length;
      return logoChars <= LOGO_BUDGET_CHARS ? org : { ...org, logo: null };
    });
}
