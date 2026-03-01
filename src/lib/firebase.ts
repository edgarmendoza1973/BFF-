/**
 * Firebase Cloud Messaging (FCM) — Push Notification Helper
 * Server-side: send push notifications via FCM API
 * Client-side: register device token
 */

// ─── Server-side FCM sender ─────────────────────────────────────
export async function sendPushNotification(options: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}) {
  const FCM_SERVER_KEY = process.env.FIREBASE_SERVER_KEY;
  const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;

  if (!FCM_SERVER_KEY || !PROJECT_ID) {
    console.warn('[FCM] Firebase credentials not configured');
    return null;
  }

  try {
    const payload = {
      message: {
        token: options.token,
        notification: {
          title: options.title,
          body: options.body,
          ...(options.imageUrl && { image: options.imageUrl }),
        },
        data: options.data || {},
        android: {
          notification: { click_action: 'FLUTTER_NOTIFICATION_CLICK' },
        },
        apns: {
          payload: {
            aps: { alert: { title: options.title, body: options.body }, badge: 1 },
          },
        },
        webpush: {
          notification: {
            icon: '/icons/icon-192.png',
            badge: '/icons/badge-72.png',
          },
        },
      },
    };

    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${FCM_SERVER_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      // 404 = token not found / unregistered — caller should remove it
      if (res.status === 404 || errorText.includes('UNREGISTERED') || errorText.includes('NOT_FOUND')) {
        return null; // signal invalid token to caller
      }
      console.error('[FCM] Send failed:', errorText);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error('[FCM] Error:', err);
    return null;
  }
}

export async function sendPushToUser(userId: string, title: string, body: string, data?: Record<string, string>) {
  try {
    const { getDb } = await import('./db');
    const db = getDb();
    const tokens = db.prepare('SELECT device_token FROM notification_tokens WHERE user_id = ?').all(userId) as any[];

    if (tokens.length === 0) return;

    await Promise.all(
      tokens.map(({ device_token }: any) =>
        sendPushNotification({ token: device_token, title, body, data })
      )
    );
  } catch (err) {
    console.error('[FCM] sendPushToUser error:', err);
  }
}

// ─── Client-side Firebase config ─────────────────────────────────────
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const { initializeApp, getApps } = await import('firebase/app');
    const { getMessaging, getToken } = await import('firebase/messaging');

    const app = getApps().length === 0
      ? initializeApp(firebaseConfig)
      : getApps()[0];

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission denied');
      return null;
    }

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (token) {
      // Register token with server
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
