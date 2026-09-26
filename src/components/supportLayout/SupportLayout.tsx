'use client';

import React from 'react';
import { Box, IconButton, Badge, Typography } from '@mui/material';
import { NotificationsNone as BellIcon } from '@mui/icons-material';
import { Sidebar, SIDEBAR_WIDTH, SupportRole } from '../sidebar/Sidebar';
import { AuthUserPopover } from '@/components/authUserPopover/AuthUserPopover';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { ColorModeToggle } from '@/components/colorMode/ColorModeToggle';

interface SupportLayoutProps {
  children: React.ReactNode;
  userRole: SupportRole;
  userName?: string;
  userRoleLabel?: string;
}

export const SupportLayout = ({
  children,
  userRole,
  userName = 'User',
  userRoleLabel,
}: SupportLayoutProps) => {
  const dictionary = useDictionary();

  return (
    <Box sx={{ display: 'flex', width: '100vw', minHeight: '100dvh', bgcolor: 'var(--pc-bg)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Sidebar
        role={userRole}
      />

      {/* Main area */}
      <Box
        sx={{
          flex: 1,
          width: `calc(100vw - ${SIDEBAR_WIDTH}px)`,
          ml: `${SIDEBAR_WIDTH}px`,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: '100dvh',
          boxSizing: 'border-box',
        }}
      >
        {/* Top bar */}
        <Box
          sx={{
            height: 64,
            flexShrink: 0,
            bgcolor: 'var(--pc-surface)',
            borderBottom: '1px solid var(--pc-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <Box sx={{ flex: 1 }} />
          <ColorModeToggle sx={{ mr: 1.5 }} />
          <AuthUserPopover dictionary={dictionary as any} />
        </Box>

        {/* Page content */}
        <Box sx={{ flex: 1, width: '100%', p: { xs: 3, md: 4 }, minWidth: 0, boxSizing: 'border-box' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};