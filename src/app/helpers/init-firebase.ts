import { initializeApp } from "firebase/app";
import { getMessaging, onMessage, isSupported } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Boolean(firebaseConfig.projectId && firebaseConfig.messagingSenderId && firebaseConfig.appId);

// Initialize Firebase App (safe even on server) — only when configured, since
// an all-undefined config still "succeeds" here but throws later on
// getMessaging(), which is an easy footgun to hit in environments (e.g. local
// dev) where the NEXT_PUBLIC_FIREBASE_* env vars simply aren't set.
const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;

let messaging: any = null;

// Initialize messaging only in the browser
if (app && typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        messaging = getMessaging(app);
      }
    })
    .catch(() => {
      // Push notifications are optional — never let a messaging setup
      // failure (unsupported browser, service worker registration issue)
      // surface as an unhandled error.
    });
}

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export { messaging };
