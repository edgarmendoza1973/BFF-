import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;
    const prefs = db.prepare('SELECT * FROM bible_preferences WHERE user_id = ?').get(userId);
    return NextResponse.json({ preferences: prefs || { last_version: 'ESV', last_book: 1, last_chapter: 1 } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get preferences' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;
    const { last_version, last_book, last_chapter } = await req.json();

    db.prepare(`
      INSERT INTO bible_preferences (user_id, last_version, last_book, last_chapter, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        last_version = COALESCE(excluded.last_version, last_version),
        last_book = COALESCE(excluded.last_book, last_book),
        last_chapter = COALESCE(excluded.last_chapter, last_chapter),
        updated_at = CURRENT_TIMESTAMP
    `).run(userId, last_version || 'ESV', last_book || 1, last_chapter || 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
