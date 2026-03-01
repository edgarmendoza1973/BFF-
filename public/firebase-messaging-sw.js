// BFF+ Firebase Cloud Messaging Service Worker
// This file must be at the root of your public directory

importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

// These values are injected at build time or read from the page
// For production, replace with your real Firebase config
const firebaseConfig = {
  apiKey:            self.NEXT_PUBLIC_FIREBASE_API_KEY            || '',
  authDomain:        self.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        || '',
  projectId:         self.NEXT_PUBLIC_FIREBASE_PROJECT_ID         || 'bff-plus',
  storageBucket:     self.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: self.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID|| '',
  appId:             self.NEXT_PUBLIC_FIREBASE_APP_ID             || '',
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Handle background messages
  messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);
    const notificationTitle = payload.notification?.title || 'BFF+ Notification';
    const notificationOptions = {
      body:  payload.notification?.body  || '',
      icon:  payload.notification?.image || '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      tag:   payload.data?.tag || 'bff-notification',
      data:  payload.data || {},
      actions: [
        { action: 'open',    title: 'Open App' },
        { action: 'dismiss', title: 'Dismiss'  },
      ],
    };
    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.warn('[firebase-messaging-sw.js] Firebase init failed (missing config):', e);
}

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
