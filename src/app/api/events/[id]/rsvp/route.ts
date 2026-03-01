import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { awardPoints } from '@/lib/points';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;
    const { id } = await params;
    const eventId = parseInt(id);
    const { response = 'yes' } = await req.json();

    const event = db.prepare('SELECT id FROM events WHERE id = ?').get(eventId);
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const existing = db.prepare('SELECT id, response FROM event_attendees WHERE event_id = ? AND user_id = ?').get(eventId, userId) as any;

    if (existing) {
      if (existing.response === response) {
        db.prepare('DELETE FROM event_attendees WHERE id = ?').run(existing.id);
        db.prepare('UPDATE events SET rsvp_count = MAX(0, rsvp_count - 1) WHERE id = ?').run(eventId);
        return NextResponse.json({ success: true, action: 'cancelled' });
      }
      db.prepare('UPDATE event_attendees SET response = ? WHERE id = ?').run(response, existing.id);
      return NextResponse.json({ success: true, action: 'updated', response });
    }

    db.prepare(
      'INSERT INTO event_attendees (event_id, user_id, response) VALUES (?, ?, ?)'
    ).run(eventId, userId, response);

    if (response === 'yes') {
      db.prepare('UPDATE events SET rsvp_count = rsvp_count + 1 WHERE id = ?').run(eventId);
    }

    return NextResponse.json({ success: true, action: 'added', response });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to RSVP' }, { status: 500 });
  }
}
