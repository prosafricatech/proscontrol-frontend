/**
 * Pages that exist but aren't ready for users yet: they still run on sample
 * data or browser storage instead of the backend. They're left out of the
 * sidebar and the keyboard shortcuts. To bring one back, remove it here.
 *
 * Paths are relative to /{lang}. The pages can still be opened by URL.
 */
export const HIDDEN_PAGE_PATHS = new Set([
  '/customer-profile', // mock data
  '/knowledge-base', // browser storage only
  '/saved-replies', // browser storage only
  '/settings', // browser storage only; settings don't apply anywhere
]);

/** True when `path` (relative to /{lang}) is one of the hidden pages. */
export function isHiddenPage(path: string): boolean {
  return HIDDEN_PAGE_PATHS.has(path.split('?')[0]);
}
