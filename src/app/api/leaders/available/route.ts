import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const leaders = db.prepare(`
      SELECT l.*, u.name, u.email, up.profile_pic, up.bio as profile_bio
      FROM leaders l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN user_profiles up ON l.user_id = up.user_id
      WHERE l.available = 1 AND l.current_conversations < l.max_conversations
      ORDER BY l.current_conversations ASC
    `).all();
    return NextResponse.json({ leaders });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get leaders' }, { status: 500 });
  }
}
