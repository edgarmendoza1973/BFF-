import { NextRequest, NextResponse } from 'next/server';
import { getDb, initializeDatabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    initializeDatabase();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const version = searchParams.get('version') || 'ESV';

    const books = db.prepare(`
      SELECT book_number, name, testament, chapters
      FROM bible_books WHERE version_id = ?
      ORDER BY book_number ASC
    `).all(version);

    const versions = db.prepare('SELECT * FROM bible_versions').all();

    return NextResponse.json({ books, versions, version });
  } catch (error) {
    console.error('Bible books error:', error);
    return NextResponse.json({ error: 'Failed to get books' }, { status: 500 });
  }
}
