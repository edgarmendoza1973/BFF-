import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb, initializeDatabase } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    initializeDatabase();
    const db = getDb();
    const body = await req.json();
    const { email, name, password } = body;

    if (!email || !name || !password) {
      return NextResponse.json({ error: 'Email, name, and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 12);

    db.prepare(`
      INSERT INTO users (id, email, name, password_hash, role)
      VALUES (?, ?, ?, ?, 'user')
    `).run(id, email.toLowerCase(), name.trim(), passwordHash);

    db.prepare(`
      INSERT INTO user_profiles (user_id, display_name, member_level, faith_points, language, default_bible_version, onboarding_completed)
      VALUES (?, ?, 'new_member', 0, 'en', 'ESV', 0)
    `).run(id, name.trim());

    db.prepare(`
      INSERT INTO bible_preferences (user_id, last_version, last_book, last_chapter)
      VALUES (?, 'ESV', 1, 1)
    `).run(id);

    // Award "Community Member" badge
    db.prepare('INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, 10)').run(id);

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      userId: id,
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
