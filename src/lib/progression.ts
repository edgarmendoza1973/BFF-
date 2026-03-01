import { getDb } from './db';

export const levelRequirements: Record<string, any> = {
  new_member: { points: 0, events: 0, journals: 0 },
  member: { points: 100, events: 2, journals: 5 },
  volunteer: { points: 500, events: 10, journals: 20, volunteer_hours: 10 },
  assistant: { points: 1000, events: 25, journals: 50, volunteer_hours: 50, assisted_events: 5 },
  leader: { points: 2500, events: 50, journals: 100, volunteer_hours: 100, led_events: 10, group_size: 5 },
  pastor: { points: 10000, leaders_trained: 5, total_members: 50 },
};

const levelOrder = ['new_member', 'member', 'volunteer', 'assistant', 'leader', 'pastor'];

export async function getUserStats(userId: string) {
  const db = getDb();

  const profile = db.prepare('SELECT faith_points, member_level FROM user_profiles WHERE user_id = ?').get(userId) as any;
  const journalCount = (db.prepare('SELECT COUNT(*) as c FROM soap_entries WHERE user_id = ?').get(userId) as any)?.c || 0;
  const eventCount = (db.prepare('SELECT COUNT(*) as c FROM event_attendees WHERE user_id = ? AND attended = 1').get(userId) as any)?.c || 0;
  const volunteerHours = (db.prepare('SELECT COALESCE(SUM(hours_logged),0) as h FROM volunteer_signups WHERE user_id = ?').get(userId) as any)?.h || 0;

  return {
    points: profile?.faith_points || 0,
    level: profile?.member_level || 'new_member',
    journals: journalCount,
    events: eventCount,
    volunteer_hours: volunteerHours,
  };
}

export async function checkLevelUp(userId: string) {
  const db = getDb();
  const stats = await getUserStats(userId);
  const currentLevel = stats.level;
  const currentIndex = levelOrder.indexOf(currentLevel);

  if (currentIndex === levelOrder.length - 1) return; // already at top

  const nextLevel = levelOrder[currentIndex + 1];
  if (nextLevel === 'pastor') return; // pastor is manual

  const req = levelRequirements[nextLevel];
  const meetsRequirements =
    stats.points >= req.points &&
    stats.events >= (req.events || 0) &&
    stats.journals >= (req.journals || 0) &&
    stats.volunteer_hours >= (req.volunteer_hours || 0);

  if (meetsRequirements) {
    db.prepare('UPDATE user_profiles SET member_level = ? WHERE user_id = ?').run(nextLevel, userId);

    // Insert notification
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES (?, 'achievement', ?, ?, ?)
    `).run(
      userId,
      '🎉 Level Up!',
      `Congratulations! You've reached ${nextLevel.replace('_', ' ')} level!`,
      JSON.stringify({ type: 'level_up', level: nextLevel })
    );
  }
}
