import { activeLocale } from '@/proxy';
import Negotiator from 'negotiator';
import { NextRequest } from 'next/server';
import { DEFAULT_LOCALE, isSupportedLocale, LOCALE_COOKIE, localeFromAcceptLanguage } from '@/config/locales';

let headers = { 'accept-language': 'en-US,en;q=0.5' };
let languages = new Negotiator({ headers }).languages();
let locales = ['en-US', 'sw-TZ', 'ar-SA', 'es-ES', 'fr-FR', 'it-IT', 'zh-CN'];
let defaultLocale = 'en-US';

export function pathnameHasLocale(pathname: string, activeLocale: string) {
  return locales.some((locale) => {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      activeLocale = locale;
      return true;
    }
    return false;
  });
}

export function prefixLocale(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith(`/api/`) ||
    pathname.startsWith(`/assets/`) ||
    pathname.startsWith('/_next/')
  ) {
    return null;
  }

  if (pathnameHasLocale(pathname, activeLocale)) {
    return null;
  }

  // No locale in the URL: the user's saved choice, then the browser language, then English.
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isSupportedLocale(saved)
    ? saved
    : localeFromAcceptLanguage(request.headers.get('accept-language')) ?? DEFAULT_LOCALE;

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;

  return url;
}
