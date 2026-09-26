'use client';

import type { SxProps, Theme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  iconBg?: string;
  iconColor?: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  sx?: SxProps<Theme>;
}

export const StatCard = ({
  label,
  value,
  icon,
  iconBg = 'var(--pc-surface-2)',
  iconColor = 'var(--pc-text-3)',
  selected = false,
  onClick,
  sx,
  className,
}: StatCardProps) => {
  return (
    <Box
      className={className}
      onClick={onClick}
      sx={{
        bgcolor: selected ? 'var(--pc-accent-soft)' : 'var(--pc-surface)',
        border: '1px solid',
        borderColor: selected ? '#3b82f6' : 'var(--pc-border)',
        borderRadius: '12px',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        '&:hover': onClick ? { borderColor: '#3b82f6', boxShadow: '0 2px 8px rgba(59,130,246,0.1)' } : {},
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Typography sx={{ fontSize: '0.85rem', color: 'var(--pc-text-3)', fontWeight: 500 }}>
          {label}
        </Typography>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            bgcolor: iconBg,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
      <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--pc-text)', lineHeight: 1 }}>
        {value}
      </Typography>
    </Box>
  );
};
