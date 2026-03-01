import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const group = db.prepare(`
      SELECT g.*,
        (SELECT u.name FROM users u WHERE u.id = g.leader_id) as leader_name,
        (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.left_at IS NULL) as member_count
      FROM groups g WHERE g.id = ?
    `).get(parseInt(id)) as any;
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const members = db.prepare(`
      SELECT gm.role, gm.joined_at, u.name, u.id as user_id, up.member_level
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE gm.group_id = ? AND gm.left_at IS NULL
      ORDER BY gm.joined_at ASC
    `).all(parseInt(id));

    return NextResponse.json({ group, members });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const db = getDb();
    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(parseInt(id)) as any;
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    // Only admin/pastor or group leader can delete
    if (!['admin', 'pastor'].includes(role) && group.leader_id !== userId) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    db.prepare('UPDATE group_members SET left_at = CURRENT_TIMESTAMP WHERE group_id = ?').run(parseInt(id));
    db.prepare('DELETE FROM groups WHERE id = ?').run(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}
