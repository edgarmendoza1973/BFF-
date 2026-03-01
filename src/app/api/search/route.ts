import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results: any = {};

    if (type === 'all' || type === 'bible') {
      const version = searchParams.get('version') || 'ESV';
      const bibleResults = db.prepare(`
        SELECT bv.book_number, bv.chapter, bv.verse, bv.text,
               bb.name as book_name, 'bible' as result_type
        FROM bible_verses bv
        JOIN bible_books bb ON bv.book_number = bb.book_number AND bv.version_id = bb.version_id
        WHERE bv.version_id = ? AND bv.text LIKE ?
        LIMIT 5
      `).all(version, `%${q}%`);
      results.bible = bibleResults;
    }

    if (type === 'all' || type === 'events') {
      const events = db.prepare(`
        SELECT id, title, description, event_date, location, 'event' as result_type
        FROM events WHERE title LIKE ? OR description LIKE ?
        LIMIT 5
      `).all(`%${q}%`, `%${q}%`);
      results.events = events;
    }

    if (type === 'all' || type === 'groups') {
      const groups = db.prepare(`
        SELECT id, name, description, category, 'group' as result_type
        FROM groups WHERE name LIKE ? OR description LIKE ?
        LIMIT 5
      `).all(`%${q}%`, `%${q}%`);
      results.groups = groups;
    }

    if (type === 'all' || type === 'sermons') {
      const sermons = db.prepare(`
        SELECT id, title, speaker, bible_passage, 'sermon' as result_type
        FROM sermons WHERE title LIKE ? OR speaker LIKE ? OR bible_passage LIKE ?
        LIMIT 5
      `).all(`%${q}%`, `%${q}%`, `%${q}%`);
      results.sermons = sermons;
    }

    if (type === 'all' || type === 'journal') {
      const userId = (session.user as any).id;
      const journals = db.prepare(`
        SELECT id, scripture, verse_reference, created_at, 'journal' as result_type
        FROM soap_entries
        WHERE user_id = ? AND (scripture LIKE ? OR observation LIKE ?)
        LIMIT 5
      `).all(userId, `%${q}%`, `%${q}%`);
      results.journals = journals;
    }

    return NextResponse.json({ results, query: q });
  } catch (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
