'use client';

import { useT } from '@/lib/i18n/useT';
import { Box } from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DailyVolume } from './useReportSummary';

const BAR_PROPS = {
  radius: [4, 4, 0, 0] as [number, number, number, number],
  maxBarSize: 28,
};

/** Opened vs closed tickets per day. Bars, not lines: counts are per day. */
export function TicketVolumeChart({ days }: { days: DailyVolume[] }) {
  const t = useT();

  return (
    <Box sx={{ height: 320 }}>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart data={days} barGap={2}>
          <CartesianGrid
            strokeDasharray='3 3'
            vertical={false}
            stroke='#e2e8f0'
          />
          <XAxis dataKey='day' tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }} />
          <Legend />
          <Bar
            {...BAR_PROPS}
            name={t('portal.reports.opened', 'Opened')}
            dataKey='opened'
            fill='#2563eb'
          />
          <Bar
            {...BAR_PROPS}
            name={t('portal.reports.closed', 'Closed')}
            dataKey='closed'
            fill='#22c55e'
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
