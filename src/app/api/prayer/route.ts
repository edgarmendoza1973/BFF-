import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { awardPoints } from '@/lib/points';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'my';

    if (type === 'community') {
      const prayers = db.prepare(`
        SELECT pr.*, u.name as user_name, up.profile_pic as user_pic,
               (SELECT COUNT(*) FROM prayer_interactions WHERE prayer_id = pr.id AND interaction_type = 'prayed') as prayed_count
        FROM prayer_requests pr
        JOIN users u ON pr.user_id = u.id
        LEFT JOIN user_profiles up ON pr.user_id = up.user_id
        WHERE pr.is_private = 0
        ORDER BY pr.created_at DESC
        LIMIT 50
      `).all();
      return NextResponse.json({ prayers });
    }

    const prayers = db.prepare(`
      SELECT * FROM prayer_requests WHERE user_id = ? ORDER BY created_at DESC
    `).all(userId);
    return NextResponse.json({ prayers });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get prayers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;
    const { title, description, is_private = false } = await req.json();

    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

    const result = db.prepare(`
      INSERT INTO prayer_requests (user_id, title, description, is_private)
      VALUES (?, ?, ?, ?)
    `).run(userId, title, description || '', is_private ? 1 : 0);

    const prayer = db.prepare('SELECT * FROM prayer_requests WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json({ prayer }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create prayer' }, { status: 500 });
  }
}
