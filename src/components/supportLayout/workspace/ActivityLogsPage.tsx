'use client';

import { ActivityEntryDialog } from '@/components/supportLayout/activity/ActivityEntryDialog';
import { ActivityEntryRow } from '@/components/supportLayout/activity/ActivityEntryRow';
import { ActivityFilterBar } from '@/components/supportLayout/activity/ActivityFilterBar';
import { ActorTypeSwitch } from '@/components/supportLayout/activity/ActorTypeSwitch';
import {
  useActivityLog,
  type ActivityLogFilters,
} from '@/components/supportLayout/activity/useActivityLog';
import { TicketPagination } from '@/components/supportLayout/TicketPagination';
import { useT } from '@/lib/i18n/useT';
import type { ActivityCategory, ActivityEntry } from '@/lib/support/types';
import {
  Alert,
  Box,
  Card,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useCallback, useState } from 'react';
import { cardSx, PageHeader } from './shared';

const LOADING_ROW_COUNT = 6;

function emptyFilters(category: ActivityCategory): ActivityLogFilters {
  return { category, action: '', actorType: '', search: '', from: '', to: '' };
}

/**
 * The staff audit trail: ticket activity and sign-in activity on two tabs,
 * each with keyword, date range and action filters.
 */
export default function ActivityLogsPage() {
  const t = useT();
  const [filters, setFilters] = useState(() => emptyFilters('ticket'));
  const [page, setPage] = useState(1);
  const [openEntry, setOpenEntry] = useState<ActivityEntry | null>(null);
  const { entries, meta, loading, error } = useActivityLog(filters, page);

  // Stable, because the filter bar's debounce effect depends on it.
  const changeFilters = useCallback((changes: Partial<ActivityLogFilters>) => {
    setFilters((current) => ({ ...current, ...changes }));
    setPage(1);
  }, []);

  const changeTab = (category: ActivityCategory) => {
    // Actions differ per tab; the other filters still make sense.
    changeFilters({ category, action: '' });
  };

  const clearFilters = () => {
    changeFilters(emptyFilters(filters.category));
  };

  return (
    <>
      <PageHeader
        title={t('portal.activity.title', 'Activity Logs')}
        subtitle={t(
          'portal.activity.subtitle',
          'Audit administrative actions across the support workspace.'
        )}
      />

      <Card sx={{ ...cardSx, px: 3, pb: 2.5, mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
            mb: 2.5,
            borderBottom: '1px solid var(--pc-border)',
          }}
        >
          <Tabs
            value={filters.category}
            onChange={(_, category: ActivityCategory) => changeTab(category)}
          >
            <Tab
              value='ticket'
              label={t('portal.activity.tabs.ticket', 'Ticket activity')}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
            <Tab
              value='auth'
              label={t('portal.activity.tabs.auth', 'Auth trail')}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
          </Tabs>

          <ActorTypeSwitch
            value={filters.actorType}
            onChange={(actorType) => changeFilters({ actorType })}
          />
        </Box>

        <ActivityFilterBar
          filters={filters}
          onChange={changeFilters}
          onClear={clearFilters}
        />
      </Card>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && entries.length === 0 ? (
        <Stack spacing={1}>
          {Array.from({ length: LOADING_ROW_COUNT }, (_, index) => (
            <Skeleton key={index} variant='rounded' height={64} />
          ))}
        </Stack>
      ) : entries.length === 0 ? (
        <Card sx={{ ...cardSx, p: 4, textAlign: 'center' }}>
          <Typography sx={{ color: 'var(--pc-text-3)' }}>
            {t('portal.activity.empty', 'No activity recorded yet.')}
          </Typography>
        </Card>
      ) : (
        <Stack spacing={1} sx={{ opacity: loading ? 0.6 : 1 }}>
          {entries.map((entry) => (
            <ActivityEntryRow
              key={entry.id}
              entry={entry}
              onOpen={setOpenEntry}
            />
          ))}
        </Stack>
      )}

      <Box>
        <TicketPagination meta={meta} onPageChange={setPage} />
      </Box>

      <ActivityEntryDialog
        entry={openEntry}
        onClose={() => setOpenEntry(null)}
      />
    </>
  );
}
