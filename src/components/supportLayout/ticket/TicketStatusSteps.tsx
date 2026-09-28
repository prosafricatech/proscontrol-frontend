'use client';

import type { TicketStatus } from '@/lib/support/types';
import { Box, Typography } from '@mui/material';
import { useTicketDetailText } from './useTicketDetailText';

/** Submitted → In progress → Resolved, highlighting the current step. */
export function TicketStatusSteps({ status }: { status: TicketStatus }) {
  const t = useTicketDetailText();

  const steps = [
    {
      label: t?.statusSubmitted || 'Submitted',
      done: true,
      current: status === 'new',
    },
    {
      label: t?.statusInProgress || 'In progress',
      done: status !== 'new',
      current: status === 'active',
    },
    {
      label: t?.statusResolved || 'Resolved',
      done: status === 'closed',
      current: status === 'closed',
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {steps.map((step) => (
        <Box
          key={step.label}
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: step.done ? '#3b82f6' : 'var(--pc-border)',
            }}
          />
          <Typography
            sx={{
              fontSize: '0.875rem',
              color: step.done ? 'var(--pc-text)' : 'var(--pc-text-4)',
              fontWeight: step.current ? 600 : 400,
            }}
          >
            {step.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
