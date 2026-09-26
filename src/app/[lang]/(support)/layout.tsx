import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { AfterHydration } from '@/components/supportLayout/AfterHydration';
import { NotificationsProvider } from '@/lib/support/NotificationsProvider';

interface SupportShellLayoutProps {
  children: ReactNode;
}

export default function SupportShellLayout({ children }: SupportShellLayoutProps) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'var(--pc-bg)' }}>
      <AfterHydration>
        <NotificationsProvider>{children}</NotificationsProvider>
      </AfterHydration>
    </Box>
  );
}
