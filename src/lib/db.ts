import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'bff.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initializeDatabase() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      name TEXT,
      password_hash TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY,
      display_name TEXT,
      phone TEXT,
      profile_pic TEXT,
      avatar_url TEXT,
      bio TEXT,
      member_level TEXT DEFAULT 'new_member',
      faith_points INTEGER DEFAULT 0,
      gender TEXT,
      preferred_leader_gender TEXT,
      language TEXT DEFAULT 'en',
      default_bible_version TEXT DEFAULT 'ESV',
      notification_preferences TEXT DEFAULT '{"events":true,"chat":true,"group":true,"journal":true}',
      onboarding_completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      action_type TEXT,
      points_earned INTEGER,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      description TEXT,
      icon TEXT,
      criteria TEXT,
      points_required INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      badge_id INTEGER,
      earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(badge_id) REFERENCES badges(id)
    );

    CREATE TABLE IF NOT EXISTS survey_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      spiritual_maturity TEXT,
      faith_goals TEXT,
      church_background TEXT,
      language TEXT,
      gender_preference TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS leaders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE,
      name TEXT,
      gender TEXT,
      languages TEXT DEFAULT '["en"]',
      bio TEXT,
      available INTEGER DEFAULT 1,
      max_conversations INTEGER DEFAULT 5,
      current_conversations INTEGER DEFAULT 0,
      pastor_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_type TEXT DEFAULT 'one_on_one',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conversation_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER,
      user_id TEXT,
      role TEXT DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      left_at DATETIME,
      FOREIGN KEY(conversation_id) REFERENCES conversations(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER,
      sender_id TEXT,
      sender_name TEXT,
      content TEXT,
      message_type TEXT DEFAULT 'text',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME,
      FOREIGN KEY(conversation_id) REFERENCES conversations(id),
      FOREIGN KEY(sender_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS chat_escalations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER,
      reason TEXT,
      escalated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      resolved_by TEXT,
      FOREIGN KEY(conversation_id) REFERENCES conversations(id)
    );

    CREATE TABLE IF NOT EXISTS compass_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER,
      leader_id TEXT,
      biblical_truth INTEGER DEFAULT 0,
      christ_centered INTEGER DEFAULT 0,
      gospel_shaped INTEGER DEFAULT 0,
      rated_by TEXT,
      rated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(message_id) REFERENCES messages(id),
      FOREIGN KEY(leader_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS bible_versions (
      id TEXT PRIMARY KEY,
      name TEXT,
      language TEXT,
      copyright TEXT
    );

    CREATE TABLE IF NOT EXISTS bible_books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_id TEXT,
      book_number INTEGER,
      name TEXT,
      testament TEXT,
      chapters INTEGER,
      FOREIGN KEY(version_id) REFERENCES bible_versions(id)
    );

    CREATE TABLE IF NOT EXISTS bible_verses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_id TEXT,
      book_number INTEGER,
      chapter INTEGER,
      verse INTEGER,
      text TEXT,
      FOREIGN KEY(version_id) REFERENCES bible_versions(id)
    );

    CREATE TABLE IF NOT EXISTS verse_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      version_id TEXT,
      book_number INTEGER,
      chapter INTEGER,
      verse INTEGER,
      note_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      version_id TEXT,
      book_number INTEGER,
      chapter INTEGER,
      verse INTEGER,
      tags TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS bible_preferences (
      user_id TEXT PRIMARY KEY,
      last_version TEXT DEFAULT 'ESV',
      last_book INTEGER DEFAULT 1,
      last_chapter INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      leader_id TEXT,
      category TEXT DEFAULT 'bible-study',
      description TEXT,
      cover_photo TEXT,
      max_members INTEGER DEFAULT 50,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(leader_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS soap_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      scripture TEXT,
      observation TEXT,
      application TEXT,
      prayer TEXT,
      privacy_level TEXT DEFAULT 'private',
      verse_reference TEXT,
      shared_with_group_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(shared_with_group_id) REFERENCES groups(id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      event_date DATETIME,
      location TEXT,
      video_link TEXT,
      audience_type TEXT DEFAULT 'public',
      group_id INTEGER,
      qr_code TEXT UNIQUE,
      created_by TEXT,
      rsvp_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(group_id) REFERENCES groups(id)
    );

    CREATE TABLE IF NOT EXISTS event_attendees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER,
      user_id TEXT,
      response TEXT DEFAULT 'yes',
      attended INTEGER DEFAULT 0,
      checked_in_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(event_id) REFERENCES events(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS group_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER,
      user_id TEXT,
      role TEXT DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(group_id) REFERENCES groups(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sermon_series (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      cover_image TEXT,
      start_date DATE,
      end_date DATE,
      speaker TEXT
    );

    CREATE TABLE IF NOT EXISTS sermons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      series_id INTEGER,
      title TEXT,
      speaker TEXT,
      bible_passage TEXT,
      audio_url TEXT,
      video_url TEXT,
      notes_pdf TEXT,
      date_preached DATE,
      duration INTEGER DEFAULT 0,
      download_count INTEGER DEFAULT 0,
      play_count INTEGER DEFAULT 0,
      FOREIGN KEY(series_id) REFERENCES sermon_series(id)
    );

    CREATE TABLE IF NOT EXISTS sermon_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      sermon_id INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,
      FOREIGN KEY(sermon_id) REFERENCES sermons(id)
    );

    CREATE TABLE IF NOT EXISTS donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      amount REAL,
      currency TEXT DEFAULT 'USD',
      frequency TEXT DEFAULT 'one_time',
      payment_method TEXT,
      payment_intent_id TEXT,
      status TEXT DEFAULT 'pending',
      is_anonymous INTEGER DEFAULT 0,
      receipt_sent INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS donor_wall (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      donation_id INTEGER,
      display_name TEXT,
      amount REAL,
      message TEXT,
      approved INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(donation_id) REFERENCES donations(id)
    );

    CREATE TABLE IF NOT EXISTS prayer_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      title TEXT,
      description TEXT,
      is_private INTEGER DEFAULT 0,
      is_answered INTEGER DEFAULT 0,
      answered_at DATETIME,
      answer_notes TEXT,
      prayed_count INTEGER DEFAULT 0,
      shared_with_group_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(shared_with_group_id) REFERENCES groups(id)
    );

    CREATE TABLE IF NOT EXISTS prayer_interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prayer_id INTEGER,
      user_id TEXT,
      interaction_type TEXT DEFAULT 'prayed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(prayer_id) REFERENCES prayer_requests(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ministries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      category TEXT,
      description TEXT,
      leader_id TEXT,
      requires_training INTEGER DEFAULT 0,
      requires_background_check INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS volunteer_opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ministry_id INTEGER,
      title TEXT,
      description TEXT,
      event_date DATETIME,
      start_time TEXT,
      end_time TEXT,
      slots_total INTEGER DEFAULT 10,
      slots_filled INTEGER DEFAULT 0,
      location TEXT,
      FOREIGN KEY(ministry_id) REFERENCES ministries(id)
    );

    CREATE TABLE IF NOT EXISTS volunteer_signups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opportunity_id INTEGER,
      user_id TEXT,
      checked_in INTEGER DEFAULT 0,
      hours_logged REAL DEFAULT 0,
      signed_up_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(opportunity_id) REFERENCES volunteer_opportunities(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reading_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      duration_days INTEGER DEFAULT 30,
      is_premade INTEGER DEFAULT 0,
      created_by TEXT
    );

    CREATE TABLE IF NOT EXISTS plan_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER,
      day_number INTEGER,
      passages TEXT DEFAULT '[]',
      FOREIGN KEY(plan_id) REFERENCES reading_plans(id)
    );

    CREATE TABLE IF NOT EXISTS user_reading_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      plan_id INTEGER,
      current_day INTEGER DEFAULT 1,
      completed_days TEXT DEFAULT '[]',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_read_at DATETIME,
      streak INTEGER DEFAULT 0,
      FOREIGN KEY(plan_id) REFERENCES reading_plans(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notification_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      device_token TEXT UNIQUE,
      platform TEXT DEFAULT 'web',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      type TEXT,
      title TEXT,
      body TEXT,
      data TEXT DEFAULT '{}',
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  return database;
}

export default getDb;
