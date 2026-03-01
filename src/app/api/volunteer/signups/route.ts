import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

// GET — list user's current signups
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const db = getDb();

  const signups = db.prepare(`
    SELECT vs.id, vs.opportunity_id, vs.hours_logged, vs.checked_in, vs.signed_up_at,
           vo.title, vo.event_date, vo.start_time, vo.end_time, vo.location,
           m.name AS ministry_name, m.category AS ministry_category
    FROM volunteer_signups vs
    JOIN volunteer_opportunities vo ON vs.opportunity_id = vo.id
    LEFT JOIN ministries m ON vo.ministry_id = m.id
    WHERE vs.user_id = ?
    ORDER BY vo.event_date DESC
  `).all(userId);

  return NextResponse.json({ signups });
}
