import { unregisterPushForSignOut } from '@/lib/push/pushNotifications';

/**
 * Tells the backend the user is signing out: stops push notifications to
 * this browser, then revokes the API token. Never throws: an expired token
 * or a network error must not stop the user from signing out locally.
 */
export async function signOutOfBackend() {
  try {
    // First, while the API token still works.
    await unregisterPushForSignOut();
    await fetch('/api/support/logout', { method: 'POST' });
  } catch {
    // Ignored on purpose; see above.
  }
}
