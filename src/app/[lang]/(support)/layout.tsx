import { AfterHydration } from '@/components/supportLayout/AfterHydration';
import { KeyboardShortcutsProvider } from '@/components/supportLayout/KeyboardShortcuts';
import { PushListener } from '@/components/supportLayout/PushListener';
import { RealtimeProvider } from '@/lib/realtime/RealtimeProvider';
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
    // #root is a flex row (style.css), so fill its width; otherwise centred
    // content such as the loading spinners sits at the far left.
    <Box
      sx={{ flex: 1, minWidth: 0, minHeight: '100vh', bgcolor: 'var(--pc-bg)' }}
    >
      <AfterHydration>
        <InAppNavigationTracker />
        <RealtimeProvider>
          <NotificationsProvider>
            <PushListener />
            <KeyboardShortcutsProvider>{children}</KeyboardShortcutsProvider>
          </NotificationsProvider>
        </RealtimeProvider>
      </AfterHydration>
    </Box>
  );
}
