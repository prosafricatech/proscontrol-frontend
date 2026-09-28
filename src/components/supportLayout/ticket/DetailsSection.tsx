'use client';

import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export const sectionLabelSx = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--pc-text-4)',
  letterSpacing: 0.5,
};

interface DetailsSectionProps {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}

/** A labelled block in the ticket details panel (STATUS, PEOPLE, …). */
export function DetailsSection({ icon, label, children }: DetailsSectionProps) {
  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.8,
          mb: 1.5,
          color: 'var(--pc-text-4)',
          '& svg': { fontSize: 14 },
        }}
      >
        {icon}
        <Typography sx={sectionLabelSx}>{label}</Typography>
      </Box>
      {children}
    </Box>
  );
}
