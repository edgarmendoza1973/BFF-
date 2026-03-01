import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;
    const { id } = await params;
    const conversationId = parseInt(id);

    const participant = db.prepare(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?'
    ).get(conversationId, userId);
    if (!participant) return NextResponse.json({ error: 'Not a participant' }, { status: 403 });

    const existing = db.prepare(
      'SELECT id FROM chat_escalations WHERE conversation_id = ? AND resolved_at IS NULL'
    ).get(conversationId);

    if (!existing) {
      db.prepare('INSERT INTO chat_escalations (conversation_id, reason) VALUES (?, ?)').run(conversationId, 'manual');
      db.prepare("UPDATE conversations SET status = 'escalated' WHERE id = ?").run(conversationId);

      const pastor = db.prepare("SELECT id FROM users WHERE role IN ('pastor', 'admin') LIMIT 1").get() as any;
      if (pastor) {
        const alreadyIn = db.prepare(
          'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?'
        ).get(conversationId, pastor.id);
        if (!alreadyIn) {
          db.prepare(
            "INSERT INTO conversation_participants (conversation_id, user_id, role) VALUES (?, ?, 'pastor_oversight')"
          ).run(conversationId, pastor.id);
        }
      }

      db.prepare(`
        INSERT INTO messages (conversation_id, sender_id, sender_name, content, message_type)
        VALUES (?, 'system', 'BFF+ Safety', '⚠️ This conversation has been escalated for pastoral oversight.', 'system')
      `).run(conversationId);
    }

    return NextResponse.json({ success: true, message: 'Conversation escalated' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to escalate' }, { status: 500 });
  }
}

// DELETE — resolve escalation (leader/pastor only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    if (!['leader', 'pastor', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    const { id } = await params;
    const conversationId = parseInt(id);
    const db = getDb();
    const resolvedBy = (session.user as any).id;

    db.prepare('UPDATE chat_escalations SET resolved_at = CURRENT_TIMESTAMP, resolved_by = ? WHERE conversation_id = ? AND resolved_at IS NULL')
      .run(resolvedBy, conversationId);
    db.prepare("UPDATE conversations SET status = 'active' WHERE id = ?").run(conversationId);

    db.prepare(`
      INSERT INTO messages (conversation_id, sender_id, sender_name, content, message_type)
      VALUES (?, 'system', 'BFF+ Safety', '✅ Escalation resolved. Conversation is now active.', 'system')
    `).run(conversationId);

    return NextResponse.json({ success: true, message: 'Escalation resolved' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to resolve escalation' }, { status: 500 });
  }
}
