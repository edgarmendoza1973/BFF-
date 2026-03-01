import { getDb } from './db';

export async function enforceRuleOfFour(conversationId: number): Promise<{ blocked: boolean; reason?: string }> {
  const db = getDb();

  const participants = db.prepare(`
    SELECT cp.user_id, cp.role, up.gender
    FROM conversation_participants cp
    LEFT JOIN user_profiles up ON cp.user_id = up.user_id
    WHERE cp.conversation_id = ? AND cp.left_at IS NULL
  `).all(conversationId) as any[];

  const conversation = db.prepare('SELECT conversation_type, status FROM conversations WHERE id = ?').get(conversationId) as any;

  if (!conversation || conversation.conversation_type !== 'one_on_one') {
    return { blocked: false };
  }

  const genders = participants.map((p: any) => p.gender).filter(Boolean);
  const uniqueGenders = [...new Set(genders)];

  // Only applies to opposite-gender conversations
  if (uniqueGenders.length < 2) {
    return { blocked: false };
  }

  // Count messages in the last 12 hours
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const recentMessages = (db.prepare(`
    SELECT COUNT(*) as count FROM messages
    WHERE conversation_id = ? AND created_at > ?
  `).get(conversationId, twelveHoursAgo) as any)?.count || 0;

  if (recentMessages >= 4) {
    // Check if already escalated
    const existingEscalation = db.prepare(`
      SELECT id FROM chat_escalations
      WHERE conversation_id = ? AND resolved_at IS NULL
    `).get(conversationId);

    if (!existingEscalation) {
      // Create escalation
      db.prepare(`
        INSERT INTO chat_escalations (conversation_id, reason)
        VALUES (?, 'rule_of_four')
      `).run(conversationId, 'rule_of_four');

      db.prepare(`
        UPDATE conversations SET status = 'escalated' WHERE id = ?
      `).run(conversationId);

      // Add a pastor/guardian to conversation
      const pastor = db.prepare(`
        SELECT u.id FROM users u
        WHERE u.role IN ('pastor', 'admin')
        LIMIT 1
      `).get() as any;

      if (pastor) {
        const alreadyIn = db.prepare(`
          SELECT id FROM conversation_participants
          WHERE conversation_id = ? AND user_id = ?
        `).get(conversationId, pastor.id);

        if (!alreadyIn) {
          db.prepare(`
            INSERT INTO conversation_participants (conversation_id, user_id, role)
            VALUES (?, ?, 'pastor_oversight')
          `).run(conversationId, pastor.id);
        }
      }

      // Insert system message
      db.prepare(`
        INSERT INTO messages (conversation_id, sender_id, sender_name, content, message_type)
        VALUES (?, 'system', 'BFF+ Safety', ?, 'system')
      `).run(
        conversationId,
        '⚠️ Rule of Four: A guardian has been added to this conversation for accountability. This is a safety measure for cross-gender conversations.'
      );
    }

    return {
      blocked: true,
      reason: 'rule_of_four',
    };
  }

  return { blocked: false };
}

export async function checkBeforeMessage(conversationId: number, senderId: string): Promise<{ allowed: boolean; reason?: string }> {
  const db = getDb();

  const conversation = db.prepare('SELECT status FROM conversations WHERE id = ?').get(conversationId) as any;
  if (!conversation) return { allowed: false, reason: 'Conversation not found' };
  if (conversation.status === 'archived') return { allowed: false, reason: 'This conversation has been archived' };

  const participant = db.prepare(`
    SELECT id FROM conversation_participants
    WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL
  `).get(conversationId, senderId);

  if (!participant) return { allowed: false, reason: 'You are not a participant in this conversation' };

  const rof = await enforceRuleOfFour(conversationId);
  if (rof.blocked) {
    return { allowed: false, reason: '⚠️ Rule of Four protection active. A pastor/guardian has been added for accountability.' };
  }

  return { allowed: true };
}
