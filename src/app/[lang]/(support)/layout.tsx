import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { AfterHydration } from '@/components/supportLayout/AfterHydration';
import { NotificationsProvider } from '@/lib/support/NotificationsProvider';
import { InAppNavigationTracker } from '@/lib/support/inAppNavigation';
import { KeyboardShortcutsProvider } from '@/components/supportLayout/KeyboardShortcuts';

interface SupportShellLayoutProps {
  children: ReactNode;
}

export default function SupportShellLayout({ children }: SupportShellLayoutProps) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'var(--pc-bg)' }}>
      <AfterHydration>
        <InAppNavigationTracker />
        <NotificationsProvider>
          <KeyboardShortcutsProvider>{children}</KeyboardShortcutsProvider>
        </NotificationsProvider>
      </AfterHydration>
    </Box>
  );
}
