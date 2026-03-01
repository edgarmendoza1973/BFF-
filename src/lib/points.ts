import { getDb } from './db';
import { checkLevelUp } from './progression';
import { checkBadges } from './badges';

export const pointActions: Record<string, any> = {
  daily_login: 5,
  journal_entry_private: 10,
  journal_entry_leader: 15,
  journal_entry_group: 20,
  journal_entry_community: 25,
  event_attendance: 25,
  prayer_prayed: 2,
  prayer_shared: 5,
  volunteer_hour: 50,
  referral: 100,
  bible_verse_note: 3,
  bible_bookmark: 1,
  comment_on_journal: 2,
  group_joined: 10,
  first_message: 5,
};

export async function awardPoints(userId: string, action: string, metadata?: any) {
  const db = getDb();
  const points = pointActions[action] || 0;
  if (points === 0) return;

  db.prepare(`
    INSERT INTO user_progress (user_id, action_type, points_earned, metadata)
    VALUES (?, ?, ?, ?)
  `).run(userId, action, points, JSON.stringify(metadata || {}));

  db.prepare(`
    UPDATE user_profiles SET faith_points = faith_points + ? WHERE user_id = ?
  `).run(points, userId);

  await checkLevelUp(userId);
  await checkBadges(userId);
}
