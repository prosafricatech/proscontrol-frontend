/**
 * Tells the backend the user is signing out. Never throws: an expired token
 * or a network error must not stop the user from signing out locally.
 */
export async function signOutOfBackend() {
  try {
    await fetch('/api/support/logout', { method: 'POST' });
  } catch {
    // Ignored on purpose; see above.
  }
}
