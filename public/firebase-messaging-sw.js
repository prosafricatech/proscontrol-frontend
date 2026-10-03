// Receives push messages while no ProsControl tab is focused. Firebase shows
// messages that carry a `notification` payload automatically.
//
// Service workers can't read .env, so the config is repeated here. Keep it in
// sync with the NEXT_PUBLIC_FIREBASE_* values (project: proscontrol-notifications).

// Registered before the Firebase scripts so it runs instead of Firebase's
// default click handler. The backend sends `ticket_id` and `audience`
// (staff | customer); page routes are decided here, in the frontend.
self.addEventListener('notificationclick', (event) => {
  const data = event.notification.data?.FCM_MSG?.data ?? {};

  event.notification.close();
  event.stopImmediatePropagation();
  event.waitUntil(openInApp(pathFor(data)));
});

function pathFor(data) {
  if (!data.ticket_id) {
    return '/notifications';
  }

  return data.audience === 'staff'
    ? `/support/staff/tickets/${data.ticket_id}`
    : `/support/customer/${data.ticket_id}`;
}

// Reuse an open ProsControl tab (it adds the language prefix and navigates,
// see PushListener); otherwise open a new one, where the middleware adds it.
async function openInApp(path) {
  const windows = await clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });
  const appWindow = windows.find(
    (client) => new URL(client.url).origin === self.location.origin
  );

  if (appWindow) {
    await appWindow.focus();
    appWindow.postMessage({ type: 'pc:open-path', path });
    return;
  }

  await clients.openWindow(path);
}

importScripts(
  'https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js'
);

firebase.initializeApp({
  apiKey: 'AIzaSyB8HXcOEvVfssFgC9oxWs0yTpkowAMpRbU',
  authDomain: 'proscontrol-notifications.firebaseapp.com',
  projectId: 'proscontrol-notifications',
  storageBucket: 'proscontrol-notifications.firebasestorage.app',
  messagingSenderId: '226091551754',
  appId: '1:226091551754:web:ccbde91531e17929b6e3f3',
});

firebase.messaging();
