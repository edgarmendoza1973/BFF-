import { getDb } from './db';

export const badgeDefinitions = [
  { id: 1, name: 'Prayer Warrior', description: 'Prayed for 100 prayer requests', icon: '🙏', criteria: { prayers_prayed: 100 }, points_required: 0 },
  { id: 2, name: 'Faithful Journaler', description: 'Created 50 journal entries', icon: '📝', criteria: { journal_entries: 50 }, points_required: 0 },
  { id: 3, name: 'Event Enthusiast', description: 'Attended 25 events', icon: '🎉', criteria: { events_attended: 25 }, points_required: 0 },
  { id: 4, name: 'Soul Winner', description: 'Referred 5 friends who joined', icon: '🎯', criteria: { referrals: 5 }, points_required: 0 },
  { id: 5, name: 'Bible Scholar', description: 'Created 50 verse notes', icon: '📖', criteria: { verse_notes: 50 }, points_required: 0 },
  { id: 6, name: 'Group Builder', description: 'Joined 5 groups', icon: '👥', criteria: { groups_joined: 5 }, points_required: 0 },
  { id: 7, name: 'Faithful Giver', description: 'Donated 10 times', icon: '💰', criteria: { donations: 10 }, points_required: 0 },
  { id: 8, name: 'Sermon Listener', description: 'Listened to 50 sermons', icon: '🎧', criteria: { sermons_played: 50 }, points_required: 0 },
  { id: 9, name: 'First Steps', description: 'Completed onboarding', icon: '👣', criteria: { onboarding: 1 }, points_required: 0 },
  { id: 10, name: 'Community Member', description: 'Joined the BFF+ community', icon: '✝️', criteria: { registered: 1 }, points_required: 0 },
];

export function seedBadges() {
  const db = getDb();
  for (const badge of badgeDefinitions) {
    const existing = db.prepare('SELECT id FROM badges WHERE id = ?').get(badge.id);
    if (!existing) {
      db.prepare(`
        INSERT INTO badges (id, name, description, icon, criteria, points_required)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(badge.id, badge.name, badge.description, badge.icon, JSON.stringify(badge.criteria), badge.points_required);
    }
  }
}

// Alias for backward compatibility
export const checkAndAwardBadges = checkBadges;

export async function checkBadges(userId: string) {
  const db = getDb();

  const prayersCount = (db.prepare('SELECT COUNT(*) as c FROM prayer_interactions WHERE user_id = ? AND interaction_type = ?').get(userId, 'prayed') as any)?.c || 0;
  const journalCount = (db.prepare('SELECT COUNT(*) as c FROM soap_entries WHERE user_id = ?').get(userId) as any)?.c || 0;
  const eventsCount = (db.prepare('SELECT COUNT(*) as c FROM event_attendees WHERE user_id = ? AND attended = 1').get(userId) as any)?.c || 0;
  const verseNoteCount = (db.prepare('SELECT COUNT(*) as c FROM verse_notes WHERE user_id = ?').get(userId) as any)?.c || 0;
  const groupsCount = (db.prepare('SELECT COUNT(*) as c FROM group_members WHERE user_id = ?').get(userId) as any)?.c || 0;
  const donationsCount = (db.prepare('SELECT COUNT(*) as c FROM donations WHERE user_id = ? AND status = ?').get(userId, 'completed') as any)?.c || 0;
  const sermonsCount = (db.prepare("SELECT COUNT(*) as c FROM user_progress WHERE user_id = ? AND action_type = 'sermon_played'").get(userId) as any)?.c || 0;
  const referralsCount = (db.prepare("SELECT COUNT(*) as c FROM user_progress WHERE user_id = ? AND action_type = 'referral'").get(userId) as any)?.c || 0;

  const stats: Record<string, number> = {
    prayers_prayed: prayersCount,
    journal_entries: journalCount,
    events_attended: eventsCount,
    referrals: referralsCount,
    verse_notes: verseNoteCount,
    groups_joined: groupsCount,
    donations: donationsCount,
    sermons_played: sermonsCount,
  };

  const thresholds: Record<string, number> = {
    prayers_prayed: 100,
    journal_entries: 50,
    events_attended: 25,
    referrals: 5,
    verse_notes: 50,
    groups_joined: 5,
    donations: 10,
    sermons_played: 50,
  };

  const badgeMap: Record<string, number> = {
    prayers_prayed: 1,
    journal_entries: 2,
    events_attended: 3,
    referrals: 4,
    verse_notes: 5,
    groups_joined: 6,
    donations: 7,
    sermons_played: 8,
  };

  for (const [key, threshold] of Object.entries(thresholds)) {
    if (stats[key] >= threshold) {
      const badgeId = badgeMap[key];
      const existing = db.prepare('SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?').get(userId, badgeId);
      if (!existing) {
        db.prepare('INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)').run(userId, badgeId);
        const badge = db.prepare('SELECT * FROM badges WHERE id = ?').get(badgeId) as any;
        if (badge) {
          db.prepare(`
            INSERT INTO notifications (user_id, type, title, body, data)
            VALUES (?, 'badge', ?, ?, ?)
          `).run(
            userId,
            `${badge.icon} Badge Earned!`,
            `You earned the "${badge.name}" badge!`,
            JSON.stringify({ type: 'badge', badge_id: badgeId })
          );
        }
      }
    }
  }
}
