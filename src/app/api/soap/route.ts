import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { awardPoints } from '@/lib/points';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;

    const entries = db.prepare(`
      SELECT * FROM soap_entries WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId);

    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get entries' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;
    const { scripture, observation, application, prayer, privacy_level = 'private', verse_reference } = await req.json();

    if (!scripture) {
      return NextResponse.json({ error: 'Scripture is required' }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO soap_entries (user_id, scripture, observation, application, prayer, privacy_level, verse_reference)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, scripture, observation || '', application || '', prayer || '', privacy_level, verse_reference || '');

    const actionKey = `journal_entry_${privacy_level}` as any;
    await awardPoints(userId, actionKey, { entry_id: result.lastInsertRowid });

    const entry = db.prepare('SELECT * FROM soap_entries WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}
