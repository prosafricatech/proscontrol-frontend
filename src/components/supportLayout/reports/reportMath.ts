import type { TranslateParams } from '@/lib/i18n/translate';

type Translate = (
  key: string,
  fallback: string,
  params?: TranslateParams
) => string;

/** Midnight (local time) `daysAgo` days before today. */
export function startOfLocalDay(daysAgo: number): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** "45m", "6h 24m" or "2d 3h" in the page language; "—" when there's no value. */
export function formatDuration(ms: number | null, t: Translate): string {
  if (ms === null) return '—';

  const minutes = Math.round(ms / 60000);
  if (minutes < 60) {
    return t('portal.reports.duration.minutes', '{m}m', { m: minutes });
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return t('portal.reports.duration.hoursMinutes', '{h}h {m}m', {
      h: hours,
      m: minutes % 60,
    });
  }

  return t('portal.reports.duration.daysHours', '{d}d {h}h', {
    d: Math.floor(hours / 24),
    h: hours % 24,
  });
}
