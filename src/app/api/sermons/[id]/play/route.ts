import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { awardPoints } from '@/lib/points';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const { id } = await params;
    const db = getDb();

    // Increment play count
    db.prepare('UPDATE sermons SET play_count = play_count + 1 WHERE id = ?').run(id);

    // Award faith points if logged in
    if (session?.user) {
      const userId = (session.user as any).id;
      await awardPoints(userId, 'bible_bookmark', { action: 'sermon_played', sermon_id: id });
      // Track for badge
      db.prepare(`
        INSERT INTO user_progress (user_id, action_type, points_earned, metadata)
        VALUES (?, 'sermon_played', 0, ?)
      `).run(userId, JSON.stringify({ sermon_id: id }));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to track play' }, { status: 500 });
  }
}
