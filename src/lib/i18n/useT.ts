'use client';

import { useCallback } from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { translate, type TranslateParams } from './translate';

/** `t('portal.chat.send', 'Send')` — see translate() for the lookup rules. */
export function useT() {
  const dictionary = useDictionary();
  return useCallback(
    (key: string, fallback: string, params?: TranslateParams) => translate(dictionary, key, fallback, params),
    [dictionary],
  );
}

/** Formats dates/times in the page language rather than the browser's. */
export function useFormatDate() {
  const lang = useLanguage();
  return useCallback(
    (value: string | number | Date | null | undefined, options?: Intl.DateTimeFormatOptions) => {
      if (value === null || value === undefined || value === '') return '';
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return '';
      return date.toLocaleString(lang, options ?? { dateStyle: 'medium', timeStyle: 'short' });
    },
    [lang],
  );
}
