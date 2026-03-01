# BFF+ Church Community App — Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ 
- npm 10+
- Git

### 1. Clone & Setup

```bash
git clone <your-repo-url>
cd webapp

# Copy environment file
cp .env.example .env.local

# Edit .env.local with your values (minimum required):
# NEXTAUTH_SECRET=<32-char random string>
# NEXTAUTH_URL=http://localhost:3000
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Initialize & Seed Database

```bash
# Initialize database schema + seed all data
npm run db:init
# OR:
npx ts-node --project tsconfig.scripts.json scripts/seed.ts
```

This seeds:
- Bible versions: ESV, NLT, ASND (Tagalog), PINOY (Filipino Contemporary)
- Genesis 1 complete (31 verses × 4 versions)
- 66 Bible books × 4 versions
- Sample users (admin, pastor, leader, member)
- Sample events, groups, sermons, reading plans, volunteer opportunities, prayer requests
- Badges (10 achievement badges)

### 4. Run Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

### 5. Demo Credentials

| Role    | Email                     | Password      |
|---------|---------------------------|---------------|
| Admin   | admin@bffplus.church      | Admin@1234    |
| Pastor  | pastor@bffplus.church     | Pastor@1234   |
| Leader  | sarah@bffplus.church      | Leader@1234   |
| Member  | alice@bffplus.church      | User@1234     |

---

## 🏗️ Production Deployment

### Build

```bash
npm run build
npm run start
```

### Environment Variables (Production)

```bash
# Required
NEXTAUTH_SECRET=<strong-random-64-char-secret>
NEXTAUTH_URL=https://your-domain.com
DATABASE_PATH=/data/bff.db   # persistent volume

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=...
FIREBASE_SERVER_KEY=...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...

# File Uploads
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=...
```

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "run", "start"]
```

---

## 📱 Mobile Build (Capacitor)

### Prerequisites

```bash
# iOS
xcode-select --install

# Android  
# Install Android Studio + SDK

# Capacitor CLI
npm install -g @capacitor/cli
```

### Setup Capacitor

```bash
# Install Capacitor packages
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npm install @capacitor/push-notifications @capacitor/local-notifications
npm install @capacitor/camera @capacitor/filesystem @capacitor/splash-screen

# Initialize (if not already done)
npx cap init "BFF+" "church.bffplus.app"
```

### Build for Mobile

```bash
# 1. Build static Next.js export
# In next.config.ts: set output: 'export'
npm run build

# 2. Sync web assets to native
npx cap sync

# 3. iOS
npx cap open ios
# Then: Product → Archive → Distribute in Xcode

# 4. Android
npx cap open android
# Then: Build → Generate Signed Bundle in Android Studio
```

---

## 🗄️ Database Migration (SQLite → PostgreSQL)

When scaling to PostgreSQL:

```bash
# Install PostgreSQL driver
npm install pg @types/pg drizzle-orm drizzle-kit
# OR
npm install @prisma/client prisma
```

Update `src/lib/db.ts` to use your preferred ORM with the same schema.

---

## 🔐 User Roles

| Role    | Access Level |
|---------|-------------|
| `user`  | Standard member — Bible, Journal, Chat (receive), Events, Groups, Prayer, Sermons, Giving |
| `leader`| All user + 1:1 discipleship chat, COMPASS metrics, group management |
| `pastor`| All leader + admin dashboard, user management, leader oversight |
| `admin` | Full system access — all features + user role management, system settings |

---

## 🌍 Supported Languages

| Code | Language      |
|------|--------------|
| en   | English       |
| tl   | Filipino/Tagalog |
| es   | Español       |
| zh   | 中文 (Chinese) |
| ko   | 한국어 (Korean) |
| ja   | 日本語 (Japanese) |
| fr   | Français      |
| de   | Deutsch       |

---

## 📖 Bible Versions

| ID    | Name                        | Language    |
|-------|-----------------------------|-------------|
| ESV   | English Standard Version    | English     |
| NLT   | New Living Translation      | English     |
| ASND  | Ang Salita ng Dios          | Tagalog     |
| PINOY | Pinoy Contemporary Bible    | Filipino    |

Genesis 1 (all 31 verses) is pre-seeded for all 4 versions.  
Additional chapters/books can be added via the seed script or admin API.

---

## 🎯 Key Features

### Rule of Four (Gender Safety)
- All one-on-one chats are monitored
- Male leaders cannot have private chats with female members (and vice versa) without a second leader as witness
- Implemented in `src/lib/ruleOfFour.ts`

