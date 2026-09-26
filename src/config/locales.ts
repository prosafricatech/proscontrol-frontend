/** Languages the UI is translated into. The first one is the default. */
export const SUPPORTED_LOCALES = [
  { code: 'en-US', label: 'English', short: 'EN' },
  { code: 'sw-TZ', label: 'Kiswahili', short: 'SW' },
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]['code'];

export const DEFAULT_LOCALE: SupportedLocale = 'en-US';

/** Remembers the user's language choice for URLs without a locale. */
export const LOCALE_COOKIE = 'NEXT_LOCALE';

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return SUPPORTED_LOCALES.some((locale) => locale.code === value);
}

/** Maps an Accept-Language header to a supported locale ("sw", "sw-KE" → "sw-TZ"). */
export function localeFromAcceptLanguage(header: string | null): SupportedLocale | null {
  if (!header) return null;
  const languages = header
    .split(',')
    .map((part) => part.trim().split(';')[0].toLowerCase())
    .filter(Boolean);

  for (const language of languages) {
    const exact = SUPPORTED_LOCALES.find((locale) => locale.code.toLowerCase() === language);
    if (exact) return exact.code;
    const byLanguage = SUPPORTED_LOCALES.find((locale) => locale.code.split('-')[0].toLowerCase() === language.split('-')[0]);
    if (byLanguage) return byLanguage.code;
  }
  return null;
}
