import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { awardPoints } from '@/lib/points';

// GET /api/reading-plans/progress?plan_id=xxx
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const planId = searchParams.get('plan_id');

  const db = getDb();

  if (planId) {
    const progress = db.prepare(`
      SELECT urp.*, rp.title, rp.duration_days
      FROM user_reading_progress urp
      JOIN reading_plans rp ON urp.plan_id = rp.id
      WHERE urp.user_id = ? AND urp.plan_id = ?
    `).get(userId, planId);

    const days = db.prepare(`SELECT * FROM plan_days WHERE plan_id = ? ORDER BY day_number`).all(planId);

    return NextResponse.json({ progress, days });
  }

  // All plans user is enrolled in
  const allProgress = db.prepare(`
    SELECT urp.*, rp.title, rp.duration_days, rp.description
    FROM user_reading_progress urp
    JOIN reading_plans rp ON urp.plan_id = rp.id
    WHERE urp.user_id = ?
    ORDER BY urp.last_read_at DESC
  `).all(userId);

  return NextResponse.json({ progress: allProgress });
}

// POST /api/reading-plans/progress — enroll or update progress
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();
  const { planId, action, completedDay } = body;

  if (!planId) return NextResponse.json({ error: 'planId required' }, { status: 400 });

  const db = getDb();

  // Enroll in plan
  if (action === 'enroll') {
    const existing = db.prepare('SELECT id FROM user_reading_progress WHERE user_id = ? AND plan_id = ?').get(userId, planId);
    if (!existing) {
      db.prepare(`
        INSERT INTO user_reading_progress (user_id, plan_id, current_day, completed_days, streak)
        VALUES (?, ?, 1, '[]', 0)
      `).run(userId, planId);
      await awardPoints(userId, 'reading_plan_enrolled', 10);
    }
    return NextResponse.json({ success: true, message: 'Enrolled' });
  }

  // Mark day complete
  if (action === 'complete_day' && completedDay) {
    const progress = db.prepare('SELECT * FROM user_reading_progress WHERE user_id = ? AND plan_id = ?').get(userId, planId) as any;
    if (!progress) return NextResponse.json({ error: 'Not enrolled' }, { status: 404 });

    const completedDays: number[] = JSON.parse(progress.completed_days || '[]');
    if (!completedDays.includes(completedDay)) {
      completedDays.push(completedDay);
    }

    const plan = db.prepare('SELECT duration_days FROM reading_plans WHERE id = ?').get(planId) as any;
    const nextDay = Math.min(completedDay + 1, plan?.duration_days || 365);

    // Calculate streak
    const today = new Date().toISOString().split('T')[0];
    const lastRead = progress.last_read_at ? new Date(progress.last_read_at).toISOString().split('T')[0] : null;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newStreak = lastRead === yesterday ? (progress.streak || 0) + 1 : 1;

    db.prepare(`
      UPDATE user_reading_progress
      SET current_day = ?, completed_days = ?, last_read_at = CURRENT_TIMESTAMP, streak = ?
      WHERE user_id = ? AND plan_id = ?
    `).run(nextDay, JSON.stringify(completedDays), newStreak, userId, planId);

    await awardPoints(userId, 'reading_day_complete', 15);

    // Check if plan completed
    if (completedDays.length >= (plan?.duration_days || 365)) {
      await awardPoints(userId, 'reading_plan_complete', 100);
    }

    return NextResponse.json({ success: true, streak: newStreak, completedDays });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
