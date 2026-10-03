'use client';

import { displayFor } from '@/components/supportLayout/activity/activityActions';
import { Box } from '@mui/material';

interface ActionChipProps {
  action: string;
  label: string;
  size?: 'small' | 'medium';
}

/** The coloured "Reassigned" / "Signed in" badge next to an entry. */
export function ActionChip({ action, label, size = 'small' }: ActionChipProps) {
  const display = displayFor(action);
  const isSmall = size === 'small';

  return (
    <Box
      component='span'
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: isSmall ? 1 : 1.5,
        py: isSmall ? 0.125 : 0.5,
        borderRadius: '999px',
        border: '1px solid',
        borderColor: display.color,
        bgcolor: display.bg,
        color: display.color,
        fontSize: isSmall ? 11 : 13,
        fontWeight: 600,
        lineHeight: 1.6,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </Box>
  );
}
