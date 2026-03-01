import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

// GET /api/compass?leader_id=xxx  — get average metrics for a leader
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const leaderId = searchParams.get('leader_id');

  const db = getDb();

  if (leaderId) {
    const metrics = db.prepare(`
      SELECT 
        AVG(biblical_truth) as avg_biblical_truth,
        AVG(christ_centered) as avg_christ_centered,
        AVG(gospel_shaped) as avg_gospel_shaped,
        COUNT(*) as total_ratings
      FROM compass_metrics
      WHERE leader_id = ?
    `).get(leaderId) as any;

    const recent = db.prepare(`
      SELECT cm.*, m.content as message_content, m.created_at as message_date
      FROM compass_metrics cm
      JOIN messages m ON cm.message_id = m.id
      WHERE cm.leader_id = ?
      ORDER BY cm.rated_at DESC
      LIMIT 10
    `).all(leaderId);

    return NextResponse.json({ metrics, recent });
  }

  // Admins/pastors can see all leaders
  const role = (session.user as any).role;
  if (!['admin', 'pastor'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const allMetrics = db.prepare(`
    SELECT 
      cm.leader_id,
      u.name as leader_name,
      AVG(cm.biblical_truth) as avg_biblical_truth,
      AVG(cm.christ_centered) as avg_christ_centered,
      AVG(cm.gospel_shaped) as avg_gospel_shaped,
      COUNT(*) as total_ratings
    FROM compass_metrics cm
    JOIN users u ON cm.leader_id = u.id
    GROUP BY cm.leader_id
    ORDER BY total_ratings DESC
  `).all();

  return NextResponse.json({ metrics: allMetrics });
}

// POST /api/compass — rate a message
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (!['admin', 'pastor'].includes(role)) {
    return NextResponse.json({ error: 'Only pastors/admins can rate messages' }, { status: 403 });
  }

  const body = await req.json();
  const { messageId, leaderId, biblicalTruth, christCentered, gospelShaped } = body;

  if (!messageId || !leaderId) {
    return NextResponse.json({ error: 'messageId and leaderId required' }, { status: 400 });
  }

  const db = getDb();
  const ratedBy = (session.user as any).id;

  // Check if already rated by this person
  const existing = db.prepare('SELECT id FROM compass_metrics WHERE message_id = ? AND rated_by = ?').get(messageId, ratedBy);

  if (existing) {
    db.prepare(`
      UPDATE compass_metrics SET biblical_truth = ?, christ_centered = ?, gospel_shaped = ?, rated_at = CURRENT_TIMESTAMP
      WHERE message_id = ? AND rated_by = ?
    `).run(biblicalTruth || 0, christCentered || 0, gospelShaped || 0, messageId, ratedBy);
  } else {
    db.prepare(`
      INSERT INTO compass_metrics (message_id, leader_id, biblical_truth, christ_centered, gospel_shaped, rated_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(messageId, leaderId, biblicalTruth || 0, christCentered || 0, gospelShaped || 0, ratedBy);
  }

  return NextResponse.json({ success: true });
}
