import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { awardPoints } from '@/lib/points';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;
    const { payment_intent_id, donation_id } = await req.json();

    // In production, verify with Stripe
    db.prepare(`
      UPDATE donations SET status = 'completed', receipt_sent = 1
      WHERE id = ? AND user_id = ?
    `).run(donation_id, userId);

    const donation = db.prepare('SELECT * FROM donations WHERE id = ?').get(donation_id) as any;

    if (donation) {
      await awardPoints(userId, 'first_message', { donation_id });
    }

    return NextResponse.json({
      success: true,
      message: 'Donation confirmed. Thank you for your generosity!',
      donation,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to confirm donation' }, { status: 500 });
  }
}
