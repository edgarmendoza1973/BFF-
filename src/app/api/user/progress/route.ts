import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const userId = (session.user as any).id;

    const profile = db.prepare('SELECT faith_points, member_level FROM user_profiles WHERE user_id = ?').get(userId) as any;
    const journalCount = (db.prepare('SELECT COUNT(*) as c FROM soap_entries WHERE user_id = ?').get(userId) as any)?.c || 0;
    const eventCount = (db.prepare('SELECT COUNT(*) as c FROM event_attendees WHERE user_id = ? AND attended = 1').get(userId) as any)?.c || 0;
    const volunteerHours = (db.prepare('SELECT COALESCE(SUM(hours_logged),0) as h FROM volunteer_signups WHERE user_id = ?').get(userId) as any)?.h || 0;
    const prayerCount = (db.prepare("SELECT COUNT(*) as c FROM prayer_interactions WHERE user_id = ? AND interaction_type='prayed'").get(userId) as any)?.c || 0;

    const badges = db.prepare(`
      SELECT b.*, ub.earned_at
      FROM badges b
      JOIN user_badges ub ON b.id = ub.badge_id
      WHERE ub.user_id = ?
      ORDER BY ub.earned_at DESC
    `).all(userId);

    const recentActivity = db.prepare(`
      SELECT * FROM user_progress WHERE user_id = ?
      ORDER BY created_at DESC LIMIT 10
    `).all(userId);

    return NextResponse.json({
      points: profile?.faith_points || 0,
      level: profile?.member_level || 'new_member',
      stats: {
        journals: journalCount,
        events: eventCount,
        volunteer_hours: volunteerHours,
        prayers: prayerCount,
      },
      badges,
      recent_activity: recentActivity,
    });
  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json({ error: 'Failed to get progress' }, { status: 500 });
  }
}
