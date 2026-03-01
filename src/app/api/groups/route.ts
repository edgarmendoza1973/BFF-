import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { awardPoints } from '@/lib/points';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const userId_param = searchParams.get('user_id');

    let query = `
      SELECT g.*,
        (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.left_at IS NULL) as member_count,
        (SELECT u.name FROM users u WHERE u.id = g.leader_id) as leader_name
      FROM groups g
    `;
    const conditions: string[] = ['g.is_public = 1'];
    if (category) conditions.push(`g.category = '${category.replace(/'/g, "''")}'`);
    if (conditions.length) query += ` WHERE ${conditions.join(' AND ')}`;
    query += ' ORDER BY member_count DESC';

    const groups = db.prepare(query).all();
    return NextResponse.json({ groups });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;

    const {
      name, description, category = 'general',
      is_public = true, max_members = 50,
    } = await req.json();

    if (!name) return NextResponse.json({ error: 'Group name is required' }, { status: 400 });

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO groups (name, description, category, leader_id, is_public, max_members)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, description || '', category, userId, is_public ? 1 : 0, max_members);

    const groupId = result.lastInsertRowid;

    // Auto-join creator as member + leader
    db.prepare('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)').run(groupId, userId, 'leader');

    await awardPoints(userId, 'group_joined', { group_id: groupId, role: 'leader' });

    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId);
    return NextResponse.json({ success: true, group }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create group' }, { status: 500 });
  }
}
