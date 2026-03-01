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
    const bookmarks = db.prepare('SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    return NextResponse.json({ bookmarks });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get bookmarks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;
    const { version_id, book_number, chapter, verse, tags = [] } = await req.json();

    const existing = db.prepare(
      'SELECT id FROM bookmarks WHERE user_id = ? AND version_id = ? AND book_number = ? AND chapter = ? AND verse = ?'
    ).get(userId, version_id, book_number, chapter, verse);

    if (existing) {
      db.prepare('DELETE FROM bookmarks WHERE id = ?').run((existing as any).id);
      return NextResponse.json({ success: true, action: 'removed' });
    }

    const result = db.prepare(
      'INSERT INTO bookmarks (user_id, version_id, book_number, chapter, verse, tags) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId, version_id, book_number, chapter, verse, JSON.stringify(tags));

    await awardPoints(userId, 'bible_bookmark');
    return NextResponse.json({ success: true, action: 'added', id: result.lastInsertRowid });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to toggle bookmark' }, { status: 500 });
  }
}
