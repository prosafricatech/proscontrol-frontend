'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Pages viewed inside the support portal during this browser tab's session.
// Module state (not React state): it only has to survive client navigations.
let pageViews = 0;
let lastPathname: string | null = null;

/** Rendered once in the support layout; counts in-app page changes. */
export function InAppNavigationTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Guard against double effects (React StrictMode) for the same page.
    if (pathname === lastPathname) return;
    lastPathname = pathname;
    pageViews += 1;
  }, [pathname]);

  return null;
}

/**
 * True when the previous history entry is a portal page, so `router.back()`
 * stays in the app (and keeps that page's filters/scroll). False when the page
 * was opened directly, e.g. from an email link or a new tab.
 */
export function canGoBackInApp() {
  return pageViews > 1;
}
