/**
 * BFF+ Church App — Database Seed Script
 * Run: npx ts-node scripts/seed.ts
 */

import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'bff.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─────────────────────────────────────────────
// SCHEMA
// ─────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
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
    user_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    points_earned INTEGER DEFAULT 0,
    metadata TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    criteria TEXT,
    points_required INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS user_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    badge_id INTEGER NOT NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(badge_id) REFERENCES badges(id)
  );

  CREATE TABLE IF NOT EXISTS survey_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    spiritual_maturity TEXT,
    faith_goals TEXT,
    church_background TEXT,
    language TEXT DEFAULT 'en',
    gender_preference TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS leaders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    gender TEXT NOT NULL,
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
    conversation_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    left_at DATETIME,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    sender_id TEXT NOT NULL,
    sender_name TEXT,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id),
    FOREIGN KEY(sender_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS chat_escalations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    reason TEXT,
    escalated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    resolved_by TEXT,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id)
  );

  CREATE TABLE IF NOT EXISTS compass_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    leader_id TEXT NOT NULL,
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
    name TEXT NOT NULL,
    language TEXT NOT NULL,
    copyright TEXT
  );

  CREATE TABLE IF NOT EXISTS bible_books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version_id TEXT NOT NULL,
    book_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    testament TEXT NOT NULL,
    chapters INTEGER NOT NULL,
    FOREIGN KEY(version_id) REFERENCES bible_versions(id)
  );

  CREATE TABLE IF NOT EXISTS bible_verses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version_id TEXT NOT NULL,
    book_number INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    text TEXT NOT NULL,
    FOREIGN KEY(version_id) REFERENCES bible_versions(id)
  );

  CREATE TABLE IF NOT EXISTS verse_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    version_id TEXT,
    book_number INTEGER,
    chapter INTEGER,
    verse INTEGER,
    note_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
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
    name TEXT NOT NULL,
    leader_id TEXT,
    category TEXT DEFAULT 'bible-study',
    description TEXT,
    cover_photo TEXT,
    max_members INTEGER DEFAULT 50,
    is_public INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(leader_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS group_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(group_id) REFERENCES groups(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS soap_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
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
    title TEXT NOT NULL,
    description TEXT,
    event_date DATETIME NOT NULL,
    location TEXT,
    video_link TEXT,
    audience_type TEXT DEFAULT 'public',
    group_id INTEGER,
    qr_code TEXT UNIQUE,
    created_by TEXT,
    rsvp_count INTEGER DEFAULT 0,
    cover_image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(group_id) REFERENCES groups(id),
    FOREIGN KEY(created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS event_attendees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    response TEXT DEFAULT 'yes',
    attended INTEGER DEFAULT 0,
    checked_in_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(event_id) REFERENCES events(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sermon_series (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    start_date DATE,
    end_date DATE,
    speaker TEXT
  );

  CREATE TABLE IF NOT EXISTS sermons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    series_id INTEGER,
    title TEXT NOT NULL,
    speaker TEXT,
    bible_passage TEXT,
    audio_url TEXT,
    video_url TEXT,
    notes_pdf TEXT,
    thumbnail TEXT,
    date_preached DATE,
    duration INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    play_count INTEGER DEFAULT 0,
    FOREIGN KEY(series_id) REFERENCES sermon_series(id)
  );

  CREATE TABLE IF NOT EXISTS sermon_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    sermon_id INTEGER NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY(sermon_id) REFERENCES sermons(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    frequency TEXT DEFAULT 'one_time',
    payment_method TEXT,
    payment_intent_id TEXT,
    status TEXT DEFAULT 'pending',
    is_anonymous INTEGER DEFAULT 0,
    receipt_sent INTEGER DEFAULT 0,
    fund_designation TEXT DEFAULT 'general',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS donor_wall (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    donation_id INTEGER NOT NULL,
    display_name TEXT,
    amount REAL,
    message TEXT,
    approved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(donation_id) REFERENCES donations(id)
  );

  CREATE TABLE IF NOT EXISTS prayer_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
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
    prayer_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    interaction_type TEXT DEFAULT 'prayed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(prayer_id) REFERENCES prayer_requests(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ministries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    leader_id TEXT,
    requires_training INTEGER DEFAULT 0,
    requires_background_check INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS volunteer_opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ministry_id INTEGER,
    title TEXT NOT NULL,
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
    opportunity_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    checked_in INTEGER DEFAULT 0,
    hours_logged REAL DEFAULT 0,
    signed_up_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(opportunity_id) REFERENCES volunteer_opportunities(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reading_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    duration_days INTEGER DEFAULT 30,
    is_premade INTEGER DEFAULT 1,
    created_by TEXT,
    cover_image TEXT
  );

  CREATE TABLE IF NOT EXISTS plan_days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    day_number INTEGER NOT NULL,
    passages TEXT DEFAULT '[]',
    devotional TEXT,
    FOREIGN KEY(plan_id) REFERENCES reading_plans(id)
  );

  CREATE TABLE IF NOT EXISTS user_reading_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    plan_id INTEGER NOT NULL,
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
    user_id TEXT NOT NULL,
    device_token TEXT UNIQUE NOT NULL,
    platform TEXT DEFAULT 'web',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    data TEXT DEFAULT '{}',
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_bible_verses_lookup ON bible_verses(version_id, book_number, chapter);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
  CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_prayer_user ON prayer_requests(user_id);
  CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
`);

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const run = db.transaction((fn: () => void) => fn());

function upsertUser(id: string, email: string, name: string, password: string, role: string) {
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(`INSERT OR IGNORE INTO users (id,email,name,password_hash,role) VALUES (?,?,?,?,?)`).run(id, email, name, hash, role);
  db.prepare(`INSERT OR IGNORE INTO user_profiles (user_id,display_name,member_level,faith_points,onboarding_completed) VALUES (?,?,?,?,?)`).run(id, name, role === 'admin' ? 'shepherd' : 'new_member', role === 'admin' ? 5000 : 0, 1);
}

// ─────────────────────────────────────────────
// SEED USERS
// ─────────────────────────────────────────────
run(() => {
  const adminId   = 'admin-001';
  const pastorId  = 'pastor-001';
  const leader1Id = 'leader-001';
  const leader2Id = 'leader-002';
  const user1Id   = 'user-001';
  const user2Id   = 'user-002';

  upsertUser(adminId,   'admin@bffplus.church',   'Admin User',   'Admin@1234', 'admin');
  upsertUser(pastorId,  'pastor@bffplus.church',  'Pastor James', 'Pastor@1234','pastor');
  upsertUser(leader1Id, 'sarah@bffplus.church',   'Sarah Chen',   'Leader@1234','leader');
  upsertUser(leader2Id, 'mark@bffplus.church',    'Mark Torres',  'Leader@1234','leader');
  upsertUser(user1Id,   'alice@bffplus.church',   'Alice Wong',   'User@1234',  'user');
  upsertUser(user2Id,   'bob@bffplus.church',     'Bob Martinez', 'User@1234',  'user');

  // Leaders
  db.prepare(`INSERT OR IGNORE INTO leaders (user_id,name,gender,languages,bio,available,pastor_id) VALUES (?,?,?,?,?,?,?)`).run(leader1Id,'Sarah Chen','female','["en","tl"]','Discipleship leader passionate about women\'s ministry.',1,pastorId);
  db.prepare(`INSERT OR IGNORE INTO leaders (user_id,name,gender,languages,bio,available,pastor_id) VALUES (?,?,?,?,?,?,?)`).run(leader2Id,'Mark Torres','male','["en","es"]','Men\'s ministry leader and small group facilitator.',1,pastorId);

  console.log('✅ Users seeded');
});

// ─────────────────────────────────────────────
// SEED BADGES
// ─────────────────────────────────────────────
run(() => {
  const badges = [
    { name: 'First Steps',    description: 'Completed onboarding survey', icon: '🚀', criteria: 'onboarding_complete', points_required: 0 },
    { name: 'Word Seeker',    description: 'Read 7 Bible chapters',       icon: '📖', criteria: 'bible_chapters_7',   points_required: 70 },
    { name: 'Prayer Warrior', description: 'Posted 10 prayer requests',   icon: '🙏', criteria: 'prayer_posts_10',    points_required: 100 },
    { name: 'Journal Keeper', description: 'Wrote 5 SOAP entries',        icon: '📓', criteria: 'soap_entries_5',     points_required: 75 },
    { name: 'Community Pillar',description:'Joined 3 groups',             icon: '🤝', criteria: 'groups_joined_3',    points_required: 150 },
    { name: 'Generous Heart', description: 'Made first donation',         icon: '💝', criteria: 'first_donation',     points_required: 0 },
    { name: 'Event Goer',     description: 'Attended 5 events',           icon: '🎉', criteria: 'events_attended_5',  points_required: 200 },
    { name: 'Streak Master',  description: 'Maintained 30-day reading streak',icon:'🔥',criteria:'reading_streak_30',points_required: 300 },
    { name: 'Discipler',      description: 'Completed first reading plan',icon: '🎓', criteria: 'reading_plan_done',  points_required: 250 },
    { name: 'Shepherd',       description: '1000 faith points earned',    icon: '⭐', criteria: 'faith_points_1000',  points_required: 1000 },
  ];
  const stmt = db.prepare(`INSERT OR IGNORE INTO badges (name,description,icon,criteria,points_required) VALUES (?,?,?,?,?)`);
  badges.forEach(b => stmt.run(b.name, b.description, b.icon, b.criteria, b.points_required));
  console.log('✅ Badges seeded');
});

// ─────────────────────────────────────────────
// SEED BIBLE VERSIONS
// ─────────────────────────────────────────────
run(() => {
  const versions = [
    { id: 'ESV',   name: 'English Standard Version',        language: 'en',  copyright: '© 2001 Crossway' },
    { id: 'NLT',   name: 'New Living Translation',          language: 'en',  copyright: '© 1996, 2004, 2015 Tyndale House' },
    { id: 'ASND',  name: 'Ang Salita ng Dios',              language: 'tl',  copyright: '© Philippine Bible Society' },
    { id: 'PINOY', name: 'Pinoy Contemporary Bible',        language: 'tl',  copyright: '© Philippine Bible Society 2010' },
  ];
  const stmt = db.prepare(`INSERT OR IGNORE INTO bible_versions (id,name,language,copyright) VALUES (?,?,?,?)`);
  versions.forEach(v => stmt.run(v.id, v.name, v.language, v.copyright));
  console.log('✅ Bible versions seeded');
});

// ─────────────────────────────────────────────
// SEED BIBLE BOOKS (Genesis only for demo; extend for full 66)
// ─────────────────────────────────────────────
run(() => {
  const otBooks = [
    ['Genesis', 50], ['Exodus', 40], ['Leviticus', 27], ['Numbers', 36], ['Deuteronomy', 34],
    ['Joshua', 24], ['Judges', 21], ['Ruth', 4], ['1 Samuel', 31], ['2 Samuel', 24],
    ['1 Kings', 22], ['2 Kings', 25], ['1 Chronicles', 29], ['2 Chronicles', 36],
    ['Ezra', 10], ['Nehemiah', 13], ['Esther', 10], ['Job', 42], ['Psalms', 150],
    ['Proverbs', 31], ['Ecclesiastes', 12], ['Song of Solomon', 8], ['Isaiah', 66],
    ['Jeremiah', 52], ['Lamentations', 5], ['Ezekiel', 48], ['Daniel', 12],
    ['Hosea', 14], ['Joel', 3], ['Amos', 9], ['Obadiah', 1], ['Jonah', 4],
    ['Micah', 7], ['Nahum', 3], ['Habakkuk', 3], ['Zephaniah', 3], ['Haggai', 2],
    ['Zechariah', 14], ['Malachi', 4],
  ];
  const ntBooks = [
    ['Matthew', 28], ['Mark', 16], ['Luke', 24], ['John', 21], ['Acts', 28],
    ['Romans', 16], ['1 Corinthians', 16], ['2 Corinthians', 13], ['Galatians', 6],
    ['Ephesians', 6], ['Philippians', 4], ['Colossians', 4], ['1 Thessalonians', 5],
    ['2 Thessalonians', 3], ['1 Timothy', 6], ['2 Timothy', 4], ['Titus', 3],
    ['Philemon', 1], ['Hebrews', 13], ['James', 5], ['1 Peter', 5], ['2 Peter', 3],
    ['1 John', 5], ['2 John', 1], ['3 John', 1], ['Jude', 1], ['Revelation', 22],
  ];
  const stmt = db.prepare(`INSERT OR IGNORE INTO bible_books (version_id,book_number,name,testament,chapters) VALUES (?,?,?,?,?)`);
  const versions = ['ESV', 'NLT', 'ASND', 'PINOY'];
  versions.forEach(v => {
    otBooks.forEach(([name, chapters], i) => stmt.run(v, i+1, name, 'OT', chapters));
    ntBooks.forEach(([name, chapters], i) => stmt.run(v, otBooks.length+i+1, name, 'NT', chapters));
  });
  console.log('✅ Bible books seeded (66 books × 4 versions)');
});

// ─────────────────────────────────────────────
// SEED GENESIS 1 VERSES — ESV
// ─────────────────────────────────────────────
const genesis1ESV = [
  "In the beginning, God created the heavens and the earth.",
  "The earth was without form and void, and darkness was over the face of the deep. And the Spirit of God was hovering over the face of the waters.",
  "And God said, \"Let there be light,\" and there was light.",
  "And God saw that the light was good. And God separated the light from the darkness.",
  "God called the light Day, and the darkness he called Night. And there was evening and there was morning, the first day.",
  "And God said, \"Let there be an expanse in the midst of the waters, and let it separate the waters from the waters.\"",
  "And God made the expanse and separated the waters that were under the expanse from the waters that were above the expanse. And it was so.",
  "And God called the expanse Heaven. And there was evening and there was morning, the second day.",
  "And God said, \"Let the waters under the heavens be gathered together into one place, and let the dry land appear.\" And it was so.",
  "God called the dry land Earth, and the waters that were gathered together he called Seas. And God saw that it was good.",
  "And God said, \"Let the earth sprout vegetation, plants yielding seed, and fruit trees bearing fruit in which is their seed, each according to its kind, on the earth.\" And it was so.",
  "The earth brought forth vegetation, plants yielding seed according to their own kinds, and trees bearing fruit in which is their seed, each according to its kind. And God saw that it was good.",
  "And there was evening and there was morning, the third day.",
  "And God said, \"Let there be lights in the expanse of the heavens to separate the day from the night. And let them be for signs and for seasons, and for days and years,\"",
  "\"and let them be lights in the expanse of the heavens to give light upon the earth.\" And it was so.",
  "And God made the two great lights—the greater light to rule the day and the lesser light to rule the night—and the stars.",
  "And God set them in the expanse of the heavens to give light on the earth,",
  "to rule over the day and over the night, and to separate the light from the darkness. And God saw that it was good.",
  "And there was evening and there was morning, the fourth day.",
  "And God said, \"Let the waters swarm with swarms of living creatures, and let birds fly above the earth across the expanse of the heavens.\"",
  "So God created the great sea creatures and every living creature that moves, with which the waters swarm, according to their kinds, and every winged bird according to its kind. And God saw that it was good.",
  "And God blessed them, saying, \"Be fruitful and multiply and fill the waters in the seas, and let birds multiply on the earth.\"",
  "And there was evening and there was morning, the fifth day.",
  "And God said, \"Let the earth bring forth living creatures according to their kinds—livestock and creeping things and beasts of the earth according to their kinds.\" And it was so.",
  "And God made the beasts of the earth according to their kinds and the livestock according to their kinds, and everything that creeps on the ground according to its kind. And God saw that it was good.",
  "Then God said, \"Let us make man in our image, after our likeness. And let them have dominion over the fish of the sea and over the birds of the heavens and over the livestock and over all the earth and over every creeping thing that creeps on the earth.\"",
  "So God created man in his own image, in the image of God he created him; male and female he created them.",
  "And God blessed them. And God said to them, \"Be fruitful and multiply and fill the earth and subdue it, and have dominion over the fish of the sea and over the birds of the heavens and over every living thing that moves on the earth.\"",
  "And God said, \"Behold, I have given you every plant yielding seed that is on the face of all the earth, and every tree with seed in its fruit. You shall have them for food.\"",
  "\"And to every beast of the earth and to every bird of the heavens and to everything that creeps on the earth, everything that has the breath of life, I have given every green plant for food.\" And it was so.",
  "And God saw everything that he had made, and behold, it was very good. And there was evening and there was morning, the sixth day.",
];

// ─────────────────────────────────────────────
// SEED GENESIS 1 VERSES — NLT
// ─────────────────────────────────────────────
const genesis1NLT = [
  "In the beginning God created the heavens and the earth.",
  "The earth was formless and empty, and darkness covered the deep waters. And the Spirit of God was hovering over the surface of the waters.",
  "Then God said, \"Let there be light,\" and there was light.",
  "And God saw that the light was good. Then he separated the light from the darkness.",
  "God called the light \"day\" and the darkness \"night.\" And evening passed and morning came, marking the first day.",
  "Then God said, \"Let there be a space between the waters, to separate the waters of the heavens from the waters of the earth.\"",
  "And that is what happened. God made this space to separate the waters of the earth from the waters of the heavens.",
  "God called the space \"sky.\" And evening passed and morning came, marking the second day.",
  "Then God said, \"Let the waters beneath the sky flow together into one place, so dry ground may appear.\" And that is what happened.",
  "God called the dry ground \"land\" and the waters \"seas.\" And God saw that it was good.",
  "Then God said, \"Let the land sprout with vegetation—every sort of seed-bearing plant, and trees that grow seed-bearing fruit. These seeds will then produce the kinds of plants and trees from which they came.\" And that is what happened.",
  "The land produced vegetation—all sorts of seed-bearing plants, and trees with seed-bearing fruit. Their seeds produced plants and trees of the same kind. And God saw that it was good.",
  "And evening passed and morning came, marking the third day.",
  "Then God said, \"Let lights appear in the sky to separate the day from the night. Let them be signs to mark the seasons, days, and years.\"",
  "Let these lights in the sky shine down on the earth.\" And that is what happened.",
  "God made two great lights—the larger one to govern the day, and the smaller one to govern the night. He also made the stars.",
  "God set these lights in the sky to light the earth,",
  "to govern the day and night, and to separate the light from the darkness. And God saw that it was good.",
  "And evening passed and morning came, marking the fourth day.",
  "Then God said, \"Let the waters swarm with fish and other life. Let the skies be filled with birds of every kind.\"",
  "So God created great sea creatures and every living thing that scurries and swarms in the water, and every sort of bird—each producing offspring of the same kind. And God saw that it was good.",
  "Then God blessed them, saying, \"Be fruitful and multiply. Let the fish fill the seas, and let the birds multiply on the earth.\"",
  "And evening passed and morning came, marking the fifth day.",
  "Then God said, \"Let the earth produce every sort of animal, each producing offspring of the same kind—livestock, small animals that scurry along the ground, and wild animals.\" And that is what happened.",
  "God made all sorts of wild animals, livestock, and small animals, each able to produce offspring of the same kind. And God saw that it was good.",
  "Then God said, \"Let us make human beings in our image, to be like us. They will reign over the fish in the sea, the birds in the sky, the livestock, all the wild animals on the earth, and the small animals that scurry along the ground.\"",
  "So God created human beings in his own image. In the image of God he created them; male and female he created them.",
  "Then God blessed them and said, \"Be fruitful and multiply. Fill the earth and govern it. Reign over the fish in the sea, the birds in the sky, and all the animals that scurry along the ground.\"",
  "Then God said, \"Look! I have given you every seed-bearing plant throughout the earth and all the fruit trees for your food.\"",
  "And I have given every green plant as food for all the wild animals, the birds in the sky, and the small animals that scurry along the ground—everything that has life.\" And that is what happened.",
  "Then God looked over all he had made, and he saw that it was very good! And evening passed and morning came, marking the sixth day.",
];

// ─────────────────────────────────────────────
// SEED GENESIS 1 VERSES — ASND (Tagalog)
// ─────────────────────────────────────────────
const genesis1ASND = [
  "Nang pasimula ay nilikha ng Diyos ang langit at ang lupa.",
  "Ang lupa ay walang hugis at walang laman; kadiliman ay sumasaklaw sa ibabaw ng kalaliman, at ang Espiritu ng Diyos ay lumilipad-lipad sa ibabaw ng mga tubig.",
  "At sinabi ng Diyos, 'Magkaroon ng liwanag.' At nagkaroon ng liwanag.",
  "At nakita ng Diyos na ang liwanag ay mabuti; at inihiwalay ng Diyos ang liwanag sa kadiliman.",
  "Tinawag ng Diyos ang liwanag na Araw, at ang kadiliman ay tinawag niyang Gabi. At nagkaroon ng gabi at nagkaroon ng umaga, ang unang araw.",
  "At sinabi ng Diyos, 'Magkaroon ng kalawakan sa kalagitnaan ng mga tubig, at paghiwalayin ang tubig sa tubig.'",
  "At ginawa ng Diyos ang kalawakan, at inihiwalay ang tubig na nasa ilalim ng kalawakan mula sa tubig na nasa itaas ng kalawakan. At nangyari ang ganoon.",
  "At tinawag ng Diyos ang kalawakan na Langit. At nagkaroon ng gabi at nagkaroon ng umaga, ang ikalawang araw.",
  "At sinabi ng Diyos, 'Mangatipon ang mga tubig sa ilalim ng langit sa isang dako, at lumitaw ang tuyong lupa.' At nangyari ang ganoon.",
  "At tinawag ng Diyos ang tuyong lupa na Lupa; at ang pagtitipon ng mga tubig ay tinawag niyang Karagatan. At nakita ng Diyos na ito ay mabuti.",
  "At sinabi ng Diyos, 'Pasibulin ng lupa ang mga halamang damo, mga halamang nagbubunga ng binhi, at mga puno ng prutas na nagbubunga ayon sa kani-kanilang uri, na nasa loob ang kanilang binhi, sa ibabaw ng lupa.' At nangyari ang ganoon.",
  "At nagtuluy-tuluyan ang lupa ng mga halamang damo at mga halamang nagbubunga ng binhi ayon sa kani-kanilang uri, at mga puno na nagbubunga na nasa loob ang binhi, ayon sa kani-kanilang uri. At nakita ng Diyos na ito ay mabuti.",
  "At nagkaroon ng gabi at nagkaroon ng umaga, ang ikatlong araw.",
  "At sinabi ng Diyos, 'Magkaroon ng mga ilaw sa kalawakan ng langit upang paghiwalayin ang araw sa gabi; at maging tanda sila at mga takdang panahon, at mga araw at mga taon.'",
  "'At maging ilaw sila sa kalawakan ng langit upang magbigay liwanag sa lupa.' At nangyari ang ganoon.",
  "At gumawa ang Diyos ng dalawang dakilang ilaw: ang malaking ilaw upang mamuno sa araw, at ang maliit na ilaw upang mamuno sa gabi; gayundin ang mga bituin.",
  "At inilagay sila ng Diyos sa kalawakan ng langit upang magbigay liwanag sa lupa,",
  "at upang mamuno sa araw at sa gabi, at upang paghiwalayin ang liwanag sa kadiliman. At nakita ng Diyos na ito ay mabuti.",
  "At nagkaroon ng gabi at nagkaroon ng umaga, ang ikaapat na araw.",
  "At sinabi ng Diyos, 'Mangagkalaman ng kasagutan ang mga tubig ng mga nilalang na may buhay; at lumipas sa ibabaw ng lupa ang mga ibon sa bukas na kalawakan ng langit.'",
  "At lumikha ang Diyos ng malalaking nilalang sa dagat, at ng bawat buhay na bagay na gumagalaw, na siyang ikinalaman ng mga tubig, ayon sa kanilang mga uri, at bawat may pakpak na ibon ayon sa kani-kanilang uri. At nakita ng Diyos na ito ay mabuti.",
  "At pinagpala sila ng Diyos, na sinasabi, 'Kayo'y mamunga at dumami, at punuin ninyo ang mga tubig sa mga karagatan; at ang mga ibon ay dumami sa lupa.'",
  "At nagkaroon ng gabi at nagkaroon ng umaga, ang ikalimang araw.",
  "At sinabi ng Diyos, 'Ilabas ng lupa ang mga buhay na nilalang ayon sa kani-kanilang uri, mga hayop at maliksi na bagay, at mga hayop sa lupa ayon sa kani-kanilang uri.' At nangyari ang ganoon.",
  "At gumawa ang Diyos ng mga hayop sa lupa ayon sa kani-kanilang uri, at mga hayop na ayon sa kani-kanilang uri, at lahat ng bagay na gumagalaw sa lupa ayon sa kani-kanilang uri. At nakita ng Diyos na ito ay mabuti.",
  "At sinabi ng Diyos, 'Gumawa tayo ng tao ayon sa ating larawan, ayon sa ating wangis; at magkaroon sila ng kapangyarihan sa isda sa dagat, at sa mga ibon sa himpapawid, at sa mga hayop, at sa buong lupa, at sa bawat maliksi na bagay na gumagalaw sa lupa.'",
  "At nilikha ng Diyos ang tao ayon sa kaniyang larawan, ayon sa larawan ng Diyos siya nilalang; lalaki at babae silang nilalang.",
  "At pinagpala sila ng Diyos, at sinabi ng Diyos sa kanila, 'Kayo'y mamunga at dumami, at punuin ang lupa at ito'y sakupin; at magkaroon ng kapangyarihan sa isda sa dagat, at sa mga ibon sa himpapawid, at sa bawat buhay na bagay na gumagalaw sa lupa.'",
  "At sinabi ng Diyos, 'Narito, ibinibigay ko sa inyo ang bawat halamang nagbubunga ng binhi, na nasa ibabaw ng buong lupa, at bawat puno na may bunga ng punong nagbubunga ng binhi; sa inyo ito'y magiging pagkain.'",
  "'At sa bawat hayop sa lupa, at sa bawat ibon sa himpapawid, at sa bawat gumagalaw sa lupa na may buhay, ibinibigay ko ang lahat ng hayop na halaman para sa pagkain.' At nangyari ang ganoon.",
  "At nakita ng Diyos ang lahat ng kaniyang ginawa, at, narito, ito ay totoong mabuti. At nagkaroon ng gabi at nagkaroon ng umaga, ang ikaanim na araw.",
];

// ─────────────────────────────────────────────
// SEED GENESIS 1 VERSES — PINOY (Contemporary Filipino)
// ─────────────────────────────────────────────
const genesis1PINOY = [
  "Sa simula pa, nilikha ng Diyos ang langit at ang lupa.",
  "Walang anyo ang lupa at walang laman ito. Madilim ang kalaliman ng tubig, at ang Espiritu ng Diyos ay nag-iipon-iipon sa ibabaw ng tubig.",
  "Nagsalita ang Diyos, 'Magliwanag!' At nagliwanag.",
  "Nakita ng Diyos na maganda ang liwanag, kaya't inihiwalay niya ang liwanag sa kadiliman.",
  "Tinawag ng Diyos ang liwanag na 'Araw' at ang kadiliman ay tinawag niyang 'Gabi.' Dumating ang gabi at lumipas ang umaga — iyon ang unang araw.",
  "Nagsalita muli ang Diyos, 'Magkaroon ng kalawakan sa gitna ng tubig para ihiwalay ang tubig sa tubig.'",
  "Kaya't ginawa ng Diyos ang kalawakan at inihiwalay ang tubig sa ibaba ng kalawakan mula sa tubig sa itaas ng kalawakan. At nangyari ang sinabi niya.",
  "Tinawag ng Diyos ang kalawakan na 'Langit.' Dumating ang gabi at lumipas ang umaga — iyon ang ikalawang araw.",
  "Nagsalita muli ang Diyos, 'Magsama-sama ang tubig sa ibaba ng langit sa isang lugar para lumabas ang tuyong lupa.' At nangyari ang sinabi niya.",
  "Tinawag ng Diyos ang tuyong lupa na 'Lupa' at ang pinagsama-samang tubig ay tinawag niyang 'Dagat.' Nakita ng Diyos na maganda ito.",
  "Nagsalita muli ang Diyos, 'Magpalaki ng halaman ang lupa — mga halaman na nagbubunga ng buto at mga punong nagbubunga ng prutas na may buto sa loob, ayon sa kani-kanilang uri.' At nangyari ang sinabi niya.",
  "Nagpalaki ang lupa ng mga halaman — mga halaman na nagbubunga ng buto ayon sa kani-kanilang uri, at mga puno na nagbubunga ng prutas na may buto sa loob ayon sa kani-kanilang uri. Nakita ng Diyos na maganda ito.",
  "Dumating ang gabi at lumipas ang umaga — iyon ang ikatlong araw.",
  "Nagsalita muli ang Diyos, 'Magkaroon ng mga ilaw sa kalawakan para ihiwalay ang araw sa gabi. Maging tanda sila para sa mga takdang kapistahan, mga araw, at mga taon.'",
  "'Maging ilaw sila sa kalawakan para magliwanag sa lupa.' At nangyari ang sinabi niya.",
  "Kaya't ginawa ng Diyos ang dalawang malaking ilaw — ang mas malaking ilaw para mamuno sa araw, at ang mas maliit na ilaw para mamuno sa gabi. Ginawa rin niya ang mga bituin.",
  "Inilagay ng Diyos ang mga ito sa kalawakan para magliwanag sa lupa,",
  "para mamuno sa araw at sa gabi, at para ihiwalay ang liwanag sa kadiliman. Nakita ng Diyos na maganda ito.",
  "Dumating ang gabi at lumipas ang umaga — iyon ang ikaapat na araw.",
  "Nagsalita muli ang Diyos, 'Mapuno ang tubig ng napakaraming nilalang na may buhay, at lumipas sa himpapawid ang mga ibon sa itaas ng lupa.'",
  "Kaya't lumikha ang Diyos ng malalaking hayop sa tubig at ng lahat ng uri ng nilalang na gumagalaw sa tubig, at ng lahat ng uri ng ibon. Nakita ng Diyos na maganda ito.",
  "Pinagpala sila ng Diyos at sinabi niya, 'Dumami kayo at punan ang tubig sa dagat; dumami rin ang mga ibon sa lupa.'",
  "Dumating ang gabi at lumipas ang umaga — iyon ang ikalimang araw.",
  "Nagsalita muli ang Diyos, 'Magpalaki ng mga hayop ang lupa — mga hayop na alagado, mga nagsisigapang, at mga ligasang hayop, ayon sa kani-kanilang uri.' At nangyari ang sinabi niya.",
  "Kaya't ginawa ng Diyos ang lahat ng uri ng ligasang hayop, lahat ng uri ng hayop na alagado, at lahat ng hayop na nagsisigapang. Nakita ng Diyos na maganda ito.",
  "Nagsalita muli ang Diyos, 'Gumawa tayo ng tao na kapareho natin, na katulad natin. Sila ang mamamahala sa mga isda sa dagat, mga ibon sa himpapawid, mga hayop na alagado, at sa lahat ng nagsisigapang sa lupa.'",
  "Kaya't nilikha ng Diyos ang tao na kapareho niya; nilikha niya silang lalaki at babae.",
  "Pinagpala sila ng Diyos at sinabi niya, 'Magkaroon kayo ng maraming anak para mapuno ang lupa at mapangalagaan ito. Mangasiwa kayo sa mga isda sa dagat, mga ibon sa himpapawid, at sa lahat ng hayop na nagsisigapang sa lupa.'",
  "Sinabi pa ng Diyos, 'Ibinibigay ko sa inyo ang lahat ng halaman sa buong lupa na nagbubunga ng buto, at lahat ng punong nagbubunga ng prutas na may buto sa loob. Ito ang magiging pagkain ninyo.'",
  "'At sa lahat ng hayop sa lupa, sa lahat ng ibon sa himpapawid, at sa lahat ng nagsisigapang sa lupa na may buhay, ibinibigay ko ang lahat ng halaman para maging pagkain nila.' At nangyari ang sinabi niya.",
  "Tiningnan ng Diyos ang lahat ng kaniyang nilalang at napakaganda nito. Dumating ang gabi at lumipas ang umaga — iyon ang ikaanim na araw.",
];

run(() => {
  const stmt = db.prepare(`INSERT OR IGNORE INTO bible_verses (version_id,book_number,chapter,verse,text) VALUES (?,?,?,?,?)`);
  genesis1ESV.forEach((text, i)   => stmt.run('ESV',   1, 1, i+1, text));
  genesis1NLT.forEach((text, i)   => stmt.run('NLT',   1, 1, i+1, text));
  genesis1ASND.forEach((text, i)  => stmt.run('ASND',  1, 1, i+1, text));
  genesis1PINOY.forEach((text, i) => stmt.run('PINOY', 1, 1, i+1, text));
  console.log('✅ Genesis 1 verses seeded (4 versions × 31 verses)');
});

// ─────────────────────────────────────────────
// SEED SAMPLE EVENTS
// ─────────────────────────────────────────────
run(() => {
  const events = [
    { title: 'Sunday Worship Service', description: 'Join us for our weekly worship service', event_date: '2026-03-08 10:00:00', location: 'Main Sanctuary', audience_type: 'public', created_by: 'admin-001' },
    { title: 'Men\'s Bible Study', description: 'Weekly men\'s bible study and fellowship', event_date: '2026-03-10 07:00:00', location: 'Room 101', audience_type: 'public', created_by: 'leader-002' },
    { title: 'Women\'s Prayer Meeting', description: 'Monthly women\'s prayer and worship night', event_date: '2026-03-12 19:00:00', location: 'Chapel', audience_type: 'public', created_by: 'leader-001' },
    { title: 'Youth Retreat', description: 'Annual youth retreat in the mountains', event_date: '2026-03-20 08:00:00', location: 'Camp Sonshine', audience_type: 'public', created_by: 'admin-001' },
  ];
  const stmt = db.prepare(`INSERT OR IGNORE INTO events (title,description,event_date,location,audience_type,created_by,qr_code) VALUES (?,?,?,?,?,?,?)`);
  events.forEach(e => stmt.run(e.title, e.description, e.event_date, e.location, e.audience_type, e.created_by, `QR-${Date.now()}-${Math.random().toString(36).slice(2,8)}`));
  console.log('✅ Sample events seeded');
});

// ─────────────────────────────────────────────
// SEED GROUPS
// ─────────────────────────────────────────────
run(() => {
  const groups = [
    { name: 'Men\'s Bible Study Group', leader_id: 'leader-002', category: 'bible-study', description: 'Deep dive into scripture for men' },
    { name: 'Women\'s Prayer Circle', leader_id: 'leader-001', category: 'prayer', description: 'Weekly prayer and encouragement for women' },
    { name: 'Young Adults Community', leader_id: 'leader-001', category: 'community', description: 'Fellowship and growth for young adults 18-35' },
    { name: 'Worship Team', leader_id: 'leader-002', category: 'ministry', description: 'Music ministry and worship team rehearsals' },
  ];
  const stmt = db.prepare(`INSERT OR IGNORE INTO groups (name,leader_id,category,description) VALUES (?,?,?,?)`);
  groups.forEach(g => stmt.run(g.name, g.leader_id, g.category, g.description));
  console.log('✅ Groups seeded');
});

// ─────────────────────────────────────────────
// SEED SERMONS
// ─────────────────────────────────────────────
run(() => {
  db.prepare(`INSERT OR IGNORE INTO sermon_series (title,description,speaker,start_date) VALUES (?,?,?,?)`).run('In The Beginning', 'A series through Genesis 1-11', 'Pastor James', '2026-02-01');
  const seriesId = (db.prepare(`SELECT id FROM sermon_series WHERE title = 'In The Beginning'`).get() as any)?.id;
  if (seriesId) {
    const sermons = [
      { title: 'The God Who Creates', speaker: 'Pastor James', bible_passage: 'Genesis 1:1-2', date_preached: '2026-02-02', duration: 2820 },
      { title: 'Light in the Darkness', speaker: 'Pastor James', bible_passage: 'Genesis 1:3-5', date_preached: '2026-02-09', duration: 2940 },
      { title: 'Image Bearers', speaker: 'Pastor James', bible_passage: 'Genesis 1:26-28', date_preached: '2026-02-16', duration: 3060 },
    ];
    const stmt = db.prepare(`INSERT OR IGNORE INTO sermons (series_id,title,speaker,bible_passage,date_preached,duration) VALUES (?,?,?,?,?,?)`);
    sermons.forEach(s => stmt.run(seriesId, s.title, s.speaker, s.bible_passage, s.date_preached, s.duration));
  }
  console.log('✅ Sermons seeded');
});

// ─────────────────────────────────────────────
// SEED READING PLANS
// ─────────────────────────────────────────────
run(() => {
  const plans = [
    { title: 'Bible in a Year', description: 'Read through the entire Bible in 365 days', duration_days: 365, is_premade: 1 },
    { title: 'New Testament in 90 Days', description: 'Complete the New Testament in 90 days', duration_days: 90, is_premade: 1 },
    { title: 'Psalms & Proverbs Month', description: '30-day journey through Psalms and Proverbs', duration_days: 30, is_premade: 1 },
    { title: 'Genesis Exploration', description: 'Deep dive into Genesis over 7 days', duration_days: 7, is_premade: 1 },
  ];
  const stmt = db.prepare(`INSERT OR IGNORE INTO reading_plans (title,description,duration_days,is_premade) VALUES (?,?,?,?)`);
  plans.forEach(p => stmt.run(p.title, p.description, p.duration_days, p.is_premade));

  // Seed Genesis plan days
  const genesisPlanId = (db.prepare(`SELECT id FROM reading_plans WHERE title = 'Genesis Exploration'`).get() as any)?.id;
  if (genesisPlanId) {
    const days = [
      { day: 1, passages: ['Genesis 1:1-31'], devotional: 'Reflect on God as the creator of all things.' },
      { day: 2, passages: ['Genesis 2:1-25'], devotional: 'God rests and establishes the Sabbath.' },
      { day: 3, passages: ['Genesis 3:1-24'], devotional: 'The fall and God\'s redemptive promise.' },
      { day: 4, passages: ['Genesis 4:1-26'], devotional: 'Cain and Abel: choices and consequences.' },
      { day: 5, passages: ['Genesis 5:1-32'], devotional: 'The line of Adam and God\'s faithfulness.' },
      { day: 6, passages: ['Genesis 6:1-22'], devotional: 'Noah finds grace in the eyes of the Lord.' },
      { day: 7, passages: ['Genesis 7:1-24', 'Genesis 8:1-22'], devotional: 'God\'s judgment and mercy through the flood.' },
    ];
    const dayStmt = db.prepare(`INSERT OR IGNORE INTO plan_days (plan_id,day_number,passages,devotional) VALUES (?,?,?,?)`);
    days.forEach(d => dayStmt.run(genesisPlanId, d.day, JSON.stringify(d.passages), d.devotional));
  }
  console.log('✅ Reading plans seeded');
});

// ─────────────────────────────────────────────
// SEED VOLUNTEER OPPORTUNITIES
// ─────────────────────────────────────────────
run(() => {
  db.prepare(`INSERT OR IGNORE INTO ministries (name,category,description,leader_id) VALUES (?,?,?,?)`).run('Worship Ministry', 'music', 'Lead the congregation in worship', 'leader-002');
  db.prepare(`INSERT OR IGNORE INTO ministries (name,category,description,leader_id) VALUES (?,?,?,?)`).run('Hospitality', 'service', 'Welcome and serve guests', 'leader-001');
  db.prepare(`INSERT OR IGNORE INTO ministries (name,category,description,leader_id) VALUES (?,?,?,?)`).run('Children\'s Ministry', 'education', 'Teach and care for children', 'leader-001');

  const m1 = (db.prepare(`SELECT id FROM ministries WHERE name = 'Worship Ministry'`).get() as any)?.id;
  const m2 = (db.prepare(`SELECT id FROM ministries WHERE name = 'Hospitality'`).get() as any)?.id;

  if (m1) db.prepare(`INSERT OR IGNORE INTO volunteer_opportunities (ministry_id,title,description,event_date,start_time,end_time,slots_total,location) VALUES (?,?,?,?,?,?,?,?)`).run(m1, 'Sunday Worship Team', 'Serve on the worship team', '2026-03-08', '8:30 AM', '12:00 PM', 8, 'Main Sanctuary');
  if (m2) db.prepare(`INSERT OR IGNORE INTO volunteer_opportunities (ministry_id,title,description,event_date,start_time,end_time,slots_total,location) VALUES (?,?,?,?,?,?,?,?)`).run(m2, 'Guest Welcome Team', 'Greet and welcome visitors', '2026-03-08', '9:00 AM', '11:00 AM', 10, 'Main Entrance');

  console.log('✅ Volunteer opportunities seeded');
});

// ─────────────────────────────────────────────
// SEED PRAYER REQUESTS (sample public ones)
// ─────────────────────────────────────────────
run(() => {
  const prayers = [
    { user_id: 'user-001', title: 'Healing for my father', description: 'Please pray for my father who is recovering from surgery.', is_private: 0 },
    { user_id: 'user-002', title: 'Guidance for new job', description: 'Seeking God\'s direction as I consider a career change.', is_private: 0 },
    { user_id: 'user-001', title: 'Marriage restoration', description: 'Praying for reconciliation in my marriage.', is_private: 0 },
  ];
  const stmt = db.prepare(`INSERT OR IGNORE INTO prayer_requests (user_id,title,description,is_private) VALUES (?,?,?,?)`);
  prayers.forEach(p => stmt.run(p.user_id, p.title, p.description, p.is_private));
  console.log('✅ Prayer requests seeded');
});

console.log('\n🎉 Database seed complete! BFF+ is ready.\n');
console.log('Default credentials:');
console.log('  Admin:  admin@bffplus.church  / Admin@1234');
console.log('  Pastor: pastor@bffplus.church / Pastor@1234');
console.log('  Leader: sarah@bffplus.church  / Leader@1234');
console.log('  User:   alice@bffplus.church  / User@1234\n');

db.close();
