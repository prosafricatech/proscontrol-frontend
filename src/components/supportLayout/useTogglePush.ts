'use client';

import { useT } from '@/lib/i18n/useT';
import { togglePush, type PushStatus } from '@/lib/push/pushNotifications';
import { useSnackbar, type VariantType } from 'notistack';
import { useCallback } from 'react';

/** Switches desktop notifications on/off and says what happened. */
export function useTogglePush() {
  const t = useT();
  const { enqueueSnackbar } = useSnackbar();

  return useCallback(async () => {
    const feedback: Record<PushStatus, [string, VariantType]> = {
      on: [
        t('portal.push.turnedOn', 'Desktop notifications are on.'),
        'success',
      ],
      off: [
        t('portal.push.turnedOff', 'Desktop notifications are off.'),
        'info',
      ],
      blocked: [
        t(
          'portal.push.blocked',
          'Blocked in your browser. Allow notifications for this site in the browser’s site settings, then switch this on.'
        ),
        'warning',
      ],
      unsupported: [
        t('portal.push.unsupported', 'Not available in this browser.'),
        'warning',
      ],
      unconfigured: [
        t(
          'portal.push.unconfigured',
          'Not set up yet. An administrator needs to add the Firebase keys.'
        ),
        'warning',
      ],
    };

    try {
      const [message, variant] = feedback[await togglePush()];
      enqueueSnackbar(message, { variant });
    } catch (error) {
      console.warn('[ProsControl] push toggle failed', error);
      enqueueSnackbar(
        t(
          'portal.push.failed',
          'Couldn’t change desktop notifications. Please try again.'
        ),
        { variant: 'error' }
      );
    }
  }, [enqueueSnackbar, t]);
}
