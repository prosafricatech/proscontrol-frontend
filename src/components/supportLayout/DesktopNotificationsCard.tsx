'use client';

import { cardSx } from '@/components/supportLayout/workspace/shared';
import { useT } from '@/lib/i18n/useT';
import {
  disablePush,
  enablePush,
  getPushStatus,
  type PushStatus,
} from '@/lib/push/pushNotifications';
import { NotificationsActiveOutlined as PushIcon } from '@mui/icons-material';
import { Alert, Box, Card, Switch, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

/** Help text under the title for each state. */
function useStatusText() {
  const t = useT();

  return (status: PushStatus): string => {
    switch (status) {
      case 'on':
        return t(
          'portal.push.on',
          'On for this browser. You’ll get a pop-up even when ProsControl isn’t open.'
        );
      case 'blocked':
        return t(
          'portal.push.blocked',
          'Blocked in your browser. Allow notifications for this site in the browser’s site settings, then switch this on.'
        );
      case 'unconfigured':
        return t(
          'portal.push.unconfigured',
          'Not set up yet. An administrator needs to add the Firebase keys.'
        );
      case 'unsupported':
        return t('portal.push.unsupported', 'Not available in this browser.');
      default:
        return t(
          'portal.push.off',
          'Get a pop-up on this device when a ticket or message needs you.'
        );
    }
  };
}

/** Lets each user switch browser push notifications on or off. */
export function DesktopNotificationsCard() {
  const t = useT();
  const statusText = useStatusText();
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getPushStatus().then(setStatus);
  }, []);

  const toggle = async (turnOn: boolean) => {
    setBusy(true);
    setFailed(false);

    try {
      if (turnOn) {
        setStatus(await enablePush());
      } else {
        await disablePush();
        setStatus('off');
      }
    } catch (error) {
      console.warn('[ProsControl] push toggle failed', error);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  // Still checking the browser; avoid a flash of the wrong state.
  if (status === null) {
    return null;
  }

  return (
    <Card sx={{ ...cardSx, p: 2.5, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <PushIcon sx={{ color: 'var(--pc-accent)' }} />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, color: 'var(--pc-text)' }}>
            {t('portal.push.title', 'Desktop notifications')}
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'var(--pc-text-3)' }}>
            {statusText(status)}
          </Typography>
        </Box>

        <Switch
          checked={status === 'on'}
          disabled={
            busy || status === 'unsupported' || status === 'unconfigured'
          }
          onChange={(event) => toggle(event.target.checked)}
          slotProps={{
            input: {
              'aria-label': t('portal.push.title', 'Desktop notifications'),
            },
          }}
        />
      </Box>

      {failed && (
        <Alert severity='error' sx={{ mt: 2 }}>
          {t(
            'portal.push.failed',
            'Couldn’t change desktop notifications. Please try again.'
          )}
        </Alert>
      )}
    </Card>
  );
}
