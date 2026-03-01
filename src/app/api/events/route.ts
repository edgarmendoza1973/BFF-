import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const upcoming = searchParams.get('upcoming');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = `
      SELECT e.*,
        (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.response = 'yes') as rsvp_count
      FROM events e
    `;
    if (upcoming === 'true') {
      query += ` WHERE e.event_date >= datetime('now') ORDER BY e.event_date ASC LIMIT ${limit}`;
    } else {
      query += ` ORDER BY e.event_date DESC LIMIT ${limit}`;
    }

    const events = db.prepare(query).all();
    return NextResponse.json({ events });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    if (!['admin', 'pastor', 'leader'].includes(role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const {
      title, description, event_date, location,
      audience_type = 'all', max_attendees,
    } = await req.json();

    if (!title || !event_date) {
      return NextResponse.json({ error: 'Title and date are required' }, { status: 400 });
    }

    const db = getDb();
    const createdBy = (session.user as any).id;
    const result = db.prepare(`
      INSERT INTO events (title, description, event_date, location, audience_type, max_attendees, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title, description || '', event_date, location || '', audience_type, max_attendees || null, createdBy);

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
