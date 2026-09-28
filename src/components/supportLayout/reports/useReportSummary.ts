'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useT } from '@/lib/i18n/useT';
import { useMemo } from 'react';
import { average, median, startOfLocalDay } from './reportMath';
import type { ReportData } from './useReportData';

export type DailyVolume = { day: string; opened: number; closed: number };
export type StaffClosures = {
  name: string;
  closed: number;
  average: number | null;
};

export type ReportSummary = {
  opened: number;
  closed: number;
  averageResolutionMs: number | null;
  medianResolutionMs: number | null;
  backlog: number;
  days: DailyVolume[];
  byStaff: StaffClosures[];
};

const resolutionMs = (ticket: ReportData['closedTickets'][number]) =>
  Date.parse(ticket.closedAt) - Date.parse(ticket.createdAt);

/** Turns raw report data into the numbers and series the page shows. */
export function useReportSummary(
  report: ReportData | null,
  rangeDays: number
): ReportSummary | null {
  const t = useT();
  const lang = useLanguage();

  return useMemo(() => {
    if (!report) return null;

    const resolutionTimes = report.closedTickets
      .map(resolutionMs)
      .filter((ms) => Number.isFinite(ms) && ms >= 0);

    // One entry per local day, oldest first.
    const days = Array.from({ length: rangeDays }, (_, index): DailyVolume => {
      const start = startOfLocalDay(rangeDays - 1 - index);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);

      const isInDay = (value: string) => {
        const time = Date.parse(value);
        return time >= start.getTime() && time < end.getTime();
      };

      return {
        day: start.toLocaleDateString(
          lang,
          rangeDays <= 7
            ? { weekday: 'short' }
            : { month: 'short', day: 'numeric' }
        ),
        opened: report.openedAt.filter(isInDay).length,
        closed: report.closedTickets.filter((ticket) =>
          isInDay(ticket.closedAt)
        ).length,
      };
    });

    const timesByStaff = new Map<string, number[]>();
    for (const ticket of report.closedTickets) {
      const name =
        ticket.handledBy || t('portal.common.unassigned', 'Unassigned');
      timesByStaff.set(name, [
        ...(timesByStaff.get(name) ?? []),
        resolutionMs(ticket),
      ]);
    }

    const byStaff = [...timesByStaff.entries()]
      .map(([name, times]) => ({
        name,
        closed: times.length,
        average: average(times),
      }))
      .sort((a, b) => b.closed - a.closed);

    return {
      opened: report.openedAt.length,
      closed: report.closedTickets.length,
      averageResolutionMs: average(resolutionTimes),
      medianResolutionMs: median(resolutionTimes),
      backlog: report.backlog.new + report.backlog.active,
      days,
      byStaff,
    };
  }, [report, rangeDays, lang, t]);
}
