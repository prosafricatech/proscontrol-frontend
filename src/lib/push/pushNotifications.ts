import {
  getFirebaseMessaging,
  isFirebaseConfigured,
} from '@/app/helpers/init-firebase';
import { deleteToken, getToken } from 'firebase/messaging';

/**
 * Browser push notifications, per browser:
 * - the user switches them on once (the browser asks for permission then);
 * - the token is re-sent to the backend each time the app loads, so it
 *   follows whoever is signed in and survives Firebase rotating it;
 * - signing out unregisters the token but remembers the choice.
 */

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
const ENABLED_KEY = 'pc-push-enabled';
const TOKEN_KEY = 'pc-push-token';

export type PushStatus =
  /** The NEXT_PUBLIC_FIREBASE_* config or the VAPID key is missing. */
  | 'unconfigured'
  /** This browser can't do push. */
  | 'unsupported'
  /** The user blocked notifications for this site. */
  | 'blocked'
  | 'off'
  | 'on';

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch {
    // Private mode etc.: push still works for this page load.
  }
}

async function sendToken(method: 'POST' | 'DELETE', token: string) {
  const response = await fetch('/api/support/push-tokens', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    throw new Error(`Push token ${method} failed (${response.status})`);
  }
}

/** Gets this browser's token from Firebase and hands it to the backend. */
async function registerBrowser(): Promise<void> {
  const messaging = await getFirebaseMessaging();
  if (!messaging || !VAPID_KEY) {
    throw new Error('Push notifications are not available');
  }

  // Firebase registers /firebase-messaging-sw.js under its own scope, so it
  // doesn't clash with the app's PWA service worker.
  const token = await getToken(messaging, { vapidKey: VAPID_KEY });
  await sendToken('POST', token);
  writeStorage(TOKEN_KEY, token);
}

export async function getPushStatus(): Promise<PushStatus> {
  if (!isFirebaseConfigured || !VAPID_KEY) {
    return 'unconfigured';
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging || typeof Notification === 'undefined') {
    return 'unsupported';
  }
  if (Notification.permission === 'denied') {
    return 'blocked';
  }

  const isOn =
    readStorage(ENABLED_KEY) === '1' && Notification.permission === 'granted';

  return isOn ? 'on' : 'off';
}

/** Asks for permission (must follow a click) and registers this browser. */
export async function enablePush(): Promise<PushStatus> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return permission === 'denied' ? 'blocked' : 'off';
  }

  await registerBrowser();
  writeStorage(ENABLED_KEY, '1');

  return 'on';
}

export async function disablePush(): Promise<void> {
  const token = readStorage(TOKEN_KEY);
  writeStorage(ENABLED_KEY, null);
  writeStorage(TOKEN_KEY, null);

  if (token) {
    await sendToken('DELETE', token).catch(() => undefined);
  }

  const messaging = await getFirebaseMessaging();
  if (messaging) {
    await deleteToken(messaging).catch(() => undefined);
  }
}

/** On app load: re-register if the user switched push on earlier. */
export async function resumePush(): Promise<void> {
  if ((await getPushStatus()) !== 'on') {
    return;
  }

  await registerBrowser().catch((error) => {
    console.warn('[ProsControl] could not refresh the push token', error);
  });
}

/** Before signing out: stop pushes to this browser, keep the user's choice. */
export async function unregisterPushForSignOut(): Promise<void> {
  const token = readStorage(TOKEN_KEY);
  if (!token) {
    return;
  }

  writeStorage(TOKEN_KEY, null);
  await sendToken('DELETE', token).catch(() => undefined);
}
