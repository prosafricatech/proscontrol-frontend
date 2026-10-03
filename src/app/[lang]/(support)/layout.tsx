import { AfterHydration } from '@/components/supportLayout/AfterHydration';
import { KeyboardShortcutsProvider } from '@/components/supportLayout/KeyboardShortcuts';
import { PushListener } from '@/components/supportLayout/PushListener';
import { NotificationsProvider } from '@/lib/support/NotificationsProvider';
import { InAppNavigationTracker } from '@/lib/support/inAppNavigation';
import { Box } from '@mui/material';
import type { ReactNode } from 'react';

interface SupportShellLayoutProps {
  children: ReactNode;
}

export default function SupportShellLayout({
  children,
}: SupportShellLayoutProps) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'var(--pc-bg)' }}>
      <AfterHydration>
        <InAppNavigationTracker />
        <NotificationsProvider>
          <PushListener />
          <KeyboardShortcutsProvider>{children}</KeyboardShortcutsProvider>
        </NotificationsProvider>
      </AfterHydration>
    </Box>
  );
}
