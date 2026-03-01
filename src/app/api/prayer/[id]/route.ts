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
    const prayerId = parseInt(id);
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    if (action === 'prayed') {
      const existing = db.prepare(
        "SELECT id FROM prayer_interactions WHERE prayer_id = ? AND user_id = ? AND interaction_type = 'prayed'"
      ).get(prayerId, userId);

      if (!existing) {
        db.prepare(
          "INSERT INTO prayer_interactions (prayer_id, user_id, interaction_type) VALUES (?, ?, 'prayed')"
        ).run(prayerId, userId);
        db.prepare('UPDATE prayer_requests SET prayed_count = prayed_count + 1 WHERE id = ?').run(prayerId);
        await awardPoints(userId, 'prayer_prayed', { prayer_id: prayerId });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'answer') {
      const { answer_notes } = await req.json();
      db.prepare(`
        UPDATE prayer_requests SET is_answered = 1, answered_at = CURRENT_TIMESTAMP, answer_notes = ?
        WHERE id = ? AND user_id = ?
      `).run(answer_notes || '', prayerId, userId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;
    const { id } = await params;
    const prayerId = parseInt(id);
    const { title, description, is_private } = await req.json();

    db.prepare(`
      UPDATE prayer_requests SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        is_private = COALESCE(?, is_private)
      WHERE id = ? AND user_id = ?
    `).run(title || null, description || null, is_private !== undefined ? (is_private ? 1 : 0) : null, prayerId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update prayer' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;
    const { id } = await params;
    db.prepare('DELETE FROM prayer_requests WHERE id = ? AND user_id = ?').run(parseInt(id), userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete prayer' }, { status: 500 });
  }
}
