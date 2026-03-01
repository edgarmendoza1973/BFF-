import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    if (!['pastor', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const db = getDb();

    const totalUsers         = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any)?.c || 0;
    const totalSermons       = (db.prepare('SELECT COUNT(*) as c FROM sermons').get() as any)?.c || 0;
    const totalEvents        = (db.prepare('SELECT COUNT(*) as c FROM events').get() as any)?.c || 0;
    const totalGroups        = (db.prepare('SELECT COUNT(*) as c FROM groups').get() as any)?.c || 0;
    const totalDonations     = (db.prepare("SELECT COALESCE(SUM(amount),0) as t FROM donations WHERE status='completed'").get() as any)?.t || 0;
    const totalJournals      = (db.prepare('SELECT COUNT(*) as c FROM soap_entries').get() as any)?.c || 0;
    const totalPrayers       = (db.prepare('SELECT COUNT(*) as c FROM prayer_requests').get() as any)?.c || 0;
    const activeLeaders      = (db.prepare('SELECT COUNT(*) as c FROM leaders WHERE available = 1').get() as any)?.c || 0;
    const totalConversations = (db.prepare('SELECT COUNT(*) as c FROM conversations').get() as any)?.c || 0;

    const memberLevels = db.prepare(`
      SELECT member_level, COUNT(*) as count
      FROM user_profiles GROUP BY member_level
    `).all();

    const recentUsers = db.prepare(`
      SELECT u.id, u.email, u.name, u.role, u.created_at, up.member_level, up.faith_points
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      ORDER BY u.created_at DESC LIMIT 5
    `).all();

    const recentDonations = db.prepare(`
      SELECT d.*, u.name as donor_name
      FROM donations d
      LEFT JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC LIMIT 5
    `).all();

    return NextResponse.json({
      stats: {
        total_users:          totalUsers,
        total_sermons:        totalSermons,
        total_events:         totalEvents,
        total_groups:         totalGroups,
        total_donations:      totalDonations,
        total_journals:       totalJournals,
        total_prayers:        totalPrayers,
        active_leaders:       activeLeaders,
        total_conversations:  totalConversations,
      },
      member_levels:    memberLevels,
      recent_users:     recentUsers,
      recent_donations: recentDonations,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get metrics' }, { status: 500 });
  }
}
