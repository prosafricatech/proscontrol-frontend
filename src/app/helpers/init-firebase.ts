import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging';

// Values come from .env.local (project: proscontrol-notifications). They are
// public identifiers, not secrets.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.projectId &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId
);

let messagingPromise: Promise<Messaging | null> | null = null;

/**
 * Firebase Cloud Messaging for this browser, or null when it can't be used:
 * on the server, without the NEXT_PUBLIC_FIREBASE_* config, or in a browser
 * without push support (e.g. Safari outside an installed web app).
 */
export function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined' || !isFirebaseConfigured) {
    return Promise.resolve(null);
  }

  messagingPromise ??= isSupported()
    .then((supported) => {
      if (!supported) {
        return null;
      }
      const app: FirebaseApp = initializeApp(firebaseConfig);

      return getMessaging(app);
    })
    .catch(() => null);

  return messagingPromise;
}
