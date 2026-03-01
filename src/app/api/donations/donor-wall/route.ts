import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const entries = db.prepare(`
      SELECT dw.*, d.amount FROM donor_wall dw
      JOIN donations d ON dw.donation_id = d.id
      WHERE dw.approved = 1
      ORDER BY dw.created_at DESC LIMIT 20
    `).all();
    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get donor wall' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const { donation_id, display_name, message } = await req.json();

    const result = db.prepare(`
      INSERT INTO donor_wall (donation_id, display_name, amount, message)
      VALUES (?, ?, (SELECT amount FROM donations WHERE id = ?), ?)
    `).run(donation_id, display_name || 'Anonymous', donation_id, message || '');

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
