import { NextRequest, NextResponse } from 'next/server';
import { getDb, initializeDatabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    initializeDatabase();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const version = searchParams.get('version') || 'ESV';

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results = db.prepare(`
      SELECT bv.book_number, bv.chapter, bv.verse, bv.text,
             bb.name as book_name
      FROM bible_verses bv
      JOIN bible_books bb ON bv.book_number = bb.book_number AND bv.version_id = bb.version_id
      WHERE bv.version_id = ? AND bv.text LIKE ?
      LIMIT 30
    `).all(version, `%${q}%`);

    return NextResponse.json({ results, query: q, version });
  } catch (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
