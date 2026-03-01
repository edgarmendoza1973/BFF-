import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { awardPoints } from '@/lib/points';
import { checkAndAwardBadges } from '@/lib/badges';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();
  const { spiritualMaturity, faithGoals, churchBackground, language, genderPreference } = body;

  const db = getDb();

  // Check if already completed
  const existing = db.prepare('SELECT id FROM survey_responses WHERE user_id = ?').get(userId);
  if (existing) {
    return NextResponse.json({ message: 'Survey already completed' });
  }

  db.prepare(`
    INSERT INTO survey_responses (user_id, spiritual_maturity, faith_goals, church_background, language, gender_preference)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, spiritualMaturity, faithGoals, churchBackground, language || 'en', genderPreference || null);

  // Update profile with language/gender pref + mark onboarding complete
  db.prepare(`
    UPDATE user_profiles 
    SET language = ?, preferred_leader_gender = ?, onboarding_completed = 1
    WHERE user_id = ?
  `).run(language || 'en', genderPreference || null, userId);

  // Also update users table so JWT session picks it up on next sign-in
  // (The onboarding_completed flag is read from user_profiles in the auth callback)
  // Award First Steps badge immediately
  const firstStepsBadge = db.prepare('SELECT id FROM user_badges WHERE user_id = ? AND badge_id = 9').get(userId);
  if (!firstStepsBadge) {
    db.prepare('INSERT INTO user_badges (user_id, badge_id) VALUES (?, 9)').run(userId);
    db.prepare(`INSERT INTO notifications (user_id, type, title, body, data) VALUES (?, 'badge', ?, ?, ?)`)
      .run(userId, '👣 Badge Earned!', 'You earned the "First Steps" badge for completing onboarding!',
        JSON.stringify({ type: 'badge', badge_id: 9 }));
  }

  // Award points for completing onboarding (use registered action key)
  await awardPoints(userId, 'daily_login', { source: 'onboarding' });
  await checkAndAwardBadges(userId);

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const db = getDb();
  const survey = db.prepare('SELECT * FROM survey_responses WHERE user_id = ?').get(userId);

  return NextResponse.json({ survey });
}
