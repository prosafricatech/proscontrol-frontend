'use client';

import { InfoOutlined as InfoIcon } from '@mui/icons-material';
import { Alert, Box, Card, CardContent, Skeleton, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type ReportData = {
  from: string;
  openedAt: string[];
  closedTickets: { createdAt: string; closedAt: string; handledBy: string | null }[];
  backlog: { new: number; active: number };
  closedLookbackDays: number;
  truncated: boolean;
};

const RANGES = [7, 30] as const;
const cardSx = { borderRadius: '12px', border: '1px solid var(--pc-border)', boxShadow: 'none', bgcolor: 'var(--pc-surface)' };

function startOfLocalDay(daysAgo: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function formatDuration(ms: number | null) {
  if (ms === null) return '—';
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

const StatTile = ({ label, value, hint }: { label: string; value: string | number; hint?: string }) => (
  <Card sx={cardSx}>
    <CardContent>
      <Typography sx={{ color: 'var(--pc-text-3)', fontSize: 13 }}>{label}</Typography>
      <Typography sx={{ fontWeight: 700, fontSize: 24, color: 'var(--pc-text)' }}>{value}</Typography>
      {hint && <Typography sx={{ color: 'var(--pc-text-4)', fontSize: 12, mt: 0.5 }}>{hint}</Typography>}
    </CardContent>
  </Card>
);

/**
 * Reports built from the existing ticket list endpoints (via /api/support/reports)
 * until the backend provides a reports endpoint.
 */
export default function SupportReports() {
  const [rangeDays, setRangeDays] = useState<(typeof RANGES)[number]>(7);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setReport(null);
      setError(null);
      try {
        // Start of the local day, (range - 1) days ago, so "7 days" includes today.
        const from = startOfLocalDay(rangeDays - 1).toISOString();
        const response = await fetch(`/api/support/reports?from=${encodeURIComponent(from)}`, { cache: 'no-store' });
        const payload = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok || !payload?.data) {
          setError(payload?.message || 'Unable to load reports.');
          return;
        }
        setReport(payload.data);
      } catch {
        if (!cancelled) setError('Unable to load reports.');
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [rangeDays]);

  const summary = useMemo(() => {
    if (!report) return null;

    const resolutionTimes = report.closedTickets
      .map((ticket) => Date.parse(ticket.closedAt) - Date.parse(ticket.createdAt))
      .filter((ms) => Number.isFinite(ms) && ms >= 0);
    const average = resolutionTimes.length ? resolutionTimes.reduce((sum, ms) => sum + ms, 0) / resolutionTimes.length : null;

    const days = Array.from({ length: rangeDays }, (_, index) => {
      const start = startOfLocalDay(rangeDays - 1 - index);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      const inDay = (value: string) => {
        const time = Date.parse(value);
        return time >= start.getTime() && time < end.getTime();
      };
      return {
        day: start.toLocaleDateString(undefined, rangeDays <= 7 ? { weekday: 'short' } : { month: 'short', day: 'numeric' }),
        opened: report.openedAt.filter(inDay).length,
        closed: report.closedTickets.filter((ticket) => inDay(ticket.closedAt)).length,
      };
    });

    const byStaff = Object.entries(
      report.closedTickets.reduce<Record<string, number[]>>((groups, ticket) => {
        const name = ticket.handledBy || 'Unassigned';
        const ms = Date.parse(ticket.closedAt) - Date.parse(ticket.createdAt);
        (groups[name] ||= []).push(ms);
        return groups;
      }, {}),
    )
      .map(([name, times]) => ({ name, closed: times.length, average: times.reduce((sum, ms) => sum + ms, 0) / times.length }))
      .sort((a, b) => b.closed - a.closed);

    return {
      opened: report.openedAt.length,
      closed: report.closedTickets.length,
      average,
      median: median(resolutionTimes),
      backlog: report.backlog.new + report.backlog.active,
      days,
      byStaff,
    };
  }, [report, rangeDays]);

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box>
          <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--pc-text)' }}>Ticket Reports</Typography>
          <Typography sx={{ color: 'var(--pc-text-3)', mt: 0.5 }}>Track volume, throughput, and resolution speed.</Typography>
        </Box>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={rangeDays}
          onChange={(_, value) => value && setRangeDays(value)}
          sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 2 } }}
        >
          {RANGES.map((days) => (
            <ToggleButton key={days} value={days}>Last {days} days</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!summary ? (
        !error && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} variant="rounded" height={96} sx={{ borderRadius: '12px' }} />)}
          </Box>
        )
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2, mb: 2 }}>
            <StatTile label="Opened" value={summary.opened} hint={`Last ${rangeDays} days`} />
            <StatTile label="Closed" value={summary.closed} hint={`Last ${rangeDays} days`} />
            <StatTile label="Avg. resolution" value={formatDuration(summary.average)} hint="Created → closed" />
            <StatTile label="Median resolution" value={formatDuration(summary.median)} hint="Half of tickets close faster" />
            <StatTile label="Open backlog" value={summary.backlog} hint="New + active right now" />
          </Box>

          <Card sx={{ ...cardSx, mb: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 700, color: 'var(--pc-text)', mb: 2 }}>Ticket volume</Typography>
              <Box sx={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.days} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }} />
                    <Legend />
                    <Bar name="Opened" dataKey="opened" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar name="Closed" dataKey="closed" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.3fr 1fr' }, gap: 2 }}>
            <Card sx={cardSx}>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontWeight: 700, color: 'var(--pc-text)', mb: 2 }}>Closed by staff</Typography>
                {summary.byStaff.length === 0 ? (
                  <Typography sx={{ color: 'var(--pc-text-3)' }}>No tickets closed in this period.</Typography>
                ) : (
                  <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', '& th, & td': { py: 1, textAlign: 'left', borderBottom: '1px solid var(--pc-border)', color: 'var(--pc-text)', fontSize: 14 }, '& th': { color: 'var(--pc-text-3)', fontWeight: 600, fontSize: 12 } }}>
                    <thead>
                      <tr><th>Staff</th><th>Closed</th><th>Avg. resolution</th></tr>
                    </thead>
                    <tbody>
                      {summary.byStaff.map((row) => (
                        <tr key={row.name}><td>{row.name}</td><td>{row.closed}</td><td>{formatDuration(row.average)}</td></tr>
                      ))}
                    </tbody>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Card sx={cardSx}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                  <InfoIcon sx={{ fontSize: 18, color: 'var(--pc-text-3)' }} />
                  <Typography sx={{ fontWeight: 700, color: 'var(--pc-text)' }}>About these numbers</Typography>
                </Box>
                <Typography component="ul" sx={{ color: 'var(--pc-text-3)', fontSize: 14, pl: 2.5, m: 0, '& li': { mb: 0.75 } }}>
                  <li>SLA tracking isn&apos;t available yet: no response/resolution target has been defined.</li>
                  <li>Closed counts include tickets created in the last {report?.closedLookbackDays} days.</li>
                  {report?.truncated && <li>Very high volume: only the most recent tickets were counted.</li>}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </>
      )}
    </>
  );
}
