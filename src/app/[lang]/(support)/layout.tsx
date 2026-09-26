import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { AfterHydration } from '@/components/supportLayout/AfterHydration';

interface SupportShellLayoutProps {
  children: ReactNode;
}

export default function SupportShellLayout({ children }: SupportShellLayoutProps) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'var(--pc-bg)' }}>
      <AfterHydration>{children}</AfterHydration>
    </Box>
  );
}
