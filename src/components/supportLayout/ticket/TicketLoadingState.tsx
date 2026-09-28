'use client';

import { Box, Typography } from '@mui/material';
import { useTicketDetailText } from './useTicketDetailText';

/** Shown while a ticket loads, or with the error when it couldn't be loaded. */
export function TicketLoadingState({ error }: { error: string | null }) {
  const t = useTicketDetailText();

  return (
    <Box
      sx={{
        p: 4,
        bgcolor: 'var(--pc-surface)',
        borderRadius: '12px',
        border: '1px solid var(--pc-border)',
      }}
    >
      <Typography
        sx={{ color: error ? 'var(--pc-danger)' : 'var(--pc-text-2)' }}
      >
        {error || t?.loading || 'Loading ticket...'}
      </Typography>
    </Box>
  );
}
