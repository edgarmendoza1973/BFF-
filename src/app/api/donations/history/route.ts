import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;

    const donations = db.prepare(`
      SELECT * FROM donations WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId);

    const total = donations
      .filter((d: any) => d.status === 'completed')
      .reduce((sum: number, d: any) => sum + d.amount, 0);

    return NextResponse.json({ donations, total });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get history' }, { status: 500 });
  }
}
