import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { awardPoints } from '@/lib/points';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const db = getDb();
    const userId = (session.user as any).id;

    // ── Resolve token from request body ─────────────────────────────────────
    // Accept multiple field names for backwards compatibility:
    //   { token: "bff-event-{id}" }        ← new format
    //   { qr_data: "bff-event-{id}" }      ← old field name
    //   { qr_data: '{"eventId":1,...}' }   ← legacy JSON blob
    let token: string = body.token || body.qr_data || '';

    // If caller passed a JSON blob, extract / rebuild token
    if (token.startsWith('{')) {
      try {
        const parsed = JSON.parse(token);
        const parsedId = String(parsed.eventId || parsed.id || id);
        token = `bff-event-${parsedId}`;
      } catch {
        return NextResponse.json({ error: 'Malformed QR data' }, { status: 400 });
      }
    }

    if (!token) {
      return NextResponse.json({ error: 'No QR token provided' }, { status: 400 });
    }

    // ── Validate token format: must start with "bff-event-{id}" ────────────
    const expectedPrefix = `bff-event-${id}`;
    if (!token.startsWith(expectedPrefix)) {
      return NextResponse.json(
        { error: `Invalid QR code for this event (expected token for event ${id})` },
        { status: 400 }
      );
    }

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(parseInt(id)) as any;
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    // ── Check-in logic ───────────────────────────────────────────────────────
    const existing = db.prepare(
      'SELECT id, attended FROM event_attendees WHERE event_id = ? AND user_id = ?'
    ).get(parseInt(id), userId) as any;

    if (existing) {
      if (existing.attended) {
        return NextResponse.json({ success: true, message: 'Already checked in ✓', already: true });
      }
      db.prepare(
        'UPDATE event_attendees SET attended = 1, checked_in_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(existing.id);
    } else {
      db.prepare(`
        INSERT INTO event_attendees (event_id, user_id, response, attended, checked_in_at)
        VALUES (?, ?, 'yes', 1, CURRENT_TIMESTAMP)
      `).run(parseInt(id), userId);
    }

    // Award faith points for attendance
    await awardPoints(userId, 'event_attendance', { event_id: id });

    return NextResponse.json({
      success: true,
      message: `Checked in to "${event.title}"! 🎉`,
      already: false,
    });
  } catch (err) {
    console.error('[checkin]', err);
    return NextResponse.json({ error: 'Check-in failed' }, { status: 500 });
  }
}
