/**
 * notifications.ts — Unified notification service
 *
 * 1. Saves the notification to the DB (in-app inbox).
 * 2. Looks up the user's FCM device tokens.
 * 3. Calls firebase.ts → sendPushNotification for every registered token.
 * 4. Removes any token that returns a 404/invalid response from FCM.
 */
import { getDb } from './db';

// ─── Types ─────────────────────────────────────────────────────────────────
interface NotificationPayload {
  title: string;
  body: string;
  type: string;
  data?: Record<string, any>;
  imageUrl?: string;
}

// ─── Token management helpers ───────────────────────────────────────────────
function getUserTokens(userId: string): string[] {
  try {
    const db     = getDb();
    const rows   = db.prepare(
      'SELECT device_token FROM notification_tokens WHERE user_id = ? AND device_token IS NOT NULL'
    ).all(userId) as any[];
    return rows.map(r => r.device_token as string).filter(Boolean);
  } catch {
    return [];
  }
}

function removeInvalidToken(token: string) {
  try {
    const db = getDb();
    db.prepare('DELETE FROM notification_tokens WHERE device_token = ?').run(token);
    console.log(`[FCM] Removed invalid token: ${token.slice(0, 20)}…`);
  } catch {}
}

// ─── Core send function ─────────────────────────────────────────────────────
export async function sendPushNotification(
  userId: string,
  notification: NotificationPayload
): Promise<void> {
  const db = getDb();

  // 1. Always persist to DB (in-app notifications inbox)
  try {
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      userId,
      notification.type,
      notification.title,
      notification.body,
      JSON.stringify(notification.data || {})
    );
  } catch (err) {
    console.error('[notifications] DB insert error:', err);
  }

  // 2. Check user notification preferences
  try {
    const profile = db.prepare(
      'SELECT notification_preferences FROM user_profiles WHERE user_id = ?'
    ).get(userId) as any;

    if (profile) {
      let prefs: Record<string, boolean> = {};
      try { prefs = JSON.parse(profile.notification_preferences || '{}'); } catch {}
      if (prefs[notification.type] === false) return; // user opted out
    }
  } catch {}

  // 3. Get user's FCM device tokens
  const tokens = getUserTokens(userId);
  if (tokens.length === 0) return; // no tokens registered — in-app only

  // 4. Check that Firebase server key is configured
  const serverKey = process.env.FIREBASE_SERVER_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!serverKey || !projectId) {
    // Firebase not configured — in-app notifications still work via DB
    return;
  }

  // 5. Import and call firebase.ts sender for each token
  try {
    const { sendPushNotification: fcmSend } = await import('./firebase');
    const dataAsStrings: Record<string, string> = {};
    if (notification.data) {
      for (const [k, v] of Object.entries(notification.data)) {
        dataAsStrings[k] = String(v);
      }
    }

    const results = await Promise.allSettled(
      tokens.map(token =>
        fcmSend({
          token,
          title:    notification.title,
          body:     notification.body,
          data:     dataAsStrings,
          imageUrl: notification.imageUrl,
        })
      )
    );

    // Remove tokens that are no longer valid
    results.forEach((result, idx) => {
      if (result.status === 'fulfilled' && result.value === null) {
        // null return = FCM reported invalid token
        removeInvalidToken(tokens[idx]);
      }
    });
  } catch (err) {
    console.error('[notifications] FCM send error:', err);
    // Don't throw — in-app notification is already saved
  }
}

// ─── Bulk send (e.g. broadcasts) ────────────────────────────────────────────
export async function sendBulkNotification(
  userIds: string[],
  notification: NotificationPayload
): Promise<void> {
  // Use Promise.allSettled so one failure doesn't abort the rest
  await Promise.allSettled(
    userIds.map(userId => sendPushNotification(userId, notification))
  );
}

// ─── Event reminder scheduler (called from a cron / background job) ─────────
export function scheduleEventReminders() {
  const db = getDb();
  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const now            = new Date().toISOString();

  const upcomingEvents = db.prepare(`
    SELECT e.*, ea.user_id
    FROM events e
    JOIN event_attendees ea ON e.id = ea.event_id
    WHERE e.event_date > ? AND e.event_date <= ?
    AND ea.response = 'yes'
  `).all(now, oneHourFromNow) as any[];

  for (const row of upcomingEvents) {
    sendPushNotification(row.user_id, {
      title: `⏰ Upcoming Event: ${row.title}`,
      body:  `Starting in 1 hour at ${row.location || 'TBD'}`,
      type:  'events',
      data:  { event_id: String(row.id) },
    });
  }
}
