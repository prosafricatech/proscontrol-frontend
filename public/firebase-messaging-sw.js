importScripts('https://www.gstatic.com/firebasejs/9.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.4.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing the config object
firebase.initializeApp({
    apiKey: "AIzaSyALaQuB7pqsPVkqSqAEjzo6_cZgNc-UxK4",
    authDomain: "proserp-notifications.firebaseapp.com",
    projectId: "proserp-notifications",
    storageBucket: "proserp-notifications.firebasestorage.app",
    messagingSenderId: "1066103146676",
    appId: "1:1066103146676:web:47de37dd1678ea7262afe1"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();


