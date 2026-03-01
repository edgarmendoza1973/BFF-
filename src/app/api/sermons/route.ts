import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const db = getDb();

    const sermons = db.prepare(`
      SELECT s.*, ss.title as series_title, ss.cover_image as series_cover
      FROM sermons s
      LEFT JOIN sermon_series ss ON s.series_id = ss.id
      ORDER BY s.date_preached DESC
    `).all();

    const series = db.prepare('SELECT * FROM sermon_series ORDER BY start_date DESC').all();

    return NextResponse.json({ sermons, series });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get sermons' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    if (!['pastor', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Only admins can add sermons' }, { status: 403 });
    }

    const db = getDb();
    const { series_id, title, speaker, bible_passage, audio_url, video_url, notes_pdf, date_preached, duration } = await req.json();

    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

    const result = db.prepare(`
      INSERT INTO sermons (series_id, title, speaker, bible_passage, audio_url, video_url, notes_pdf, date_preached, duration)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(series_id || null, title, speaker || '', bible_passage || '', audio_url || '', video_url || '', notes_pdf || '', date_preached || new Date().toISOString().split('T')[0], duration || 0);

    const sermon = db.prepare('SELECT * FROM sermons WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json({ sermon }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create sermon' }, { status: 500 });
  }
}
