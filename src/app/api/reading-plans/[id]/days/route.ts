import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const db = getDb();

    const days = db.prepare(`
      SELECT pd.*, bb.name as book_name
      FROM plan_days pd
      LEFT JOIN bible_books bb ON pd.book_id = bb.book_number AND bb.version_id = 1
      WHERE pd.plan_id = ?
      ORDER BY pd.day_number ASC
    `).all(parseInt(id));

    return NextResponse.json({ days });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch plan days' }, { status: 500 });
  }
}
