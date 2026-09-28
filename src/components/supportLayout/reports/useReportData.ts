'use client';

import { useT } from '@/lib/i18n/useT';
import { useEffect, useState } from 'react';
import { startOfLocalDay } from './reportMath';

/** Response of /api/support/reports (raw timestamps, bucketed in the browser). */
export type ReportData = {
  from: string;
  openedAt: string[];
  closedTickets: {
    createdAt: string;
    closedAt: string;
    handledBy: string | null;
  }[];
  backlog: { new: number; active: number };
  closedLookbackDays: number;
  truncated: boolean;
};

/** Loads report data for the last `rangeDays` days (today included). */
export function useReportData(rangeDays: number) {
  const t = useT();
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadFailed = t(
      'portal.reports.loadFailed',
      'Unable to load reports.'
    );

    const load = async () => {
      setReport(null);
      setError(null);

      try {
        const from = startOfLocalDay(rangeDays - 1).toISOString();
        const response = await fetch(
          `/api/support/reports?from=${encodeURIComponent(from)}`,
          {
            cache: 'no-store',
          }
        );
        const payload = await response.json().catch(() => null);
        if (cancelled) return;

        if (!response.ok || !payload?.data) {
          setError(payload?.message || loadFailed);
          return;
        }
        setReport(payload.data);
      } catch {
        if (!cancelled) {
          setError(loadFailed);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [rangeDays, t]);

  return { report, error };
}
