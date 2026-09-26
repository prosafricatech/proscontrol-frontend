'use client';

import type { SxProps, Theme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface StatusBadgeProps {
  status: 'new' | 'active' | 'closed' | 'open';
  label?: string;
  className?: string;
  sx?: SxProps<Theme>;
}

const statusStyles: Record<string, { bg: string; color: string }> = {
  active: { bg: 'var(--pc-success-soft)', color: 'var(--pc-success)' },
  new: { bg: 'var(--pc-accent-soft-2)', color: 'var(--pc-accent)' },
  closed: { bg: 'var(--pc-surface-2)', color: 'var(--pc-text-3)' },
  open: { bg: 'var(--pc-success-soft)', color: 'var(--pc-success)' },
};

export const StatusBadge = ({ status, label, className, sx }: StatusBadgeProps) => {
  const dictionary = useDictionary();
  const style = statusStyles[status] || statusStyles.closed;

  return (
    <Box
      className={className}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 1.25,
        py: 0.4,
        borderRadius: '6px',
        bgcolor: style.bg,
        ...sx,
      }}
    >
      <Typography
        sx={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: style.color,
          textTransform: 'lowercase',
        }}
      >
        {label || dictionary.support?.status?.[status] || status}
      </Typography>
    </Box>
  );
};
