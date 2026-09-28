'use client';

import { useFormatDate } from '@/lib/i18n/useT';
import type { ReassignmentEvent } from '@/lib/support/types';
import { Box, Typography } from '@mui/material';
import { useTicketDetailText } from './useTicketDetailText';

/** Who handled the ticket over time, newest first. */
export function ReassignmentHistory({
  events,
}: {
  events: ReassignmentEvent[];
}) {
  const t = useTicketDetailText();
  const formatDate = useFormatDate();

  if (events.length === 0) {
    return (
      <Typography sx={{ fontSize: '0.85rem', color: 'var(--pc-text-4)' }}>
        —
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {events.map((event, index) => {
        const title = event.from
          ? `${event.from} → ${event.to}`
          : `${t?.firstAssignment || 'First assignment'}: ${event.to}`;

        return (
          <Box key={`${event.at}-${index}`}>
            <Typography
              sx={{
                fontSize: '0.85rem',
                color: 'var(--pc-text)',
                fontWeight: 500,
              }}
            >
              {title}
            </Typography>
            {event.note && (
              <Typography
                sx={{ fontSize: '0.8rem', color: 'var(--pc-text-4)' }}
              >
                {event.note}
              </Typography>
            )}
            <Typography sx={{ fontSize: '0.75rem', color: 'var(--pc-text-4)' }}>
              {formatDate(event.at)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
