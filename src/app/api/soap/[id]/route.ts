import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;
    const { id } = await params;

    const entry = db.prepare('SELECT * FROM soap_entries WHERE id = ? AND user_id = ?').get(parseInt(id), userId);
    if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get entry' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;
    const { id } = await params;
    const { scripture, observation, application, prayer, privacy_level, verse_reference } = await req.json();

    const entry = db.prepare('SELECT id FROM soap_entries WHERE id = ? AND user_id = ?').get(parseInt(id), userId);
    if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });

    db.prepare(`
      UPDATE soap_entries SET
        scripture = COALESCE(?, scripture),
        observation = COALESCE(?, observation),
        application = COALESCE(?, application),
        prayer = COALESCE(?, prayer),
        privacy_level = COALESCE(?, privacy_level),
        verse_reference = COALESCE(?, verse_reference),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(scripture || null, observation || null, application || null, prayer || null, privacy_level || null, verse_reference || null, parseInt(id), userId);

    const updated = db.prepare('SELECT * FROM soap_entries WHERE id = ?').get(parseInt(id));
    return NextResponse.json({ entry: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;
    const { id } = await params;

    const result = db.prepare('DELETE FROM soap_entries WHERE id = ? AND user_id = ?').run(parseInt(id), userId);
    if (result.changes === 0) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
