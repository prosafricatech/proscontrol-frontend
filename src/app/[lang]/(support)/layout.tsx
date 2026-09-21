import type { ReactNode } from 'react';
import { Box } from '@mui/material';

interface SupportShellLayoutProps {
  children: ReactNode;
}

export default function SupportShellLayout({ children }: SupportShellLayoutProps) {
  return <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>{children}</Box>;
}
