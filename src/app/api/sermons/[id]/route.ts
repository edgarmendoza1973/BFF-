import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb();
    const { id } = await params;
    db.prepare('UPDATE sermons SET play_count = play_count + 1 WHERE id = ?').run(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb();
    const { id } = await params;
    const sermon = db.prepare(`
      SELECT s.*, ss.title as series_title, ss.description as series_description
      FROM sermons s
      LEFT JOIN sermon_series ss ON s.series_id = ss.id
      WHERE s.id = ?
    `).get(parseInt(id));
    if (!sermon) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ sermon });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const { note } = await req.json();
    const db = getDb();
    const userId = (session.user as any).id;

    const existing = db.prepare(
      'SELECT id FROM sermon_notes WHERE user_id = ? AND sermon_id = ?'
    ).get(userId, parseInt(id));

    if (existing) {
      db.prepare('UPDATE sermon_notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND sermon_id = ?')
        .run(note, userId, parseInt(id));
    } else {
      db.prepare('INSERT INTO sermon_notes (user_id, sermon_id, content) VALUES (?, ?, ?)')
        .run(userId, parseInt(id), note);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 });
  }
}
