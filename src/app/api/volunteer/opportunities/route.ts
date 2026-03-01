import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();

    const opportunities = db.prepare(`
      SELECT vo.*, m.name as ministry_name, m.category as ministry_category
      FROM volunteer_opportunities vo
      LEFT JOIN ministries m ON vo.ministry_id = m.id
      ORDER BY vo.event_date ASC
    `).all();

    const ministries = db.prepare('SELECT * FROM ministries ORDER BY name ASC').all();

    return NextResponse.json({ opportunities, ministries });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get opportunities' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    if (!['leader', 'pastor', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Only leaders can create opportunities' }, { status: 403 });
    }
    const db = getDb();
    const { ministry_id, title, description, event_date, start_time, end_time, slots_total, location } = await req.json();

    const result = db.prepare(`
      INSERT INTO volunteer_opportunities (ministry_id, title, description, event_date, start_time, end_time, slots_total, location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(ministry_id || null, title, description || '', event_date || null, start_time || '', end_time || '', slots_total || 10, location || '');

    const opp = db.prepare('SELECT * FROM volunteer_opportunities WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json({ opportunity: opp }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create opportunity' }, { status: 500 });
  }
}
