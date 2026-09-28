'use client';

import { useT } from '@/lib/i18n/useT';
import {
  Alert,
  Box,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useState } from 'react';
import { ClosedByStaffTable } from './reports/ClosedByStaffTable';
import { ReportNotes } from './reports/ReportNotes';
import { ReportStatTiles } from './reports/ReportStatTiles';
import { TicketVolumeChart } from './reports/TicketVolumeChart';
import { useReportData } from './reports/useReportData';
import { useReportSummary } from './reports/useReportSummary';
import { PageHeader, Panel } from './workspace/shared';

const RANGES = [7, 30] as const;
type RangeDays = (typeof RANGES)[number];

const LOADING_TILE_COUNT = 4;

function LoadingTiles() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
        gap: 2,
      }}
    >
      {Array.from({ length: LOADING_TILE_COUNT }, (_, index) => (
        <Skeleton
          key={index}
          variant='rounded'
          height={96}
          sx={{ borderRadius: '12px' }}
        />
      ))}
    </Box>
  );
}

/**
 * Ticket reports built from the existing ticket list endpoints (via
 * /api/support/reports) until the backend provides a reports endpoint.
 */
export default function SupportReports() {
  const t = useT();
  const [rangeDays, setRangeDays] = useState<RangeDays>(7);
  const { report, error } = useReportData(rangeDays);
  const summary = useReportSummary(report, rangeDays);

  const rangePicker = (
    <ToggleButtonGroup
      size='small'
      exclusive
      value={rangeDays}
      onChange={(_, value: RangeDays | null) => value && setRangeDays(value)}
      sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 2 } }}
    >
      {RANGES.map((days) => (
        <ToggleButton key={days} value={days}>
          {t('portal.reports.lastDays', 'Last {count} days', { count: days })}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );

  return (
    <>
      <PageHeader
        title={t('portal.reports.title', 'Ticket Reports')}
        subtitle={t(
          'portal.reports.subtitle',
          'Track volume, throughput, and resolution speed.'
        )}
        action={rangePicker}
      />

      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!error && (!report || !summary) && <LoadingTiles />}

      {report && summary && (
        <>
          <ReportStatTiles summary={summary} rangeDays={rangeDays} />

          <Box sx={{ mb: 2 }}>
            <Panel title={t('portal.reports.volume', 'Ticket volume')}>
              <TicketVolumeChart days={summary.days} />
            </Panel>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1.3fr 1fr' },
              gap: 2,
            }}
          >
            <Panel title={t('portal.reports.closedByStaff', 'Closed by staff')}>
              <ClosedByStaffTable rows={summary.byStaff} />
            </Panel>
            <Panel title={t('portal.reports.about', 'About these numbers')}>
              <ReportNotes
                closedLookbackDays={report.closedLookbackDays}
                truncated={report.truncated}
              />
            </Panel>
          </Box>
        </>
      )}
    </>
  );
}
