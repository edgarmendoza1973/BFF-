import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const userId = (session.user as any).id;

    const profile = db.prepare(`
      SELECT u.id, u.email, u.name, u.role, u.created_at,
             up.display_name, up.phone, up.profile_pic, up.bio,
             up.member_level, up.faith_points, up.gender,
             up.preferred_leader_gender, up.language, up.default_bible_version,
             up.notification_preferences, up.onboarding_completed,
             up.avatar_url
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = ?
    `).get(userId) as any;

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Fetch badges
    const badges = db.prepare(`
      SELECT b.id, b.name, b.description, b.icon, b.criteria, ub.earned_at
      FROM user_badges ub
      JOIN badges b ON ub.badge_id = b.id
      WHERE ub.user_id = ?
      ORDER BY ub.earned_at DESC
    `).all(userId);

    return NextResponse.json({ profile, badges });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}

// Shared update logic used by both PUT and PATCH
async function handleUpdate(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const userId = (session.user as any).id;
  const body = await req.json();

  const {
    display_name, displayName, phone, bio, gender, preferred_leader_gender,
    language, default_bible_version, defaultBibleVersion,
    notification_preferences, profile_pic, avatarUrl,
  } = body;

  // Normalise camelCase aliases to snake_case
  const resolvedDisplayName  = display_name  ?? displayName  ?? null;
  const resolvedBibleVersion = default_bible_version ?? defaultBibleVersion ?? null;
  const resolvedAvatarUrl    = profile_pic ?? avatarUrl ?? null;

  db.prepare(`
    UPDATE user_profiles SET
      display_name             = COALESCE(?, display_name),
      phone                    = COALESCE(?, phone),
      bio                      = COALESCE(?, bio),
      gender                   = COALESCE(?, gender),
      preferred_leader_gender  = COALESCE(?, preferred_leader_gender),
      language                 = COALESCE(?, language),
      default_bible_version    = COALESCE(?, default_bible_version),
      notification_preferences = COALESCE(?, notification_preferences),
      profile_pic              = COALESCE(?, profile_pic),
      avatar_url               = COALESCE(?, avatar_url)
    WHERE user_id = ?
  `).run(
    resolvedDisplayName,
    phone              ?? null,
    bio                ?? null,
    gender             ?? null,
    preferred_leader_gender ?? null,
    language           ?? null,
    resolvedBibleVersion,
    notification_preferences ? JSON.stringify(notification_preferences) : null,
    resolvedAvatarUrl,
    resolvedAvatarUrl,   // also update avatar_url
    userId
  );

  if (body.name) {
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(body.name, userId);
  }

  return NextResponse.json({ success: true, message: 'Profile updated' });
}

export async function PUT(req: NextRequest) {
  try {
    return await handleUpdate(req);
  } catch (error) {
    console.error('Update profile error (PUT):', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    return await handleUpdate(req);
  } catch (error) {
    console.error('Update profile error (PATCH):', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
