'use client';

import { useCallback } from 'react';
import { useT } from './useT';

/** "5m ago", "yesterday"… in the page language. */
export function useTimeAgo() {
  const t = useT();
  return useCallback((value: string) => {
    const time = Date.parse(value);
    if (!Number.isFinite(time)) return '';
    const minutes = Math.round((Date.now() - time) / 60000);
    if (minutes < 1) return t('portal.time.justNow', 'just now');
    if (minutes < 60) return t('portal.time.minutesAgo', '{count}m ago', { count: minutes });
    const hours = Math.round(minutes / 60);
    if (hours < 24) return t('portal.time.hoursAgo', '{count}h ago', { count: hours });
    const days = Math.round(hours / 24);
    return days === 1 ? t('portal.time.yesterday', 'yesterday') : t('portal.time.daysAgo', '{count}d ago', { count: days });
  }, [t]);
}
