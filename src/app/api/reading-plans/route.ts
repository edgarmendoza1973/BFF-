import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const plans = db.prepare('SELECT * FROM reading_plans ORDER BY is_premade DESC, title ASC').all();
    return NextResponse.json({ plans });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get reading plans' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;
    const { title, description, duration_days, passages } = await req.json();

    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

    const result = db.prepare(`
      INSERT INTO reading_plans (title, description, duration_days, is_premade, created_by)
      VALUES (?, ?, ?, 0, ?)
    `).run(title, description || '', duration_days || 30, userId);

    const planId = result.lastInsertRowid;

    // If passages provided, create plan days
    if (passages && Array.isArray(passages)) {
      passages.forEach((passage: string, i: number) => {
        db.prepare('INSERT INTO plan_days (plan_id, day_number, passages) VALUES (?, ?, ?)').run(planId, i + 1, JSON.stringify([passage]));
      });
    }

    const plan = db.prepare('SELECT * FROM reading_plans WHERE id = ?').get(planId);
    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}
