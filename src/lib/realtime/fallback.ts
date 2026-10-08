/**
 * How the app keeps data fresh when the WebSocket can't be trusted.
 *
 * - Socket down (Reverb restarting, a network that blocks WebSockets, a
 *   laptop waking up): polling takes over until it reconnects.
 * - Socket up: a quiet safety check every couple of minutes. If the backend's
 *   queue worker stops, the socket stays open but goes silent, and only this
 *   check notices.
 *
 * Both are on by default. NEXT_PUBLIC_POLLING_FALLBACK=off switches both off,
 * to test WebSockets on their own.
 */
export const isPollingFallbackEnabled =
  process.env.NEXT_PUBLIC_POLLING_FALLBACK !== 'off';

/** Safety-check interval while the socket is connected. */
export const CONNECTED_SAFETY_CHECK_MS = 2 * 60 * 1000;
