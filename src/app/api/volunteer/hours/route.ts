import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { awardPoints } from '@/lib/points';

// GET — fetch current user's volunteer hours summary
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const db = getDb();

  // Get signups with opportunity info and hours
  const rows = db.prepare(`
    SELECT vs.id, vs.opportunity_id, vs.hours_logged, vs.checked_in, vs.signed_up_at,
           vo.title, vo.event_date, vo.start_time, vo.end_time, vo.location,
           m.name AS ministry_name, m.category AS ministry_category
    FROM volunteer_signups vs
    JOIN volunteer_opportunities vo ON vs.opportunity_id = vo.id
    LEFT JOIN ministries m ON vo.ministry_id = m.id
    WHERE vs.user_id = ?
    ORDER BY vo.event_date DESC
  `).all(userId) as any[];

  const totalHours = rows.reduce((sum: number, r: any) => sum + (r.hours_logged || 0), 0);

  return NextResponse.json({ signups: rows, totalHours });
}

// POST — log volunteer hours for a signup
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();
  const { signupId, hours, opportunityId } = body;

  if (!hours || hours <= 0 || hours > 24) {
    return NextResponse.json({ error: 'Invalid hours value (1–24)' }, { status: 400 });
  }

  const db = getDb();

  // If logging by opportunityId directly (create signup if not exists)
  let targetSignupId = signupId;
  if (!targetSignupId && opportunityId) {
    const existing = db.prepare(
      'SELECT id FROM volunteer_signups WHERE user_id = ? AND opportunity_id = ?'
    ).get(userId, opportunityId) as any;

    if (existing) {
      targetSignupId = existing.id;
    } else {
      // Auto-create signup
      const result = db.prepare(
        'INSERT INTO volunteer_signups (opportunity_id, user_id, hours_logged) VALUES (?, ?, ?)'
      ).run(opportunityId, userId, hours);
      targetSignupId = result.lastInsertRowid;

      // Increment slots_filled
      db.prepare('UPDATE volunteer_opportunities SET slots_filled = slots_filled + 1 WHERE id = ?')
        .run(opportunityId);

      await awardPoints(userId, 'volunteer', { hours });
      return NextResponse.json({ success: true, signupId: targetSignupId, hoursLogged: hours });
    }
  }

  if (!targetSignupId) {
    return NextResponse.json({ error: 'Signup not found' }, { status: 404 });
  }

  // Verify ownership
  const signup = db.prepare(
    'SELECT id, hours_logged FROM volunteer_signups WHERE id = ? AND user_id = ?'
  ).get(targetSignupId, userId) as any;

  if (!signup) {
    return NextResponse.json({ error: 'Signup not found' }, { status: 404 });
  }

  db.prepare('UPDATE volunteer_signups SET hours_logged = ?, checked_in = 1 WHERE id = ?')
    .run(hours, targetSignupId);

  await awardPoints(userId, 'volunteer', { hours });

  return NextResponse.json({ success: true, hoursLogged: hours });
}
