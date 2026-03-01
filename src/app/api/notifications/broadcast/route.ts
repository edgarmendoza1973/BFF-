import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

// POST — Admin/Pastor sends a broadcast notification to all members
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (!['admin', 'pastor'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden — admin or pastor only' }, { status: 403 });
  }

  const body = await req.json();
  const { title, message, type = 'announcement', targetRole } = body;

  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
  }
  if (title.length > 100) return NextResponse.json({ error: 'Title too long (max 100 chars)' }, { status: 400 });
  if (message.length > 500) return NextResponse.json({ error: 'Message too long (max 500 chars)' }, { status: 400 });

  const db = getDb();

  // Get target users
  let users: any[];
  if (targetRole && targetRole !== 'all') {
    users = db.prepare('SELECT id FROM users WHERE role = ?').all(targetRole) as any[];
  } else {
    users = db.prepare('SELECT id FROM users').all() as any[];
  }

  // Insert notification for every user
  const insertStmt = db.prepare(`
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (?, ?, ?, ?, ?)
  `);

  const data = JSON.stringify({ broadcast: true, sender: (session.user as any).name || 'Admin' });

  const insertMany = db.transaction((userList: any[]) => {
    for (const u of userList) {
      insertStmt.run(u.id, type, title, message, data);
    }
  });

  insertMany(users);

  return NextResponse.json({
    success: true,
    sent: users.length,
    message: `Broadcast sent to ${users.length} member${users.length !== 1 ? 's' : ''}`,
  });
}

// GET — Admin: list recent broadcasts (notifications with broadcast=true)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (!['admin', 'pastor'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getDb();

  // Get distinct broadcasts (by grouping on title + body)
  const broadcasts = db.prepare(`
    SELECT title, body, type, created_at, COUNT(*) as recipient_count
    FROM notifications
    WHERE data LIKE '%"broadcast":true%'
    GROUP BY title, body, type, created_at
    ORDER BY created_at DESC
    LIMIT 20
  `).all();

  return NextResponse.json({ broadcasts });
}
