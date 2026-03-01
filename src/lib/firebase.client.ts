/**
 * firebase.client.ts — Browser-only Firebase helpers
 * Never imports @/lib/db or any Node-only module.
 */
'use client';

export const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const { initializeApp, getApps } = await import('firebase/app');
    const { getMessaging, getToken }  = await import('firebase/messaging');

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (token) {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceToken: token, platform: 'web' }),
      });
    }
    return token;
  } catch (err) {
    console.error('[FCM] requestNotificationPermission error:', err);
    return null;
  }
}
