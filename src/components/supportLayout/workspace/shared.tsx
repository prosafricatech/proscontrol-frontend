'use client';

import {
  loadWorkspaceState,
  type WorkspaceState,
} from '@/lib/support/workspaceStore';
import { Box, Card, CardContent, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { useState } from 'react';

export const cardSx = {
  borderRadius: '12px',
  border: '1px solid var(--pc-border)',
  boxShadow: 'none',
  bgcolor: 'var(--pc-surface)',
};

export const fieldSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '8px' },
};

interface PageHeaderProps {
  title: string;
  subtitle: string;
  action?: ReactNode;
}

/** Page title + subtitle, with an optional action button on the right. */
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2,
        mb: 3,
        flexWrap: 'wrap',
      }}
    >
      <Box>
        <Typography
          sx={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--pc-text)' }}
        >
          {title}
        </Typography>
        <Typography sx={{ color: 'var(--pc-text-3)', mt: 0.5 }}>
          {subtitle}
        </Typography>
      </Box>
      {action}
    </Box>
  );
}

interface PanelProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

/** Bordered card with a title row. */
export function Panel({ title, action, children }: PanelProps) {
  return (
    <Card sx={cardSx}>
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            mb: 2,
          }}
        >
          <Typography sx={{ fontWeight: 700, color: 'var(--pc-text)' }}>
            {title}
          </Typography>
          {action}
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}

/**
 * Workspace data kept in browser storage (knowledge base, saved replies,
 * settings) until the backend provides endpoints for it.
 */
export function useWorkspaceState() {
  const [state, setState] = useState<WorkspaceState>(() =>
    loadWorkspaceState()
  );

  return { state, update: setState };
}
