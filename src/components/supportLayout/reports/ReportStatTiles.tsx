'use client';

import { cardSx } from '@/components/supportLayout/workspace/shared';
import { useT } from '@/lib/i18n/useT';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { formatDuration } from './reportMath';
import type { ReportSummary } from './useReportSummary';

interface StatTileProps {
  label: string;
  value: string | number;
  hint: string;
}

function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <Card sx={cardSx}>
      <CardContent>
        <Typography sx={{ color: 'var(--pc-text-3)', fontSize: 13 }}>
          {label}
        </Typography>
        <Typography
          sx={{ fontWeight: 700, fontSize: 24, color: 'var(--pc-text)' }}
        >
          {value}
        </Typography>
        <Typography sx={{ color: 'var(--pc-text-4)', fontSize: 12, mt: 0.5 }}>
          {hint}
        </Typography>
      </CardContent>
    </Card>
  );
}

interface ReportStatTilesProps {
  summary: ReportSummary;
  rangeDays: number;
}

export function ReportStatTiles({ summary, rangeDays }: ReportStatTilesProps) {
  const t = useT();
  const periodHint = t('portal.reports.lastDays', 'Last {count} days', {
    count: rangeDays,
  });

  const tiles: StatTileProps[] = [
    {
      label: t('portal.reports.opened', 'Opened'),
      value: summary.opened,
      hint: periodHint,
    },
    {
      label: t('portal.reports.closed', 'Closed'),
      value: summary.closed,
      hint: periodHint,
    },
    {
      label: t('portal.reports.avgResolution', 'Avg. resolution'),
      value: formatDuration(summary.averageResolutionMs, t),
      hint: t('portal.reports.createdToClosed', 'Created → closed'),
    },
    {
      label: t('portal.reports.medianResolution', 'Median resolution'),
      value: formatDuration(summary.medianResolutionMs, t),
      hint: t('portal.reports.medianHint', 'Half of tickets close faster'),
    },
    {
      label: t('portal.reports.backlog', 'Open backlog'),
      value: summary.backlog,
      hint: t('portal.reports.backlogHint', 'New + active right now'),
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' },
        gap: 2,
        mb: 2,
      }}
    >
      {tiles.map((tile) => (
        <StatTile key={tile.label} {...tile} />
      ))}
    </Box>
  );
}
