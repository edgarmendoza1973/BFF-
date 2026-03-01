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
    const { searchParams } = new URL(req.url);
    const version = searchParams.get('version');
    const book = searchParams.get('book');
    const chapter = searchParams.get('chapter');

    let query = 'SELECT * FROM verse_notes WHERE user_id = ?';
    const params: any[] = [userId];
    if (version) { query += ' AND version_id = ?'; params.push(version); }
    if (book) { query += ' AND book_number = ?'; params.push(parseInt(book)); }
    if (chapter) { query += ' AND chapter = ?'; params.push(parseInt(chapter)); }
    query += ' ORDER BY created_at DESC';

    const notes = db.prepare(query).all(...params);
    return NextResponse.json({ notes });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get notes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;
    const { version_id, book_number, chapter, verse, note_text } = await req.json();

    const existing = db.prepare(
      'SELECT id FROM verse_notes WHERE user_id = ? AND version_id = ? AND book_number = ? AND chapter = ? AND verse = ?'
    ).get(userId, version_id, book_number, chapter, verse);

    if (existing) {
      db.prepare(
        'UPDATE verse_notes SET note_text = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(note_text, (existing as any).id);
      return NextResponse.json({ success: true, message: 'Note updated' });
    }

    const result = db.prepare(
      'INSERT INTO verse_notes (user_id, version_id, book_number, chapter, verse, note_text) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId, version_id, book_number, chapter, verse, note_text);

    await awardPoints(userId, 'bible_verse_note', { verse: `${book_number}:${chapter}:${verse}` });
    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 });
  }
}
