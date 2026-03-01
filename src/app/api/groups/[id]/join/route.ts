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
    const groupId = parseInt(id);

    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId) as any;
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const memberCount = (db.prepare('SELECT COUNT(*) as c FROM group_members WHERE group_id = ?').get(groupId) as any)?.c || 0;
    if (group.max_members && memberCount >= group.max_members) {
      return NextResponse.json({ error: 'Group is full' }, { status: 409 });
    }

    const existing = db.prepare('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?').get(groupId, userId);
    if (existing) return NextResponse.json({ error: 'Already a member' }, { status: 409 });

    db.prepare("INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'member')").run(groupId, userId);
    await awardPoints(userId, 'group_joined', { group_id: groupId });

    return NextResponse.json({ success: true, message: 'Joined group' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to join group' }, { status: 500 });
  }
}
