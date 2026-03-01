import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { awardPoints } from '@/lib/points';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;
    const { id } = await params;
    const oppId = parseInt(id);

    const opp = db.prepare('SELECT * FROM volunteer_opportunities WHERE id = ?').get(oppId) as any;
    if (!opp) return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    if (opp.slots_filled >= opp.slots_total) return NextResponse.json({ error: 'No slots available' }, { status: 409 });

    const existing = db.prepare('SELECT id FROM volunteer_signups WHERE opportunity_id = ? AND user_id = ?').get(oppId, userId);
    if (existing) return NextResponse.json({ error: 'Already signed up' }, { status: 409 });

    db.prepare('INSERT INTO volunteer_signups (opportunity_id, user_id) VALUES (?, ?)').run(oppId, userId);
    db.prepare('UPDATE volunteer_opportunities SET slots_filled = slots_filled + 1 WHERE id = ?').run(oppId);

    return NextResponse.json({ success: true, message: 'Signed up successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to sign up' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;
    const { id } = await params;
    const oppId = parseInt(id);

    const result = db.prepare('DELETE FROM volunteer_signups WHERE opportunity_id = ? AND user_id = ?').run(oppId, userId);
    if (result.changes > 0) {
      db.prepare('UPDATE volunteer_opportunities SET slots_filled = MAX(0, slots_filled - 1) WHERE id = ?').run(oppId);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to cancel signup' }, { status: 500 });
  }
}
