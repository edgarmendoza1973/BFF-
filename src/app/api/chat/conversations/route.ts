import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;

    const conversations = db.prepare(`
      SELECT c.*,
        (SELECT m.content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
        (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.read_at IS NULL AND m.sender_id != ?) as unread_count
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE cp.user_id = ? AND cp.left_at IS NULL
      ORDER BY last_message_time DESC NULLS LAST, c.created_at DESC
    `).all(userId, userId);

    const result = conversations.map((conv: any) => {
      const participants = db.prepare(`
        SELECT cp.user_id, cp.role, u.name, up.profile_pic
        FROM conversation_participants cp
        JOIN users u ON cp.user_id = u.id
        LEFT JOIN user_profiles up ON cp.user_id = up.user_id
        WHERE cp.conversation_id = ? AND cp.left_at IS NULL
      `).all(conv.id);
      return { ...conv, participants };
    });

    return NextResponse.json({ conversations: result });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get conversations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;
    const { participant_ids = [], conversation_type = 'one_on_one' } = await req.json();

    const allParticipants = [...new Set([userId, ...participant_ids])];

    const result = db.prepare(`
      INSERT INTO conversations (conversation_type) VALUES (?)
    `).run(conversation_type);
    const convId = result.lastInsertRowid;

    const userRecord = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
    for (const pid of allParticipants) {
      const pRecord = db.prepare('SELECT role FROM users WHERE id = ?').get(pid) as any;
      const role = pid === userId ? (userRecord?.role === 'leader' ? 'leader' : 'seeker') : (pRecord?.role === 'leader' ? 'leader' : 'member');
      db.prepare('INSERT INTO conversation_participants (conversation_id, user_id, role) VALUES (?, ?, ?)').run(convId, pid, role);
    }

    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(convId);
    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
