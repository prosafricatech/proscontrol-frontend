'use client';

import { Box, CircularProgress } from '@mui/material';
import { useSyncExternalStore, type ReactNode } from 'react';

const subscribe = () => () => undefined;

/**
 * Renders children only on the client, after hydration. Support pages depend
 * on the signed-in user, which the server doesn't have (it's restored from
 * browser storage), so server-rendering them only produces hydration
 * mismatches. The server and the first client pass both render the spinner.
 */
export function AfterHydration({ children }: { children: ReactNode }) {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);

  if (!hydrated) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress size={32} color="inherit" sx={{ color: 'var(--pc-accent)' }} />
      </Box>
    );
  }

  return <>{children}</>;
}
