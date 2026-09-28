'use client';

import { useT } from '@/lib/i18n/useT';
import { FilterList, History } from '@mui/icons-material';
import { Avatar, Box, Button, Divider, Stack, Typography } from '@mui/material';
import { PageHeader, Panel } from './shared';

// Sample entries until the backend provides an audit log endpoint.
const SAMPLE_EVENTS = [
  {
    key: 'portal.activity.samples.reassigned',
    text: 'Ticket reassigned · TCK-1001 → Lilian M.',
  },
  { key: 'portal.activity.samples.closed', text: 'Ticket closed · TCK-1003' },
  {
    key: 'portal.activity.samples.article',
    text: 'Article updated · Stock sync guide',
  },
  {
    key: 'portal.activity.samples.settings',
    text: 'Settings changed · Email alerts',
  },
];

export default function ActivityLogsPage() {
  const t = useT();

  return (
    <>
      <PageHeader
        title={t('portal.activity.title', 'Activity Logs')}
        subtitle={t(
          'portal.activity.subtitle',
          'Audit administrative actions across the support workspace.'
        )}
        action={
          <Button variant='outlined' startIcon={<FilterList />}>
            {t('portal.activity.filter', 'Filter logs')}
          </Button>
        }
      />

      <Panel title={t('portal.activity.recent', 'Recent activity')}>
        <Stack divider={<Divider />}>
          {SAMPLE_EVENTS.map((event) => (
            <Box key={event.key} sx={{ display: 'flex', gap: 2, py: 2 }}>
              <Avatar
                sx={{
                  bgcolor: 'var(--pc-accent-soft-2)',
                  color: 'var(--pc-accent)',
                }}
              >
                <History fontSize='small' />
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 600 }}>
                  {t(event.key, event.text)}
                </Typography>
                <Typography sx={{ color: 'var(--pc-text-4)', fontSize: 12 }}>
                  {t(
                    'portal.activity.systemEvent',
                    'System audit event · today'
                  )}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </Panel>
    </>
  );
}
