'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { LOCALE_COOKIE, SUPPORTED_LOCALES } from '@/config/locales';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function rememberLocale(code: string) {
  document.cookie = `${LOCALE_COOKIE}=${code}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
}

/**
 * Switches the UI language by swapping the locale segment of the current URL
 * (/en-US/... ↔ /sw-TZ/...) and remembers the choice in a cookie, which the
 * locale middleware uses for URLs that don't include a locale.
 */
export function useSwitchLocale() {
  const lang = useLanguage();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const switchTo = useCallback((code: string) => {
    if (code === lang) return;
    rememberLocale(code);
    const rest = pathname.replace(/^\/[a-z]{2}-[A-Z]{2}(?=\/|$)/, '');
    const query = searchParams.toString();
    router.replace(`/${code}${rest}${query ? `?${query}` : ''}`);
    // The root layout loads the dictionary on the server.
    router.refresh();
  }, [lang, pathname, router, searchParams]);

  /** Next language in SUPPORTED_LOCALES (wraps around). */
  const switchToNext = useCallback(() => {
    const index = SUPPORTED_LOCALES.findIndex((locale) => locale.code === lang);
    switchTo(SUPPORTED_LOCALES[(index + 1) % SUPPORTED_LOCALES.length].code);
  }, [lang, switchTo]);

  return { lang, switchTo, switchToNext };
}
