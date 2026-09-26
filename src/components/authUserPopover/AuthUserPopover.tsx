'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { Div } from '@jumbo/shared';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import {
  Avatar,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { signOut } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import React from 'react';

const JumboDdPopover = dynamic(
  () => import('@jumbo/components').then((mod) => mod.JumboDdPopover),
  { ssr: false }
);

type Dictionary = {
  commons: {
    switchOrganization: string;
    logout: string;
  };
};

interface User {
  name: string;
  email: string;
  photo_path?: string | null;
}

interface Organization {
  id: string | number;
  name: string;
}

interface AuthUserPopoverProps {
  dictionary: Dictionary;
}

export const AuthUserPopover: React.FC<AuthUserPopoverProps> = ({
  dictionary,
}) => {
  const router = useRouter();
  const lang = useLanguage();
  const authContext = useJumboAuth();

  const [openLogoutDialog, setOpenLogoutDialog] =
    React.useState<boolean>(false);
  const hasTriggeredAutoLogout = React.useRef(false);

  if (!authContext) {
    console.error('Auth context not available');
    return null;
  }

  const { authData, authOrganization, resetAuth, isLoading } = authContext;

  const logout = React.useCallback(() => {
    (async () => {
      await signOut({
        callbackUrl: `/${lang}/auth/signin`,
      });
      resetAuth();
    })();
  }, [lang, resetAuth]);

  const user: User | undefined = authData?.authUser?.user;

  React.useEffect(() => {
    if (isLoading || user || hasTriggeredAutoLogout.current) {
      return;
    }

    hasTriggeredAutoLogout.current = true;
    logout();
  }, [isLoading, user, logout]);

  if (!user) {
    return null;
  }

  // Shown when there's no photo, or when the photo fails to load.
  const initial = (user.name || user.email || '?').trim().charAt(0).toUpperCase();
  const avatarColors = { bgcolor: '#2563eb', color: '#ffffff', fontWeight: 700 };

  // No ThemeProvider here: the menu follows the app's current light/dark theme.
  return (
    <>
      <JumboDdPopover
        triggerButton={
          <Avatar
            src={user?.photo_path || undefined}
            alt={user?.name}
            sizes='small'
            sx={{
              ...avatarColors,
              boxShadow: 23,
              cursor: 'pointer',
              border: '4px solid var(--pc-border)',
            }}
          >
            {initial}
          </Avatar>
        }
        sx={{ ml: 3 }}
      >
        <Div
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            p: (theme) => theme.spacing(2.5),
          }}
        >
          <Avatar
            src={user?.photo_path || undefined}
            alt={user?.name}
            sx={{
              ...avatarColors,
              width: 60,
              height: 60,
              mb: 2,
              fontSize: '1.6rem',
              border: '4px solid var(--pc-border)',
            }}
          >
            {initial}
          </Avatar>
          <Typography noWrap variant='h5'>
            {user?.name}
          </Typography>
          <Typography noWrap variant='body1' color='text.secondary'>
            {user?.email}
          </Typography>

        </Div>

        <Divider />

        <nav>
          <List disablePadding sx={{ pb: 1 }}>
            <ListItemButton onClick={() => setOpenLogoutDialog(true)}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText
                primary={dictionary.commons.logout}
                sx={{ my: 0 }}
              />
            </ListItemButton>
          </List>
        </nav>
      </JumboDdPopover>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={openLogoutDialog}
        onClose={() => setOpenLogoutDialog(false)}
      >
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to logout?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLogoutDialog(false)} variant='text'>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setOpenLogoutDialog(false);
              logout();
            }}
            variant='text'
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
