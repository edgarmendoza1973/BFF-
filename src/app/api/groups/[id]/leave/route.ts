import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const db = getDb();
    const userId = (session.user as any).id;

    const member = db.prepare(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ? AND left_at IS NULL'
    ).get(parseInt(id), userId);

    if (!member) return NextResponse.json({ error: 'Not a member of this group' }, { status: 400 });

    db.prepare('UPDATE group_members SET left_at = CURRENT_TIMESTAMP WHERE group_id = ? AND user_id = ?')
      .run(parseInt(id), userId);

    return NextResponse.json({ success: true, message: 'Left group' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to leave group' }, { status: 500 });
  }
}
