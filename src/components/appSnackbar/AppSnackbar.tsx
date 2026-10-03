'use client';

import React, { ReactNode } from 'react';
import { SnackbarProvider, useSnackbar } from 'notistack';
import { IconButton } from '@mui/material';
import { CloseOutlined } from '@mui/icons-material';

interface SnackbarCloseButtonProps {
  snackbarKey: string | number;
}

function SnackbarCloseButton({ snackbarKey }: SnackbarCloseButtonProps) {
  const { closeSnackbar } = useSnackbar();

  return (
    <IconButton onClick={() => closeSnackbar(snackbarKey)} size="small" aria-label="close">
      <CloseOutlined fontSize="small" sx={{ color: 'primary' }} />
    </IconButton>
  );
}

interface AppSnackbarProps {
  children: ReactNode;
}

export const AppSnackbar: React.FC<AppSnackbarProps> = ({ children }) => {
  return (
    <SnackbarProvider
      action={(snackbarKey) => <SnackbarCloseButton snackbarKey={snackbarKey} />}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      maxSnack={3}
    >
      {children}
    </SnackbarProvider>
  );
};
