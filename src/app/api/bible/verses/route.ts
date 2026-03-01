import { NextRequest, NextResponse } from 'next/server';
import { getDb, initializeDatabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    initializeDatabase();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const version = searchParams.get('version') || 'ESV';
    const book = parseInt(searchParams.get('book') || '1');
    const chapter = parseInt(searchParams.get('chapter') || '1');

    const verses = db.prepare(`
      SELECT verse, text FROM bible_verses
      WHERE version_id = ? AND book_number = ? AND chapter = ?
      ORDER BY verse ASC
    `).all(version, book, chapter);

    const bookInfo = db.prepare(`
      SELECT name, chapters FROM bible_books
      WHERE version_id = ? AND book_number = ?
    `).get(version, book) as any;

    return NextResponse.json({
      verses,
      book_name: bookInfo?.name || `Book ${book}`,
      total_chapters: bookInfo?.chapters || 1,
      version,
      book,
      chapter,
    });
  } catch (error) {
    console.error('Bible verses error:', error);
    return NextResponse.json({ error: 'Failed to get verses' }, { status: 500 });
  }
}
