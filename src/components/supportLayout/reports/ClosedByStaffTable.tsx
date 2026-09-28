'use client';

import { useT } from '@/lib/i18n/useT';
import { Box, Typography } from '@mui/material';
import { formatDuration } from './reportMath';
import type { StaffClosures } from './useReportSummary';

const tableSx = {
  width: '100%',
  borderCollapse: 'collapse',
  '& th, & td': {
    py: 1,
    textAlign: 'left',
    borderBottom: '1px solid var(--pc-border)',
    color: 'var(--pc-text)',
    fontSize: 14,
  },
  '& th': { color: 'var(--pc-text-3)', fontWeight: 600, fontSize: 12 },
} as const;

/** Tickets closed per staff member, with their average resolution time. */
export function ClosedByStaffTable({ rows }: { rows: StaffClosures[] }) {
  const t = useT();

  if (rows.length === 0) {
    return (
      <Typography sx={{ color: 'var(--pc-text-3)' }}>
        {t('portal.reports.noneClosed', 'No tickets closed in this period.')}
      </Typography>
    );
  }

  return (
    <Box component='table' sx={tableSx}>
      <thead>
        <tr>
          <th>{t('portal.common.staff', 'Staff')}</th>
          <th>{t('portal.reports.closed', 'Closed')}</th>
          <th>{t('portal.reports.avgResolution', 'Avg. resolution')}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name}>
            <td>{row.name}</td>
            <td>{row.closed}</td>
            <td>{formatDuration(row.average, t)}</td>
          </tr>
        ))}
      </tbody>
    </Box>
  );
}
