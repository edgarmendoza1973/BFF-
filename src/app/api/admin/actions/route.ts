import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

// GET /api/admin/actions — get audit log or admin data
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (!['admin', 'pastor'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getDb();

  const stats = {
    totalUsers: (db.prepare('SELECT COUNT(*) as count FROM users').get() as any)?.count || 0,
    activeLeaders: (db.prepare('SELECT COUNT(*) as count FROM leaders WHERE available = 1').get() as any)?.count || 0,
    totalConversations: (db.prepare('SELECT COUNT(*) as count FROM conversations').get() as any)?.count || 0,
    totalDonations: (db.prepare('SELECT COALESCE(SUM(amount),0) as total FROM donations WHERE status = "completed"').get() as any)?.total || 0,
    totalEvents: (db.prepare('SELECT COUNT(*) as count FROM events').get() as any)?.count || 0,
    totalGroups: (db.prepare('SELECT COUNT(*) as count FROM groups').get() as any)?.count || 0,
    totalPrayers: (db.prepare('SELECT COUNT(*) as count FROM prayer_requests').get() as any)?.count || 0,
    totalSermons: (db.prepare('SELECT COUNT(*) as count FROM sermons').get() as any)?.count || 0,
    recentSignups: db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 10').all(),
  };

  return NextResponse.json(stats);
}

// POST /api/admin/actions — perform admin actions
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
  }

  const body = await req.json();
  const { action, targetId, data } = body;

  const db = getDb();

  switch (action) {
    case 'change_role': {
      if (!targetId || !data?.role) return NextResponse.json({ error: 'Missing params' }, { status: 400 });
      const validRoles = ['user', 'leader', 'pastor', 'admin'];
      if (!validRoles.includes(data.role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run(data.role, targetId);
      return NextResponse.json({ success: true, message: `Role updated to ${data.role}` });
    }

    case 'suspend_user': {
      if (!targetId) return NextResponse.json({ error: 'Missing targetId' }, { status: 400 });
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run('suspended', targetId);
      return NextResponse.json({ success: true, message: 'User suspended' });
    }

    case 'approve_donor_wall': {
      if (!targetId) return NextResponse.json({ error: 'Missing targetId' }, { status: 400 });
      db.prepare('UPDATE donor_wall SET approved = 1 WHERE id = ?').run(targetId);
      return NextResponse.json({ success: true, message: 'Donor wall entry approved' });
    }

    case 'resolve_escalation': {
      if (!targetId) return NextResponse.json({ error: 'Missing targetId' }, { status: 400 });
      db.prepare('UPDATE chat_escalations SET resolved_at = CURRENT_TIMESTAMP, resolved_by = ? WHERE id = ?')
        .run((session.user as any).id, targetId);
      return NextResponse.json({ success: true, message: 'Escalation resolved' });
    }

    case 'send_notification': {
      if (!data?.userIds || !data?.title || !data?.body) {
        return NextResponse.json({ error: 'Missing notification data' }, { status: 400 });
      }
      const stmt = db.prepare('INSERT INTO notifications (user_id, type, title, body) VALUES (?, ?, ?, ?)');
      const insertMany = db.transaction((ids: string[]) => {
        ids.forEach(uid => stmt.run(uid, 'admin_broadcast', data.title, data.body));
      });
      insertMany(data.userIds);
      return NextResponse.json({ success: true, message: `Notification sent to ${data.userIds.length} users` });
    }

    case 'toggle_leader_availability': {
      if (!targetId) return NextResponse.json({ error: 'Missing targetId' }, { status: 400 });
      const leader = db.prepare('SELECT available FROM leaders WHERE user_id = ?').get(targetId) as any;
      if (!leader) return NextResponse.json({ error: 'Leader not found' }, { status: 404 });
      db.prepare('UPDATE leaders SET available = ? WHERE user_id = ?').run(leader.available ? 0 : 1, targetId);
      return NextResponse.json({ success: true, available: !leader.available });
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