### Faith Points & Levels
| Level         | Points Required |
|---------------|----------------|
| New Member    | 0              |
| Growing       | 100            |
| Established   | 300            |
| Leader Track  | 700            |
| Shepherd      | 1,500          |

### Badges (10 Achievement Types)
- First Steps, Word Seeker, Prayer Warrior, Journal Keeper
- Community Pillar, Generous Heart, Event Goer, Streak Master
- Discipler, Shepherd

### COMPASS Metrics
Pastors rate leader messages on 3 dimensions (0-5 each):
- Biblical Truth
- Christ-Centered
- Gospel-Shaped

---

## 🏗️ Project Structure

```
webapp/
├── scripts/
│   └── seed.ts                  # DB schema + seed data
├── src/
│   ├── app/
│   │   ├── (protected)/         # Auth-required pages
│   │   │   ├── layout.tsx       # Sidebar + bottom nav
│   │   │   ├── admin/           # Admin dashboard
│   │   │   ├── bible/           # Bible reader (4 versions)
│   │   │   ├── chat/            # Discipleship chat
│   │   │   ├── community/       # Community hub
│   │   │   ├── dashboard/       # Main dashboard
│   │   │   ├── events/          # Events + RSVP
│   │   │   ├── giving/          # Stripe/PayPal donations
│   │   │   ├── groups/          # Small groups
│   │   │   ├── notifications/   # Push notifications
│   │   │   ├── prayer-list/     # Prayer wall
│   │   │   ├── profile/         # User profile + badges
│   │   │   ├── reading-plans/   # Reading plan tracker
│   │   │   ├── search/          # Universal search
│   │   │   ├── sermons/         # Sermon library
│   │   │   ├── soap-journal/    # SOAP journaling
│   │   │   └── volunteer/       # Volunteer opportunities
│   │   ├── api/                 # 40+ API routes
│   │   │   ├── admin/           # Admin metrics + actions
│   │   │   ├── auth/            # NextAuth + registration
│   │   │   ├── bible/           # Verses, books, notes, bookmarks
│   │   │   ├── chat/            # Conversations, messages, escalations
│   │   │   ├── compass/         # COMPASS metrics
│   │   │   ├── donations/       # Stripe payment intents, history, donor wall
│   │   │   ├── events/          # Events + RSVP
│   │   │   ├── groups/          # Groups + join
│   │   │   ├── leaders/         # Leader availability
│   │   │   ├── notifications/   # Push notification tokens + inbox
│   │   │   ├── prayer/          # Prayer requests + interactions
│   │   │   ├── reading-plans/   # Plans + progress tracking
│   │   │   ├── search/          # Universal search
│   │   │   ├── sermons/         # Sermon CRUD
│   │   │   ├── soap/            # SOAP journal CRUD
│   │   │   ├── survey/          # Onboarding survey
│   │   │   ├── user/            # Profile + progress
│   │   │   └── volunteer/       # Opportunities + signups
│   │   ├── auth/                # Login + Register pages
│   │   ├── onboarding/          # 5-step onboarding survey
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Landing page
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components (20 components)
│   │   └── providers.tsx        # Session + theme providers
│   ├── lib/
│   │   ├── auth.ts              # NextAuth.js v5 config
│   │   ├── badges.ts            # Badge awarding logic
│   │   ├── db.ts                # SQLite database
│   │   ├── firebase.ts          # FCM push notifications
│   │   ├── i18n.ts              # 8-language translations
│   │   ├── notifications.ts     # Notification helpers
│   │   ├── points.ts            # Faith points system
│   │   ├── progression.ts       # Level progression rules
│   │   ├── ruleOfFour.ts        # Gender safety enforcement
│   │   └── utils.ts             # Utility functions
│   ├── middleware.ts             # Route protection (Edge Runtime)
│   └── store/                   # Zustand state stores (9 stores)
│       ├── authStore.ts
│       ├── bibleStore.ts
│       ├── chatStore.ts
│       ├── eventsStore.ts
│       ├── groupsStore.ts
│       ├── journalStore.ts
│       ├── notificationStore.ts
│       ├── profileStore.ts
│       └── searchStore.ts
├── .env.example                  # Environment variable template
├── capacitor.config.js           # Capacitor iOS/Android config
├── next.config.ts                # Next.js configuration
└── package.json
```

---
*Deployed via genspark_ai_developer branch — all 6 issues resolved, build verified.*
