'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { getFirebaseMessaging } from '@/app/helpers/init-firebase';
import { resumePush } from '@/lib/push/pushNotifications';
import { useSupportNotifications } from '@/lib/support/NotificationsProvider';
import { onMessage } from 'firebase/messaging';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useEffect } from 'react';

/**
 * Push messages that arrive while ProsControl is open and focused. The
 * browser doesn't show those itself, so show a toast and refresh the bell
 * right away instead of waiting for the next poll.
 *
 * Also re-registers this browser's push token on load (see resumePush), and
 * opens the page a push was about when it's clicked while this tab is open
 * (the service worker sends the path without the language prefix).
 */
export function PushListener() {
  const lang = useLanguage();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { refresh } = useSupportNotifications();

  useEffect(() => {
    resumePush();
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const openPath = (event: MessageEvent) => {
      if (event.data?.type === 'pc:open-path') {
        router.push(`/${lang}${event.data.path}`);
      }
    };

    navigator.serviceWorker.addEventListener('message', openPath);

    return () => {
      navigator.serviceWorker.removeEventListener('message', openPath);
    };
  }, [lang, router]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    getFirebaseMessaging().then((messaging) => {
      if (!messaging || cancelled) {
        return;
      }

      unsubscribe = onMessage(messaging, (payload) => {
        const title = payload.notification?.title;
        const body = payload.notification?.body;

        if (title) {
          enqueueSnackbar(body ? `${title}: ${body}` : title, {
            variant: 'info',
            autoHideDuration: 5000,
            anchorOrigin: { vertical: 'top', horizontal: 'right' },
          });
        }
        refresh();
      });
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [enqueueSnackbar, refresh]);

  return null;
}
