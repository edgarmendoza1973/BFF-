import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;

    const notifications = db.prepare(`
      SELECT * FROM notifications WHERE user_id = ?
      ORDER BY created_at DESC LIMIT 50
    `).all(userId);

    return NextResponse.json({ notifications });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get notifications' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as any;
    const db = getDb();
    const body = await req.json();
    const { title, message, type, broadcast, device_token } = body;

    // Handle device token registration
    if (device_token) {
      db.prepare(`
        INSERT INTO notification_tokens (user_id, device_token, platform)
        VALUES (?, ?, 'web')
        ON CONFLICT(device_token) DO UPDATE SET user_id = excluded.user_id
      `).run(user.id, device_token);
      return NextResponse.json({ success: true });
    }

    // Handle broadcast (admin/pastor only)
    if (broadcast) {
      if (!['admin', 'pastor'].includes(user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Get all users
      const allUsers = db.prepare('SELECT id FROM users WHERE is_active != 0').all() as { id: string }[];

      // Insert notification for each user
      const insertNotif = db.prepare(`
        INSERT INTO notifications (user_id, title, body, type, read, created_at)
        VALUES (?, ?, ?, 'broadcast', 0, CURRENT_TIMESTAMP)
      `);

      const broadcastTx = db.transaction(() => {
        for (const u of allUsers) {
          insertNotif.run(u.id, title || 'Church Announcement', message || '');
        }
      });
      broadcastTx();

      return NextResponse.json({
        success: true,
        message: `Broadcast sent to ${allUsers.length} members`,
        count: allUsers.length,
      });
    }

    // Handle single notification
    if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });
    const targetUserId = body.user_id || user.id;

    db.prepare(`
      INSERT INTO notifications (user_id, title, body, type, read, created_at)
      VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `).run(targetUserId, title, message || '', type || 'general');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Notifications POST]', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}

