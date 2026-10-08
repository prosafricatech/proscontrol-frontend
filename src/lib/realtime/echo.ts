import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Public Reverb values (the app key is public; the secret stays on the backend).
const KEY = process.env.NEXT_PUBLIC_REVERB_APP_KEY;
const HOST = process.env.NEXT_PUBLIC_REVERB_HOST;
const PORT = Number(process.env.NEXT_PUBLIC_REVERB_PORT) || 8080;
const USE_TLS = process.env.NEXT_PUBLIC_REVERB_SCHEME === 'https';

/** False when the NEXT_PUBLIC_REVERB_* values are missing: the app polls instead. */
export const isRealtimeConfigured = Boolean(KEY && HOST);

/**
 * Polling while the WebSocket is down. On by default; set
 * NEXT_PUBLIC_POLLING_FALLBACK=off to test WebSockets on their own (nothing
 * updates live then unless Reverb and the queue worker are running).
 */
export const isPollingFallbackEnabled =
  process.env.NEXT_PUBLIC_POLLING_FALLBACK !== 'off';

type AuthCallback = (error: Error | null, data: any) => void;

/**
 * Channel auth goes through our Next proxy, which adds the Bearer token on
 * the server, instead of Echo calling Laravel directly.
 */
function authorizer(channel: { name: string }) {
  return {
    authorize: (socketId: string, callback: AuthCallback) => {
      fetch('/api/support/broadcasting/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socket_id: socketId,
          channel_name: channel.name,
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Channel auth failed (${response.status})`);
          }
          callback(null, await response.json());
        })
        .catch((error: Error) => callback(error, null));
    },
  };
}

/** A new Echo client for Laravel Reverb, or null when it isn't configured. */
export function createEcho(): Echo<'reverb'> | null {
  if (!isRealtimeConfigured || typeof window === 'undefined') {
    return null;
  }

  return new Echo({
    broadcaster: 'reverb',
    key: KEY!,
    wsHost: HOST!,
    wsPort: PORT,
    wssPort: PORT,
    forceTLS: USE_TLS,
    enabledTransports: ['ws', 'wss'],
    Pusher,
    authorizer,
  });
}
