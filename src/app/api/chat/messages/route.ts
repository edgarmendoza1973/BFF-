import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { checkBeforeMessage } from '@/lib/ruleOfFour';
import { awardPoints } from '@/lib/points';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const conversationId = parseInt(searchParams.get('conversationId') || '0');

    const participant = db.prepare(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL'
    ).get(conversationId, userId);
    if (!participant) return NextResponse.json({ error: 'Not a participant' }, { status: 403 });

    const messages = db.prepare(`
      SELECT * FROM messages WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(conversationId);

    // Mark messages as read
    db.prepare(`
      UPDATE messages SET read_at = CURRENT_TIMESTAMP
      WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL
    `).run(conversationId, userId);

    const escalation = db.prepare(
      'SELECT * FROM chat_escalations WHERE conversation_id = ? AND resolved_at IS NULL'
    ).get(conversationId) as any;

    return NextResponse.json({
      messages,
      escalated: !!escalation,
      escalation_reason: escalation?.reason,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;
    const { conversation_id, content, message_type = 'text' } = await req.json();

    if (!content?.trim()) return NextResponse.json({ error: 'Message content required' }, { status: 400 });

    const check = await checkBeforeMessage(conversation_id, userId);
    if (!check.allowed) {
      return NextResponse.json({ blocked: true, reason: check.reason }, { status: 403 });
    }

    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as any;

    const result = db.prepare(`
      INSERT INTO messages (conversation_id, sender_id, sender_name, content, message_type)
      VALUES (?, ?, ?, ?, ?)
    `).run(conversation_id, userId, user?.name || 'User', content.trim(), message_type);

    db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(conversation_id);

    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);
    await awardPoints(userId, 'first_message', { conversation_id });

    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
