# Hifdh Progress Tracker — Technical Implementation Guide

**Client:** Qalam Institute
**Stack:** React Native · Expo (Managed) · Expo Router · NativeWind · Supabase · TypeScript
**Platform:** iOS + Android (App Store + Play Store)
**Date:** March 2026

---

## How to Use This Guide

This document is divided into **13 self-contained sections**, each designed to be given to Claude Code as a single prompt in its own session. The sections are ordered by dependency — complete them in sequence.

**For each section:**
1. Copy the entire section (including the `PROJECT CONTEXT` block at the top).
2. Paste it into a new Claude Code session.
3. Claude Code will have everything it needs: schema, design tokens, file structure, and acceptance criteria.

> **Important:** Each section begins with a condensed `PROJECT CONTEXT` block so Claude Code understands the full app even when working on just one piece. Do not skip this block.

---

## Table of Contents

- Section 0: Pre-Development Setup (YOU do this manually)
- Section 1: Project Initialization & Configuration
- Section 2: Supabase Database & Auth Setup
- Section 3: Authentication Flows
- Section 4: Core Layout, Navigation & Shared Components
- Section 5: Daily Assignment Tracker — Teacher Input
- Section 6: Daily Assignment Tracker — Parent View
- Section 7: Behavior Log Module
- Section 8: Attendance Module
- Section 9: Reporting & Analytics
- Section 10: Real-Time Chat Messaging
- Section 11: Meeting Scheduling with Google Calendar
- Section 12: Push Notifications
- Section 13: App Store & Play Store Deployment

---

# SECTION 0: Pre-Development Setup

**This section is for YOU to complete manually before starting any Claude Code sessions.**

## 0.1 — Install Development Tools

Run these in your Mac terminal:

```bash
# 1. Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Node.js (LTS — v20+)
brew install node

# 3. Watchman (file watcher for React Native)
brew install watchman

# 4. Git
brew install git

# 5. EAS CLI (Expo Application Services — for building & submitting)
npm install -g eas-cli

# 6. Expo CLI
npm install -g expo-cli

# Verify everything
node -v        # Should be 20.x+
npm -v         # Should be 10.x+
git --version
eas --version
```

## 0.2 — Install Xcode (Required for iOS)

1. Open the Mac App Store → Search "Xcode" → Install (it's ~12 GB, takes a while).
2. After install, open Xcode once and accept the license agreement.
3. Install command-line tools:
   ```bash
   xcode-select --install
   ```
4. Open Xcode → Settings → Platforms → Ensure "iOS" simulator is downloaded.

## 0.3 — Install Android Studio (Required for Android)

1. Download from https://developer.android.com/studio
2. During install, ensure these are checked: Android SDK, Android SDK Platform, Android Virtual Device.
3. After install, open Android Studio → More Actions → SDK Manager:
   - SDK Platforms tab: Check "Android 14 (API 34)"
   - SDK Tools tab: Check "Android SDK Build-Tools 34", "Android Emulator", "Android SDK Platform-Tools"
4. Add to your `~/.zshrc`:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```
5. Run `source ~/.zshrc` then verify: `adb --version`

## 0.4 — Create Required Accounts

| Account | URL | Purpose | Cost |
|---------|-----|---------|------|
| Apple Developer | https://developer.apple.com/programs/ | App Store distribution | $99/year |
| Google Play Console | https://play.google.com/console/ | Play Store distribution | $25 one-time |
| Supabase | https://supabase.com | Backend (DB, Auth, Realtime, Storage) | Free tier to start |
| Expo (EAS) | https://expo.dev/signup | Build service, push notifications | Free tier to start |
| Google Cloud Console | https://console.cloud.google.com | Google Calendar API | Free tier |
| GitHub | https://github.com | Source control | Free |

## 0.5 — Create the Supabase Project

1. Go to https://supabase.com → New Project.
2. Name: `hifdh-tracker`
3. Set a strong database password — **save this somewhere secure**.
4. Region: Choose the closest to your users (e.g., `us-east-1` for Virginia).
5. Once created, go to Settings → API and note down:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)
   - **Service Role Key** (starts with `eyJ...` — keep this SECRET, never put in client code)

## 0.6 — Enable Google Calendar API

1. Go to https://console.cloud.google.com → Create a new project called `hifdh-tracker`.
2. Enable the **Google Calendar API**: APIs & Services → Library → Search "Google Calendar API" → Enable.
3. Create OAuth 2.0 credentials: APIs & Services → Credentials → Create Credentials → OAuth Client ID.
   - Application type: Web application
   - Authorized redirect URIs: Add your Supabase project URL + `/auth/v1/callback`
4. Note down the **Client ID** and **Client Secret**.

## 0.7 — Set Up GitHub Repository

```bash
# Create the repo on GitHub first (via github.com), then:
mkdir hifdh-tracker
cd hifdh-tracker
git init
git remote add origin https://github.com/YOUR_USERNAME/hifdh-tracker.git
```

## 0.8 — Create Your .env Template

Create a file called `.env.template` in the project root (you'll fill in values as you go):

```env
# Supabase (client-side — safe to expose, protected by RLS)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_your-key-here

# Google Calendar (used in Supabase Edge Functions, NOT in client)
GOOGLE_CALENDAR_CLIENT_ID=your-client-id
GOOGLE_CALENDAR_CLIENT_SECRET=your-client-secret

# EAS (auto-configured by eas login)
EXPO_TOKEN=your-expo-token
```

Copy this to `.env.local` and fill in your actual values. **Never commit `.env.local` to git.** Ensure your `.gitignore` includes both `.env` and `.env.local`.

**Finding your keys:** Go to your Supabase project → Settings → API Keys.
- **Publishable key** (`sb_publishable_...`): Goes in `EXPO_PUBLIC_SUPABASE_ANON_KEY` above. Safe for client code — access is controlled by RLS.
- **Secret key** (`sb_secret_...`): Do NOT put this in `.env.local`. It bypasses RLS entirely. This is only used in Supabase Edge Functions (Sections 11–12) and is set as an Edge Function secret:
  ```bash
  supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sb_secret_your-key-here
  ```

> **Note on naming:** The env var is still called `SUPABASE_ANON_KEY` because that's what most supabase-js tutorials and the Supabase Expo docs use. The publishable key is a drop-in replacement — supabase-js accepts either.

## 0.9 — Log into EAS

```bash
eas login
# Enter your Expo account credentials
```

## 0.10 — Install Claude Code Skills & Plugins

These give Claude Code domain-specific best practices for your exact stack. Install them before starting any coding sessions.

```bash
# Superpowers — workflow methodology (brainstorming, planning, TDD, subagent-driven dev)
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace

# React Native best practices (Vercel) — list perf, animations, navigation, UI patterns
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-native-skills

# Supabase Postgres best practices (official) — schema, queries, RLS, indexes
npx skills add supabase/agent-skills

# React Native performance (Callstack) — FPS, bundle size, TTI, memory
npx skills add https://github.com/callstackincubator/agent-skills --skill react-native-best-practices

# Expo Deployment — EAS Build, App Store, Play Store submission
npx skills add https://github.com/expo/skills --skill expo-deployment
```

**DO NOT install these (they conflict with our setup):**
- `expo-tailwind-setup` — This is for NativeWind v5 + Tailwind v4. We use NativeWind v4 + Tailwind v3. It will cause Claude Code to generate incompatible code.
- `building-native-ui` — Explicitly says "CSS and Tailwind are not supported." Conflicts with our NativeWind styling approach.

## 0.11 — Scaffold Project Files

After creating the project in Section 1, set up these files that Claude Code expects:

```bash
# Create docs directory
mkdir -p docs tasks

# Copy the design system reference (Claude Code reads this for UI work)
# Place your design-system.md file here:
# docs/design-system.md

# Copy this implementation guide (for YOUR reference, not Claude Code's)
# docs/hifdh-implementation-guide.md

# Create empty task tracking files
touch tasks/todo.md tasks/lessons.md

# Create Claude Code hooks config
mkdir -p .claude
cat > .claude/settings.json << 'EOF'
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "npx tsc --noEmit --pretty 2>&1 | head -20" }]
      }
    ]
  }
}
EOF

# Place your CLAUDE.md at the project root
# CLAUDE.md
```

Your project root should now look like:
```
hifdh-tracker/
├── CLAUDE.md
├── .claude/
│   └── settings.json          (hooks config)
├── docs/
│   ├── design-system.md       (Claude Code reads via @import for UI work)
│   └── hifdh-implementation-guide.md  (YOUR reference — never read by Claude Code)
├── tasks/
│   ├── todo.md                (empty — Claude Code writes to this)
│   └── lessons.md             (empty — Claude Code writes to this)
├── .env.template
└── .gitignore
```

---

# SECTION 1: Project Initialization & Configuration

> **Copy everything below this line (including the PROJECT CONTEXT block) and paste into Claude Code.**

---

## PROJECT CONTEXT

You are building "Hifdh Tracker" — a mobile app for Qalam Institute that lets teachers record and track Quran memorization (Hifdh) students' assignments, behavior, and attendance, while parents monitor their child's progress and communicate with staff.

**Tech stack:** React Native, Expo SDK 52+ (managed workflow), Expo Router (file-based routing), NativeWind v4 (Tailwind CSS), Supabase (Postgres + Auth + Realtime + Edge Functions), TypeScript.

**Target:** iOS + Android, straight to App Store / Play Store via EAS Build.

---

## TASK: Initialize the Expo project with all dependencies, configure NativeWind, set up the folder structure, install fonts, and create the design system foundation.

### Step 1 — Create the Expo Project

```bash
npx create-expo-app@latest hifdh-tracker --template blank-typescript
cd hifdh-tracker
```

### Step 2 — Install All Dependencies

```bash
# Core navigation
npx expo install expo-router expo-linking expo-constants expo-status-bar

# NativeWind v4
npx expo install nativewind tailwindcss react-native-reanimated
npx expo install react-native-safe-area-context react-native-screens

# Supabase
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill

# UI utilities
npx expo install expo-font expo-splash-screen expo-image
npx expo install react-native-gesture-handler

# Icons
npx expo install lucide-react-native react-native-svg

# Forms & validation
npm install react-hook-form zod @hookform/resolvers

# Date handling
npm install date-fns

# Charts (for reporting section later)
npm install react-native-gifted-charts

# Push notifications
npx expo install expo-notifications expo-device

# Secure storage for tokens
npx expo install expo-secure-store
```

### Step 3 — Configure NativeWind

Create `tailwind.config.js` in the project root with the Qalam design system:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B8EAD',
          dark: '#2A6F8A',
          light: '#E6F2F7',
          50: '#F0F7FA',
        },
        coral: '#D46B5A',
        accent: {
          DEFAULT: '#C4983B',
          light: '#F5EDD6',
        },
        offwhite: '#F8F8F8',
        charcoal: '#2C2C2C',
        gray: {
          100: '#F2F2F2',
          200: '#E0E0E0',
          400: '#A0A0A0',
          600: '#6B6B6B',
        },
        success: '#2D7A4F',
        warning: '#D4922A',
        error: '#C0392B',
        info: '#3B8EAD',
      },
      fontFamily: {
        heading: ['PlayfairDisplay_700Bold'],
        body: ['SourceSans3_400Regular'],
        'body-medium': ['SourceSans3_500Medium'],
        'body-semibold': ['SourceSans3_600SemiBold'],
        arabic: ['Amiri_400Regular'],
        'arabic-bold': ['Amiri_700Bold'],
      },
      borderRadius: {
        card: '12px',
        button: '8px',
        chip: '20px',
      },
    },
  },
  plugins: [],
};
```

Create `global.css` in the project root:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Create `nativewind-env.d.ts` in the project root:

```ts
/// <reference types="nativewind/types" />
```

Update `metro.config.js`:

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

Update `babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

### Step 4 — Set Up the Folder Structure

```
hifdh-tracker/
├── app/                          # Expo Router file-based routes
│   ├── _layout.tsx               # Root layout (fonts, providers, auth gate)
│   ├── index.tsx                 # Entry redirect (to auth or tabs)
│   ├── (auth)/                   # Auth group
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (teacher)/                # Teacher tab group
│   │   ├── _layout.tsx           # Bottom tab navigator
│   │   ├── dashboard.tsx
│   │   ├── students/
│   │   │   ├── index.tsx         # Student list
│   │   │   └── [id].tsx          # Individual student view
│   │   ├── assignments/
│   │   │   ├── index.tsx
│   │   │   └── new.tsx           # New assignment form
│   │   ├── attendance.tsx
│   │   ├── messages/
│   │   │   ├── index.tsx
│   │   │   └── [conversationId].tsx
│   │   └── settings.tsx
│   └── (parent)/                 # Parent tab group
│       ├── _layout.tsx           # Bottom tab navigator
│       ├── dashboard.tsx
│       ├── assignments.tsx
│       ├── attendance.tsx
│       ├── messages/
│       │   ├── index.tsx
│       │   └── [conversationId].tsx
│       └── settings.tsx
├── components/                   # Shared UI components
│   ├── ui/                       # Design system primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── StatusChip.tsx
│   │   ├── Avatar.tsx
│   │   └── SectionDivider.tsx    # Islamic geometric divider
│   ├── assignments/
│   ├── attendance/
│   ├── behavior/
│   ├── chat/
│   └── reports/
├── lib/                          # Utilities and configuration
│   ├── supabase.ts               # Supabase client
│   ├── auth.tsx                  # Auth context provider
│   ├── types.ts                  # TypeScript types (DB models)
│   └── constants.ts              # App-wide constants
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts
│   ├── useStudents.ts
│   ├── useAssignments.ts
│   └── useMessages.ts
├── assets/                       # Static assets
│   ├── fonts/
│   └── images/
├── global.css
├── tailwind.config.js
├── app.json
├── .env
└── .env.template
```

Create all these directories and placeholder files. Every `.tsx` file should have a minimal valid React component export.

### Step 5 — Load Fonts

In `app/_layout.tsx`, load the Google Fonts:

```bash
npx expo install @expo-google-fonts/playfair-display @expo-google-fonts/source-sans-3 @expo-google-fonts/amiri
```

The root layout should:
1. Load all fonts using `useFonts` from each font package.
2. Show `expo-splash-screen` until fonts are loaded.
3. Import `global.css`.
4. Wrap children in SafeAreaProvider.

Fonts to load:
- `PlayfairDisplay_700Bold`
- `SourceSans3_400Regular`
- `SourceSans3_500Medium`
- `SourceSans3_600SemiBold`
- `Amiri_400Regular`
- `Amiri_700Bold`

### Step 6 — Supabase Client

Create `lib/supabase.ts`:

```ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

### Step 7 — Configure app.json

Update `app.json` with:
- `name`: "Hifdh Tracker"
- `slug`: "hifdh-tracker"
- `scheme`: "hifdh-tracker" (for deep linking)
- `plugins`: include `expo-router`, `expo-secure-store`, `expo-notifications`
- `ios.bundleIdentifier`: "com.qalaminstitute.hifdhtracker"
- `android.package`: "com.qalaminstitute.hifdhtracker"
- `android.adaptiveIcon` and `ios.icon` placeholders

### Acceptance Criteria

- [ ] `npx expo start` launches without errors
- [ ] Fonts load correctly (no fallback flicker)
- [ ] NativeWind classes work (test with `className="bg-primary"` on a View)
- [ ] Supabase client initializes without errors (check console)
- [ ] Folder structure matches the tree above
- [ ] TypeScript compiles with no errors

---

# SECTION 2: Supabase Database & Auth Setup

> **Copy everything below this line into a new Claude Code session.**

---

## PROJECT CONTEXT

You are building "Hifdh Tracker" — a mobile app for Qalam Institute that lets teachers record Quran memorization (Hifdh) students' assignments, behavior, and attendance, while parents monitor progress and communicate with staff.

**Tech stack:** React Native, Expo (managed), Expo Router, NativeWind v4, Supabase, TypeScript.

**Auth model:**
- Teachers get accounts created by an admin (manually in Supabase dashboard or via admin tooling).
- Parents receive a single-use invite code from a teacher. The code binds them to a specific student. One parent per student, but a parent can have multiple children (multiple invite codes).

---

## TASK: Write the complete Supabase SQL migration that creates all tables, enums, Row Level Security (RLS) policies, and database functions. Output this as a single `.sql` file I can run in the Supabase SQL Editor.

### Database Schema

#### Enums

```sql
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'parent');
CREATE TYPE assignment_category AS ENUM ('new_lesson', 'previous_lesson', 'revision');
CREATE TYPE pass_status AS ENUM ('pass', 'not_pass');
CREATE TYPE behavior_rating AS ENUM ('very_good', 'good', 'needs_improvement');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'left_early');
CREATE TYPE invite_status AS ENUM ('pending', 'used', 'expired');
```

#### Tables

**profiles** — extends Supabase auth.users with app-specific data
```
id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
role            user_role NOT NULL
full_name       TEXT NOT NULL
email           TEXT NOT NULL
phone           TEXT
avatar_url      TEXT
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

**students**
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
full_name       TEXT NOT NULL
arabic_name     TEXT                -- Name in Arabic script
date_of_birth   DATE
current_juz     INTEGER DEFAULT 1   -- Current Juz in Quran (1-30)
current_surah   TEXT                -- Current Surah name
enrollment_date DATE DEFAULT CURRENT_DATE
is_active       BOOLEAN DEFAULT true
notes           TEXT
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

**parent_students** — links parents to their children
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
parent_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE
relationship    TEXT DEFAULT 'parent'  -- parent, guardian, etc.
created_at      TIMESTAMPTZ DEFAULT now()
UNIQUE(parent_id, student_id)
```

**invite_codes** — teacher generates these so parents can sign up
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
code            TEXT UNIQUE NOT NULL  -- 8-char alphanumeric code
student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE
created_by      UUID NOT NULL REFERENCES profiles(id)  -- teacher who created it
status          invite_status DEFAULT 'pending'
used_by         UUID REFERENCES profiles(id)
expires_at      TIMESTAMPTZ DEFAULT (now() + interval '7 days')
created_at      TIMESTAMPTZ DEFAULT now()
```

**assignments** — daily Hifdh assignment record
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE
teacher_id      UUID NOT NULL REFERENCES profiles(id)
date            DATE NOT NULL DEFAULT CURRENT_DATE
category        assignment_category NOT NULL
pass_status     pass_status          -- NULL if not yet graded
mistakes        INTEGER DEFAULT 0
pauses          INTEGER DEFAULT 0
pages_completed NUMERIC(4,1) DEFAULT 0  -- e.g., 1.5 pages
recited_to      TEXT                    -- name of person student recited to
comments        TEXT                    -- teacher feedback
next_assignment TEXT                    -- what to prepare for tomorrow
parent_reviewed BOOLEAN DEFAULT false   -- "Seen & Reviewed" toggle
parent_reviewed_at TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
UNIQUE(student_id, date, category)      -- one entry per student per category per day
```

**behavior_logs**
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE
teacher_id      UUID NOT NULL REFERENCES profiles(id)
date            DATE NOT NULL DEFAULT CURRENT_DATE
rating          behavior_rating NOT NULL
notes           TEXT
created_at      TIMESTAMPTZ DEFAULT now()
UNIQUE(student_id, date)                -- one behavior entry per student per day
```

**attendance**
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE
teacher_id      UUID NOT NULL REFERENCES profiles(id)
date            DATE NOT NULL DEFAULT CURRENT_DATE
status          attendance_status NOT NULL
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
UNIQUE(student_id, date)
```

**absence_excuses** — parent submits excuse for student absence
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE
parent_id       UUID NOT NULL REFERENCES profiles(id)
date            DATE NOT NULL
reason          TEXT NOT NULL
submitted_at    TIMESTAMPTZ DEFAULT now()
```

**conversations** — chat threads between parent and teacher/staff
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

**conversation_participants**
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE
user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
joined_at       TIMESTAMPTZ DEFAULT now()
UNIQUE(conversation_id, user_id)
```

**messages**
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE
sender_id       UUID NOT NULL REFERENCES profiles(id)
content         TEXT NOT NULL
is_read         BOOLEAN DEFAULT false
created_at      TIMESTAMPTZ DEFAULT now()
```

**teacher_availability** — time slots teachers make available for meetings
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
teacher_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
day_of_week     INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6) -- 0=Sunday
start_time      TIME NOT NULL
end_time        TIME NOT NULL
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()
```

**meeting_bookings** — parent books a slot
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
teacher_id      UUID NOT NULL REFERENCES profiles(id)
parent_id       UUID NOT NULL REFERENCES profiles(id)
student_id      UUID NOT NULL REFERENCES students(id)
date            DATE NOT NULL
start_time      TIME NOT NULL
end_time        TIME NOT NULL
google_event_id TEXT            -- Google Calendar event ID
notes           TEXT
status          TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled'))
created_at      TIMESTAMPTZ DEFAULT now()
```

**push_tokens** — Expo push notification tokens
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
token           TEXT NOT NULL
platform        TEXT NOT NULL CHECK (platform IN ('ios', 'android'))
created_at      TIMESTAMPTZ DEFAULT now()
UNIQUE(user_id, token)
```

### Row Level Security (RLS) Policies

Enable RLS on ALL tables. Key policies:

**profiles:**
- Users can read their own profile.
- Teachers and admins can read all profiles.
- Users can update their own profile (but NOT their role).

**students:**
- Teachers/admins can CRUD all students.
- Parents can only SELECT students linked to them via `parent_students`.

**assignments, behavior_logs, attendance:**
- Teachers can INSERT/UPDATE/SELECT all records.
- Parents can SELECT only records for their linked students.
- Parents can UPDATE only the `parent_reviewed` and `parent_reviewed_at` fields on assignments.

**invite_codes:**
- Teachers can INSERT and SELECT invite codes they created.
- The `redeem_invite_code` function handles the parent side (runs as SECURITY DEFINER).

**conversations, conversation_participants, messages:**
- Users can only see conversations they participate in.
- Users can only send messages to conversations they participate in.
- Messages are visible to all participants of that conversation.

**absence_excuses:**
- Parents can INSERT excuses for their own linked students.
- Teachers can SELECT all excuses.

**teacher_availability:**
- Teachers can CRUD their own availability.
- Everyone can SELECT availability (parents need to see it to book).

**meeting_bookings:**
- Teachers can see all their bookings.
- Parents can see their own bookings.
- Parents can INSERT bookings.

### Database Functions

**`handle_new_user()`** — Trigger function: when a new user signs up via Supabase Auth, automatically create a `profiles` row. Extract `role` and `full_name` from `auth.users.raw_user_meta_data`.

**`redeem_invite_code(code TEXT)`** — Called by parent during registration. Validates the code, marks it as `used`, links the parent to the student in `parent_students`, and returns the student info. Should be a `SECURITY DEFINER` function.

**`generate_invite_code(student_id UUID)`** — Called by teacher. Generates a random 8-character alphanumeric code, inserts it into `invite_codes`, and returns the code.

### Indexes

Add indexes on:
- `assignments(student_id, date)`
- `behavior_logs(student_id, date)`
- `attendance(student_id, date)`
- `messages(conversation_id, created_at)`
- `invite_codes(code)` (already unique, but ensure index exists)
- `parent_students(parent_id)`
- `parent_students(student_id)`

### Realtime

Enable Supabase Realtime on:
- `messages` table (for live chat)
- `assignments` table (so parents see updates in near-real-time)

### Acceptance Criteria

- [ ] All tables created with correct types and constraints
- [ ] All enums created
- [ ] RLS enabled on every table with correct policies
- [ ] `handle_new_user()` trigger fires on `auth.users` INSERT
- [ ] `redeem_invite_code()` works: valid code → links parent to student, invalid/expired → error
- [ ] `generate_invite_code()` returns a unique 8-char code
- [ ] Realtime enabled on `messages` and `assignments`
- [ ] Output is a single `.sql` file I can paste into the Supabase SQL Editor

---

# SECTION 3: Authentication Flows

> **Copy everything below this line into a new Claude Code session.**

---

## PROJECT CONTEXT

You are building "Hifdh Tracker" — a React Native / Expo / Supabase app for Qalam Institute. The Supabase database is already set up with all tables, RLS, and functions from Section 2.

**Auth model:**
- **Admin** creates teacher accounts (done manually in Supabase dashboard or via a simple admin script).
- **Teachers** generate invite codes for specific students. They give the code to the parent.
- **Parents** sign up using email + password + invite code. The invite code binds them to a student. They can later add more children by redeeming additional invite codes.

**Relevant tables:** `profiles` (has `role` column), `invite_codes`, `parent_students`, `students`.
**Relevant functions:** `redeem_invite_code(code TEXT)`, `handle_new_user()` trigger.

**Tech:** Expo Router for navigation, NativeWind for styling, Supabase JS client already configured in `lib/supabase.ts`.

---

## TASK: Build the complete authentication system — login screen, parent registration screen, auth context provider, role-based routing, and invite code redemption.

### Design System Reference (use for all screens)

```
Background:     bg-offwhite (#F8F8F8)
Cards:          bg-white rounded-card shadow-sm
Primary button: bg-primary text-white rounded-button h-12 font-body-semibold
Secondary btn:  bg-primary-light text-primary rounded-button h-12
Input:          bg-white border border-gray-200 rounded-button h-12 px-4 font-body
                Focus: border-primary ring-2 ring-primary/20
Input label:    text-gray-600 text-[13px] font-body-medium mb-1
Error text:     text-error text-[13px] font-body
Heading:        font-heading text-[24px] text-charcoal
Subheading:     font-body-semibold text-[18px] text-charcoal
Body text:      font-body text-[15px] text-charcoal
Screen padding: px-4
Minimum tappable target: h-12 (48px)
```

### Requirements

#### `lib/auth.tsx` — Auth Context Provider

Create a React context that:
1. Listens to `supabase.auth.onAuthStateChange`.
2. When a session exists, fetches the user's `profiles` row to get their `role`.
3. Exposes: `session`, `profile` (with role), `isLoading`, `signIn(email, password)`, `signUp(email, password, fullName, inviteCode)`, `signOut()`.
4. `signUp` should:
   a. Call `supabase.auth.signUp` with `full_name` and `role: 'parent'` in `options.data` (user metadata).
   b. After successful signup, call the `redeem_invite_code` database function with the invite code.
   c. If the invite code is invalid or expired, delete the newly created auth user and return an error.

#### `app/_layout.tsx` — Root Layout

1. Wrap the app in `<AuthProvider>`.
2. If loading, show splash screen.
3. If no session, redirect to `(auth)/login`.
4. If session exists and role is `teacher` or `admin`, redirect to `(teacher)/dashboard`.
5. If session exists and role is `parent`, redirect to `(parent)/dashboard`.

#### `app/(auth)/login.tsx` — Login Screen

- Email and password fields.
- "Sign In" primary button.
- "Parent? Register here" link at the bottom → navigates to register screen.
- Show validation errors inline.
- Show a subtle Qalam-blue header area with the app name "Hifdh Tracker" in `font-heading`.
- Optional: small بسم الله in `font-arabic text-gray-400 text-[13px]` above the title.

#### `app/(auth)/register.tsx` — Parent Registration Screen

- Fields: Full Name, Email, Password, Confirm Password, Invite Code.
- All fields validated with `react-hook-form` + `zod`.
- Invite code field should be prominent — explain that they got this code from their child's teacher.
- "Create Account" primary button.
- "Already have an account? Sign in" link.
- On success, the auth context auto-detects the session and redirects to the parent dashboard.
- On invite code error, show clear message: "Invalid or expired invite code. Please contact your child's teacher."

#### `app/(auth)/_layout.tsx`

Simple Stack layout for the auth screens, no header (custom headers inside each screen).

### Acceptance Criteria

- [ ] Teacher can log in with email/password and lands on teacher dashboard
- [ ] Parent can register with a valid invite code and lands on parent dashboard
- [ ] Invalid invite code shows an error and does NOT create an account
- [ ] Expired invite code shows an error
- [ ] Auth state persists across app restarts (SecureStore)
- [ ] Sign out clears session and redirects to login
- [ ] Role-based routing works (teacher can't see parent routes and vice versa)
- [ ] All form validation works (empty fields, invalid email, password mismatch)
- [ ] Loading states shown during auth operations

---

# SECTION 4: Core Layout, Navigation & Shared Components

> **Copy everything below this line into a new Claude Code session.**

---

## PROJECT CONTEXT

You are building "Hifdh Tracker" — a React Native / Expo / Supabase app for Qalam Institute. Auth is complete (Section 3). Users are routed to either `(teacher)/*` or `(parent)/*` based on their role.

---

## TASK: Build the bottom tab navigators for teacher and parent, plus all shared UI components from the design system.

### Design System — Full Component Reference

#### Color tokens (already in tailwind.config.js):
```
primary:       #3B8EAD    primary-dark:    #2A6F8A
primary-light: #E6F2F7    primary-50:      #F0F7FA
coral:         #D46B5A    accent:          #C4983B    accent-light: #F5EDD6
offwhite:      #F8F8F8    charcoal:        #2C2C2C
gray-100:      #F2F2F2    gray-200:        #E0E0E0
gray-400:      #A0A0A0    gray-600:        #6B6B6B
success:       #2D7A4F    warning:         #D4922A    error:  #C0392B
```

#### Typography classes:
```
Screen title:   font-heading text-[24px] text-charcoal
Section head:   font-body-semibold text-[18px] text-charcoal
Body:           font-body text-[15px] text-charcoal
Label/caption:  font-body-medium text-[13px] text-gray-600
Small/hint:     font-body text-[12px] text-gray-400
Arabic:         font-arabic (Amiri) — for Surah names, Juz references, Arabic content
```

#### Spacing:
```
Screen padding:     px-4 (16px)
Card padding:       p-4 (16px)
Card gap in lists:  gap-3 (12px) or mb-3
Section spacing:    mb-6 (24px)
Input height:       h-12 (48px)
Button height:      h-12 (48px)
Tab bar height:     h-16 (64px) + safe area
```

### Tab Navigators

#### `app/(teacher)/_layout.tsx` — Teacher Tabs

Bottom tabs with these screens:
1. **Dashboard** — icon: `LayoutDashboard` — `dashboard.tsx`
2. **Students** — icon: `Users` — `students/index.tsx`
3. **Attendance** — icon: `ClipboardCheck` — `attendance.tsx`
4. **Messages** — icon: `MessageSquare` — `messages/index.tsx`
5. **Settings** — icon: `Settings` — `settings.tsx`

Tab bar style:
- `bg-white` background, thin top border `border-t border-gray-100`
- Active tab: `primary` color icon + label, with a small dot indicator below
- Inactive tab: `gray-400` icon + label
- Icon size: 24px
- Label: `font-body text-[11px]`
- Height: 64px + safe area bottom inset

#### `app/(parent)/_layout.tsx` — Parent Tabs

Bottom tabs:
1. **Dashboard** — icon: `Home` — `dashboard.tsx`
2. **Assignments** — icon: `BookOpen` — `assignments.tsx`
3. **Attendance** — icon: `CalendarDays` — `attendance.tsx`
4. **Messages** — icon: `MessageSquare` — `messages/index.tsx`
5. **Settings** — icon: `Settings` — `settings.tsx`

Same tab bar styling as teacher.

### Shared UI Components

Build these in `components/ui/`:

#### `Button.tsx`
Props: `variant` ('primary' | 'secondary' | 'accent' | 'ghost'), `size` ('sm' | 'md' | 'lg'), `isLoading`, `disabled`, `onPress`, `children`.
- Primary: `bg-primary text-white`
- Secondary: `bg-primary-light text-primary`
- Accent: `bg-coral text-white`
- Ghost: `border border-gray-200 text-charcoal`
- All: `rounded-button h-12 font-body-semibold` (h-10 for sm, h-12 for md, h-14 for lg)
- Loading state: show ActivityIndicator in button color
- Disabled: opacity-50

#### `Card.tsx`
Props: `children`, `className` (optional extra classes).
- `bg-white rounded-card p-4` with subtle shadow.
- Shadow: use React Native `style` for shadow since NativeWind shadow support varies: `shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2`.

#### `Input.tsx`
Props: integrate with `react-hook-form` via `control` and `name`. Also: `label`, `placeholder`, `error` (string), `secureTextEntry`, `keyboardType`.
- Label above: `text-gray-600 text-[13px] font-body-medium mb-1`
- Input: `bg-white border border-gray-200 rounded-button h-12 px-4 font-body text-[15px]`
- Focus: `border-primary` (handle via onFocus state)
- Error: `text-error text-[13px] font-body mt-1` + `border-error`

#### `StatusChip.tsx`
Props: `status` (maps to a color scheme), `label` (text).
Status-to-style mapping:
- `pass` / `very_good` / `present` → `bg-success/15 text-success`
- `not_pass` / `absent` → `bg-error/15 text-error`
- `good` → `bg-accent-light text-accent`
- `needs_improvement` / `late` / `left_early` → `bg-warning/15 text-warning`
All: `rounded-chip px-3 py-1 font-body-medium text-[13px]`

#### `Avatar.tsx`
Props: `name` (string), `size` ('sm' | 'md' | 'lg'), `imageUrl` (optional).
- If no image, show initials on a `bg-primary-light text-primary` circle.
- Sizes: sm=32px, md=40px, lg=56px.

#### `SectionDivider.tsx`
An Islamic geometric accent divider: a thin horizontal line with a small SVG geometric star or octagon at the center. Uses `gray-200` for the line and `primary` or `accent` for the star. Keep it very subtle and elegant.

#### `EmptyState.tsx`
Props: `icon` (Lucide icon component), `title`, `description`, `actionLabel`, `onAction`.
Centered layout with icon in `gray-400`, title in `font-body-semibold text-charcoal`, description in `font-body text-gray-600`, and optional action button.

#### `LoadingScreen.tsx`
Full screen `bg-offwhite` with centered ActivityIndicator in `primary` color.

### Acceptance Criteria

- [ ] Teacher bottom tabs render with correct icons and 5 tabs
- [ ] Parent bottom tabs render with correct icons and 5 tabs
- [ ] Active tab shows primary color + dot indicator, inactive shows gray-400
- [ ] All shared components render correctly with all variant props
- [ ] StatusChip correctly maps all status types to colors
- [ ] SectionDivider renders a subtle Islamic geometric ornament
- [ ] Button loading state shows spinner
- [ ] Input integrates with react-hook-form (shows errors, controlled values)
- [ ] Tab bars respect safe area insets on iOS

---

# SECTION 5: Daily Assignment Tracker — Teacher Input

> **Copy everything below this line into a new Claude Code session.**

---

## PROJECT CONTEXT

You are building "Hifdh Tracker" — a React Native / Expo / Supabase app for Qalam Institute. Navigation and shared components are complete (Section 4). The database schema is set up with an `assignments` table, `students` table, and all related types.

**Relevant DB types:**
```ts
type AssignmentCategory = 'new_lesson' | 'previous_lesson' | 'revision';
type PassStatus = 'pass' | 'not_pass';
```

**Relevant tables:** `assignments`, `students`, `profiles`.

**Assignment fields:** student_id, teacher_id, date, category, pass_status, mistakes, pauses, pages_completed, recited_to, comments, next_assignment, parent_reviewed.

---

## TASK: Build the teacher's assignment input flow — student list, assignment form with all fields, and the ability to create/edit daily assignments.

### Screens to Build

#### `app/(teacher)/students/index.tsx` — Student List

- Fetch all active students from `students` table, ordered alphabetically.
- Each student row is a `Card` showing: Avatar (initials), student name, current Juz/Surah in `font-arabic`, and a small status indicator showing if today's assignment is already logged (green dot) or not (gray dot).
- Tapping a student row navigates to `students/[id]`.
- Floating action button (FAB) at bottom-right: `bg-primary` circle with `+` icon — navigates to add new student form (a simple modal or separate screen).
- Search bar at top to filter by name.
- Pull-to-refresh.

#### `app/(teacher)/students/[id].tsx` — Student Detail & Assignment Entry

This is the main screen where teachers input daily assignments. It shows:

**Header:** Student name (with arabic_name in `font-arabic` if available), current Juz/Surah, and a date picker defaulting to today.

**Assignment Cards:** Three collapsible/expandable cards, one for each category:

1. **New Lesson Card**
   - Pass/Not Pass toggle (use two-option segmented control, styled as chips: `bg-success/15 text-success` for Pass, `bg-error/15 text-error` for Not Pass)
   - Pages completed (numeric input, allows 0.5 increments)
   - "Recited to" dropdown — fetches teachers/staff from `profiles` where role is teacher
   - Comments (multiline text input)

2. **Previous Lesson Card**
   - Pass/Not Pass toggle
   - Mistakes count (numeric stepper: - / count / +)
   - Pauses count (numeric stepper)
   - Pages completed
   - "Recited to" dropdown
   - Comments

3. **Revision Card**
   - Same fields as Previous Lesson

**Below the cards:**
- **Next Day's Assignment** — text input describing what the student should prepare
- **Behavior for the Day** — segmented control: Very Good / Good / Needs Improvement, with optional notes field
- **Save button** — saves all entered data (assignments + behavior log) in a single action

**Technical details:**
- Use `react-hook-form` for the entire form.
- On save, upsert to `assignments` table (one row per category that has data).
- Also upsert to `behavior_logs` table if behavior is filled in.
- If editing an existing day's entry (date picker changed to a past date that has data), pre-fill the form.
- Show a toast/alert on successful save.

#### `app/(teacher)/assignments/index.tsx` — Assignment History

- A date-filtered list view of all assignments across all students for a given day.
- Default to today. Teacher can swipe or use date picker to change dates.
- Each row: Student name, category chips (showing pass/not_pass status), pages completed.
- Tapping a row navigates to that student's detail page for that date.

#### `app/(teacher)/assignments/new.tsx` — Quick Assignment Entry

A shortcut that lets the teacher:
1. Pick a student from a dropdown.
2. Pick a date.
3. Opens the same assignment form as `students/[id].tsx` but for the selected student.

### Numeric Stepper Component

Build `components/ui/NumericStepper.tsx`:
- `-` button, count display, `+` button in a row.
- Min value 0, max configurable.
- `-` button: `bg-gray-100 rounded-full w-8 h-8`
- `+` button: `bg-primary-light text-primary rounded-full w-8 h-8`
- Count: `font-body-semibold text-[18px] w-8 text-center`

### Card Header Ornament

On the daily assignment card (the main card in student detail), add a thin gradient line at the top — from primary to accent (blue to gold). This is the "card header ornament" from the Islamic design touches. Use a `LinearGradient` (from `expo-linear-gradient`) that is 3px tall and spans the full card width, positioned at the top of the card above the padding.

```bash
npx expo install expo-linear-gradient
```

### Acceptance Criteria

- [ ] Student list loads and displays all active students
- [ ] Search filters students by name
- [ ] Student detail screen shows all three assignment category cards
- [ ] Pass/Not Pass toggle works with correct color states
- [ ] Numeric steppers for mistakes/pauses increment/decrement correctly
- [ ] "Recited to" dropdown shows all teachers from the database
- [ ] Save button upserts all filled categories to `assignments` table
- [ ] Behavior rating saves to `behavior_logs` table
- [ ] Editing a past date pre-fills existing data
- [ ] Assignment history screen shows all students' records for a date
- [ ] Card header ornament (blue-to-gold gradient) renders at top of main card
- [ ] Pull-to-refresh works on student list

---

# SECTION 6: Daily Assignment Tracker — Parent View

> **Copy everything below this line into a new Claude Code session.**

---

## PROJECT CONTEXT

You are building "Hifdh Tracker" — a React Native / Expo / Supabase app for Qalam Institute. Teacher assignment input is complete (Section 5). Parents need to view their children's assignments and mark them as reviewed.

**Auth:** Parent is logged in and linked to one or more students via `parent_students` table.

**RLS:** Parents can only see assignments for their linked students. Parents can update ONLY the `parent_reviewed` and `parent_reviewed_at` fields.

---

## TASK: Build the parent's assignment view — dashboard with latest assignments and a dedicated assignments screen with history.

### Screens to Build

#### `app/(parent)/dashboard.tsx` — Parent Dashboard

This is the first screen a parent sees after login. It should feel warm and informative.

**Layout:**
- Greeting: "Assalamu Alaikum, [Parent Name]" in `font-heading text-[24px]`.
- Optional subtle بسم الله in `font-arabic text-gray-400 text-[13px]` above the greeting.
- If the parent has multiple children, show a horizontal scrollable child selector (pills/chips with the child's name, active child highlighted in `bg-primary text-white`, others in `bg-primary-light text-primary`).

**For the selected child, show:**

1. **Today's Assignment Summary Card** (with blue-to-gold gradient ornament at top)
   - Show each category that has an entry for today: New Lesson, Previous Lesson, Revision.
   - For each: category label, Pass/Not Pass chip, pages completed, mistake/pause counts.
   - Teacher's comments displayed below.
   - Next day's assignment in a highlighted `bg-primary-50` section.
   - **"Seen & Reviewed" button:** A prominent button at the bottom of the card.
     - If not reviewed: `bg-primary text-white` button saying "Mark as Reviewed ✓"
     - If already reviewed: `bg-success/15 text-success` chip saying "Reviewed on [date/time]"
     - Tapping it calls `supabase.from('assignments').update({ parent_reviewed: true, parent_reviewed_at: new Date() })` for all of today's assignments for this student.

2. **Today's Behavior Card**
   - Shows the behavior rating as a StatusChip + teacher's notes if any.

3. **Today's Attendance Card**
   - Shows attendance status as a StatusChip.

4. **Quick Stats Row** (below the cards)
   - Three small stat cards in a horizontal row:
     - "This Week" — X of Y assignments passed
     - "Current Juz" — Juz number + progress arc (gold accent circle)
     - "Attendance" — X days present this month

#### `app/(parent)/assignments.tsx` — Assignment History

- Filterable by date range (default: current week) and by category.
- List of assignment entries, grouped by date.
- Each entry shows: date, category, pass status chip, pages, mistakes/pauses, teacher comments.
- "Seen & Reviewed" status indicator on each day's group.
- Tapping a date group expands to show full details.

### Progress Arc Component

Build `components/ui/ProgressArc.tsx`:
- A circular arc chart showing Quran progress (e.g., 12/30 Juz completed).
- Use SVG (`react-native-svg`) to draw the arc.
- Background arc: `gray-200`, progress arc: `accent` (gold #C4983B).
- Center text: current Juz number in `font-heading text-[18px]`.
- Size prop: diameter in pixels (default 80).

### Supabase Query for Parent Data

The parent should fetch assignments like this:
```ts
// Get all student IDs for this parent
const { data: links } = await supabase
  .from('parent_students')
  .select('student_id')
  .eq('parent_id', profile.id);

const studentIds = links.map(l => l.student_id);

// Get today's assignments for all linked students
const { data: assignments } = await supabase
  .from('assignments')
  .select('*, students(full_name, arabic_name, current_juz, current_surah)')
  .in('student_id', studentIds)
  .eq('date', today);
```

### Realtime Subscription

Subscribe to assignment changes for the parent's linked students so the dashboard updates live when a teacher saves an assignment:

```ts
supabase
  .channel('assignments')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'assignments',
    filter: `student_id=in.(${studentIds.join(',')})`,
  }, (payload) => {
    // Refresh assignments
  })
  .subscribe();
```

### Acceptance Criteria

- [ ] Parent dashboard shows greeting with parent's name
- [ ] Multi-child selector works if parent has multiple children
- [ ] Today's assignment card shows all categories with correct data
- [ ] "Mark as Reviewed" button updates the database and changes to "Reviewed" state
- [ ] Behavior and attendance cards show today's data
- [ ] Quick stats row shows accurate weekly/monthly data
- [ ] Progress arc renders with gold accent color showing Juz progress
- [ ] Assignment history screen filters by date range and category
- [ ] Realtime subscription updates dashboard when teacher saves new data
- [ ] بسم الله renders correctly in Amiri font

---

# SECTION 7: Behavior Log Module

> **Copy everything below this line into a new Claude Code session.**

---

## PROJECT CONTEXT

You are building "Hifdh Tracker" — a React Native / Expo / Supabase app for Qalam Institute. Assignment tracking is complete (Sections 5–6). Behavior logging was partially built into the assignment form (Section 5), but needs its own dedicated views.

**Relevant table:** `behavior_logs` — columns: id, student_id, teacher_id, date, rating (very_good | good | needs_improvement), notes.

---

## TASK: Build dedicated behavior log views for both teacher and parent, with history and summary stats.

### Teacher View

#### Behavior section in `app/(teacher)/students/[id].tsx`

This was partially built in Section 5 (behavior rating is saved alongside assignments). Now add a **"Behavior History" tab or scrollable section** below the assignment form on the student detail page:

- Show the last 30 days of behavior entries as a visual timeline/grid.
- Each day is a small colored dot or square: green (very_good), gold (good), orange/warning (needs_improvement), gray (no entry).
- Tapping a day shows the notes for that day in a bottom sheet or expandable section.
- Summary stats: "This month: X Very Good, Y Good, Z Needs Improvement" displayed as a row of StatusChips with counts.

#### Bulk Behavior Entry

On the teacher's attendance screen (since they're already marking daily things for all students), add a quick behavior input:
- After marking attendance for the day, show each student's name with a three-option segmented control (Very Good / Good / Needs Improvement).
- Optional notes icon next to each student that opens a text input.
- "Save All" button at the bottom.

### Parent View

Add a **Behavior section** to the parent dashboard (`app/(parent)/dashboard.tsx`):
- Show the current day's behavior rating as a StatusChip with any notes.
- Below it, show a 7-day mini behavior grid (same dot-style as teacher view but smaller).
- "View Full History" link → navigates to a full behavior history list view.

#### `app/(parent)/behavior-history.tsx` (add to parent group)

- Calendar-style month view where each day is color-coded by behavior rating.
- Tapping a day shows the rating + notes.
- Month navigation (prev/next arrows).

### Acceptance Criteria

- [ ] Teacher sees behavior history timeline on student detail page
- [ ] Behavior dots/squares are correctly colored per rating
- [ ] Tapping a day shows notes
- [ ] Monthly summary stats display on teacher view
- [ ] Bulk behavior entry works alongside attendance
- [ ] Parent dashboard shows today's behavior
- [ ] Parent behavior history shows calendar month view with color-coded days
- [ ] All behavior data respects RLS (parent only sees their child's data)

---

# SECTION 8: Attendance Module

> **Copy everything below this line into a new Claude Code session.**

---

## PROJECT CONTEXT

You are building "Hifdh Tracker" — a React Native / Expo / Supabase app for Qalam Institute. Assignments and behavior are complete.

**Relevant tables:** `attendance` (student_id, teacher_id, date, status), `absence_excuses` (student_id, parent_id, date, reason).

**Attendance statuses:** present, absent, late, left_early.

---

## TASK: Build the attendance module for both teacher (input) and parent (view + excuse submission).

### Teacher View

#### `app/(teacher)/attendance.tsx`

**Daily Attendance Screen:**
- Date picker at the top (defaults to today).
- List of ALL active students.
- Each row: Avatar + student name + four selectable status buttons (Present, Absent, Late, Left Early).
  - Button styling: Use colored outlines/chips. Selected state fills with the semantic color.
  - Present: `bg-success/15 text-success border-success` when selected
  - Absent: `bg-error/15 text-error border-error` when selected
  - Late: `bg-warning/15 text-warning border-warning` when selected
  - Left Early: `bg-warning/15 text-warning border-warning` when selected
  - Unselected: `border-gray-200 text-gray-400`
- "Mark All Present" button at the top for quick entry on normal days.
- "Save Attendance" button at bottom.
- Upsert to `attendance` table (one row per student per day).

**Absence Excuses Panel:**
- Below or in a tab alongside the attendance list, show any excuse submissions for the selected date.
- Each excuse shows: student name, parent name, reason text, submitted timestamp.
- Visual indicator on the student's attendance row if an excuse exists for that student (small icon).

### Parent View

#### `app/(parent)/attendance.tsx`

**Attendance History:**
- Calendar month view (similar to behavior history) where each day is color-coded:
  - Green: Present
  - Red: Absent
  - Orange: Late or Left Early
  - Gray: No record (weekend, holiday, etc.)
- Below the calendar: attendance summary for the month — "Present: X, Absent: Y, Late: Z".
- Month navigation.

**Excuse Submission:**
- If the student is marked absent (or if the parent wants to notify in advance), show a button: "Submit Absence Excuse".
- Opens a form (modal or new screen):
  - Date picker (defaults to today, can select future dates).
  - Reason (multiline text, required).
  - "Submit" button.
- After submission, the excuse appears in the parent's attendance view for that date with a "Excuse submitted" label.
- Inserts to `absence_excuses` table.

### Parent Dashboard Integration

On `app/(parent)/dashboard.tsx`, the attendance card (built in Section 6) already shows today's status. Ensure it also shows:
- If absent and no excuse submitted: a warning prompt "Submit an excuse →".
- If excuse submitted: "Excuse submitted ✓" in `text-success`.

### Acceptance Criteria

- [ ] Teacher can mark attendance for all students on a given date
- [ ] "Mark All Present" fills all students as present in one tap
- [ ] Attendance saves correctly (upsert, one row per student per day)
- [ ] Teacher sees excuse submissions for each date
- [ ] Parent sees calendar month view with color-coded attendance
- [ ] Parent can submit absence excuses
- [ ] Excuse submission form validates (reason required)
- [ ] Parent dashboard shows excuse prompt when absent with no excuse
- [ ] All data respects RLS policies

---

# SECTION 9: Reporting & Analytics

> **Copy everything below this line into a new Claude Code session.**

---

## PROJECT CONTEXT

You are building "Hifdh Tracker" — a React Native / Expo / Supabase app for Qalam Institute. All data input modules are complete (assignments, behavior, attendance). Now you need reporting and analytics.

**Relevant tables:** `assignments`, `behavior_logs`, `attendance`, `students`.

**Chart library:** `react-native-gifted-charts` is already installed.

**Design notes:** Use the gold accent color (#C4983B) for progress-related visuals. Charts should feel clean and minimal — not dense dashboards. Generous spacing. Card-based layout.

---

## TASK: Build the reporting and analytics module for both teacher and parent views.

### Teacher Reports

#### Add to `app/(teacher)/students/[id].tsx` — Student Report Tab

Add a "Reports" tab (or section) to the student detail page:

1. **Date Range Selector:** "This Week" / "This Month" / "Custom Range" segmented control.

2. **Pass Rate Cards** — Three cards in a row, one per category:
   - New Lesson pass rate (e.g., "85%")
   - Previous Lesson pass rate
   - Revision pass rate
   - Each card shows: percentage in large `font-heading text-[28px]`, label below in `font-body text-[13px]`, and a small colored indicator (green if ≥70%, orange if 40-69%, red if <40%).

3. **Progress Trendline Chart**
   - Line chart (using `react-native-gifted-charts` LineChart).
   - X-axis: dates in the selected range.
   - Y-axis: pages completed per day (or pass rate over time).
   - Line color: `primary` (#3B8EAD).
   - Data points as small circles.
   - Show separate lines for each category (New Lesson, Previous, Revision) with a legend.

4. **Mistake/Pause Trend**
   - Bar chart showing average mistakes and pauses per week.
   - Mistakes bars: `error` color. Pause bars: `warning` color.
   - This helps teachers identify students who are struggling.

5. **Attendance Summary**
   - Simple stat row: total days, present count, absent count, late count, percentage present.
   - Color-coded progress bar showing the ratio.

6. **Behavior Summary**
   - Pie or donut chart: proportion of Very Good / Good / Needs Improvement.
   - Colors: success / accent / warning.

7. **Historical Comments**
   - Scrollable list of all teacher comments for the date range, sorted by date (newest first).
   - Each entry: date, category chip, comment text.

#### Teacher Dashboard: Class Overview

On `app/(teacher)/dashboard.tsx`, show aggregate stats:
- Today's attendance count (X/Y present).
- Students who haven't had assignments logged today (list of names as reminder).
- Class-wide pass rates for the week.
- Any pending excuse submissions that need attention.

### Parent Reports

Add a "Reports" tab or section to the parent's child view:

1. **Pass Rate Overview** — Same three-card layout as teacher view, but only for their child.

2. **Progress Trendline** — Same line chart as teacher view.

3. **Quran Progress Arc** — Larger version of the ProgressArc component showing Juz completion. Display: "[current_juz]/30 Juz" and surah name in `font-arabic`.

4. **Monthly Summary Card:**
   - Total pages completed this month.
   - Average daily pages.
   - Total assignments.
   - Pass rate.
   - Attendance percentage.
   - Behavior breakdown.

### Data Fetching Pattern

For reports, create a Supabase RPC function or use aggregation queries:

```sql
-- Example: Get pass rates for a student in a date range
CREATE OR REPLACE FUNCTION get_student_report(
  p_student_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS JSON AS $$
  SELECT json_build_object(
    'new_lesson', json_build_object(
      'total', COUNT(*) FILTER (WHERE category = 'new_lesson'),
      'passed', COUNT(*) FILTER (WHERE category = 'new_lesson' AND pass_status = 'pass'),
      'avg_pages', AVG(pages_completed) FILTER (WHERE category = 'new_lesson')
    ),
    'previous_lesson', json_build_object(
      'total', COUNT(*) FILTER (WHERE category = 'previous_lesson'),
      'passed', COUNT(*) FILTER (WHERE category = 'previous_lesson' AND pass_status = 'pass'),
      'avg_mistakes', AVG(mistakes) FILTER (WHERE category = 'previous_lesson')
    ),
    'revision', json_build_object(
      'total', COUNT(*) FILTER (WHERE category = 'revision'),
      'passed', COUNT(*) FILTER (WHERE category = 'revision' AND pass_status = 'pass'),
      'avg_mistakes', AVG(mistakes) FILTER (WHERE category = 'revision')
    )
  )
  FROM assignments
  WHERE student_id = p_student_id
    AND date BETWEEN p_start_date AND p_end_date;
$$ LANGUAGE sql SECURITY DEFINER;
```

Include this function (and similar ones for attendance and behavior) in the SQL output.

### Export / Print

Add a "Share Report" button on the teacher's student report view:
- Generates a summary text and shares it via the native share sheet (`expo-sharing` + `expo-print`).
- Format: plain text or simple HTML that can be printed.
- Include: student name, date range, pass rates, attendance summary, behavior summary.

```bash
npx expo install expo-sharing expo-print
```

### Acceptance Criteria

- [ ] Teacher student detail page has a Reports tab with all 7 report sections
- [ ] Pass rate cards calculate correctly and show color-coded indicators
- [ ] Line chart renders progress trendline with correct data points
- [ ] Bar chart shows mistake/pause trends
- [ ] Behavior pie/donut chart renders with correct proportions
- [ ] Historical comments list shows all comments for the date range
- [ ] Teacher dashboard shows class overview stats
- [ ] Parent sees pass rates, trendline, and monthly summary for their child
- [ ] Quran progress arc shows Juz progress with gold accent
- [ ] Date range selector changes all report data
- [ ] "Share Report" generates and shares a formatted summary
- [ ] Supabase RPC functions are created for efficient report queries

---

# SECTION 10: Real-Time Chat Messaging

> **Copy everything below this line into a new Claude Code session.**

---

## PROJECT CONTEXT

You are building "Hifdh Tracker" — a React Native / Expo / Supabase app for Qalam Institute. All tracking modules are complete. Now you need real-time messaging between parents and teachers/staff.

**Chat model:** Real-time, iMessage-style. Uses Supabase Realtime on the `messages` table.

**Relevant tables:** `conversations`, `conversation_participants`, `messages`, `profiles`.

**RLS:** Users can only see conversations they participate in. Users can only send messages to conversations they're part of.

---

## TASK: Build the real-time chat system — conversation list, message thread, new conversation creation, and staff directory.

### Shared Components

#### `components/chat/ConversationList.tsx`
- Lists all conversations for the current user.
- Each row: Avatar of the other participant(s), their name, last message preview (truncated), timestamp of last message, unread indicator (blue dot if there are unread messages).
- Sorted by most recent message.
- Pull-to-refresh.
- FAB to start a new conversation.

#### `components/chat/MessageBubble.tsx`
- Sent messages: aligned right, `bg-primary text-white rounded-2xl rounded-br-sm p-3`.
- Received messages: aligned left, `bg-white text-charcoal rounded-2xl rounded-bl-sm p-3 border border-gray-100`.
- Timestamp below bubble: `text-gray-400 text-[11px]`.
- Sender name above bubble (only in group chats or for clarity): `text-gray-600 text-[12px] font-body-medium`.

#### `components/chat/MessageInput.tsx`
- Text input bar fixed at bottom of screen (above keyboard).
- Input: `bg-gray-100 rounded-full px-4 h-10 flex-1 font-body`.
- Send button: `bg-primary rounded-full w-10 h-10` with send icon.
- Send button disabled (opacity-50) when input is empty.

### Screens

#### `app/(teacher)/messages/index.tsx` and `app/(parent)/messages/index.tsx`

Both use `ConversationList`. The teacher sees all their conversations. The parent sees their conversations with staff.

#### `app/(teacher)/messages/[conversationId].tsx` and `app/(parent)/messages/[conversationId].tsx`

Message thread screen:
1. Header: other participant's name + role badge (e.g., "Teacher" or "Parent of [Student]").
2. Scrollable message list using a FlatList (inverted, so newest at bottom).
3. MessageInput at bottom.
4. Load older messages on scroll-to-top (paginate with cursor-based pagination using `created_at`).

**Realtime subscription:**
```ts
supabase
  .channel(`conversation:${conversationId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`,
  }, (payload) => {
    // Append new message to the list
    // Mark as read if the screen is active
  })
  .subscribe();
```

**Sending a message:**
```ts
await supabase.from('messages').insert({
  conversation_id: conversationId,
  sender_id: profile.id,
  content: messageText,
});
```

**Marking messages as read:**
When the user opens a conversation, update all unread messages in that conversation where `sender_id != currentUserId`:
```ts
await supabase
  .from('messages')
  .update({ is_read: true })
  .eq('conversation_id', conversationId)
  .neq('sender_id', profile.id)
  .eq('is_read', false);
```

#### New Conversation

**For parents:** Show a "Contact Staff" screen listing all teachers/admins with their name, role, and availability status. Tapping a staff member either opens an existing conversation or creates a new one.

**For teachers:** Show a "New Message" screen where they can select from a list of parents (grouped by student name). Can also message other teachers.

**Creating a new conversation:**
1. Check if a 1-on-1 conversation already exists between these two users.
2. If yes, navigate to it.
3. If no, create a new `conversations` row, add both users to `conversation_participants`, then navigate to the new conversation.

### Staff Directory (Parent View)

On the parent's Messages screen, add a "Staff Directory" section above the conversation list (or as a separate tab):
- List all teachers and admin staff.
- Each entry: Avatar, name, role, availability summary (e.g., "Available Mon-Thu 3-5 PM").
- "Message" button next to each → opens or creates conversation.
- "Schedule Meeting" button → navigates to meeting scheduling (Section 11).

### Acceptance Criteria

- [ ] Conversation list shows all conversations with correct last message and timestamp
- [ ] Unread indicator (blue dot) shows on conversations with unread messages
- [ ] Message thread loads with correct bubble alignment (sent right, received left)
- [ ] New messages appear in real-time without manual refresh
- [ ] Sending a message works and appears immediately
- [ ] Messages marked as read when conversation is opened
- [ ] Creating a new conversation works (and reuses existing 1-on-1 if it exists)
- [ ] Parent staff directory shows all teachers with availability
- [ ] Keyboard handling: input stays above keyboard, messages scroll correctly
- [ ] Pagination loads older messages on scroll-to-top
- [ ] FlatList performs well with 100+ messages

---

# SECTION 11: Meeting Scheduling with Google Calendar

> **Copy everything below this line into a new Claude Code session.**

---

## PROJECT CONTEXT

You are building "Hifdh Tracker" — a React Native / Expo / Supabase app for Qalam Institute. Chat messaging is complete. Now you need meeting scheduling where parents book from teacher-defined time slots, with Google Calendar integration.

**Model:** Teachers define recurring weekly availability (e.g., "Monday 3-5 PM"). Parents see available slots and book 30-minute meetings. Bookings create a Google Calendar event for the teacher.

**Relevant tables:** `teacher_availability`, `meeting_bookings`, `profiles`.

**Google Calendar:** API already enabled in Google Cloud Console. Integration will run via a Supabase Edge Function (server-side) so credentials stay secure.

---

## TASK: Build the meeting scheduling system — teacher availability setup, parent booking flow, and Google Calendar Edge Function.

### Teacher Availability Setup

#### Add to `app/(teacher)/settings.tsx` — Availability Section

- A section titled "Meeting Availability".
- List of weekly availability slots the teacher has defined.
- Each slot shows: Day of week, start time, end time, active/inactive toggle.
- "Add Availability" button → opens a form:
  - Day of week picker (Sunday–Saturday).
  - Start time picker.
  - End time picker.
  - Save button → inserts to `teacher_availability`.
- Swipe to delete a slot.
- Toggle to activate/deactivate a slot without deleting.

### Parent Booking Flow

#### Add to parent Messages/Directory or its own screen

Create `app/(parent)/schedule-meeting.tsx`:

1. **Select Teacher** — list of teachers with their availability summaries.
2. **Select Date** — calendar view showing only dates that match the teacher's available days of the week. Gray out fully-booked dates.
3. **Select Time Slot** — for the selected date, show available 30-minute slots based on the teacher's availability. Gray out slots that are already booked (query `meeting_bookings` for that teacher and date).
4. **Confirm Booking** — show summary: Teacher name, date, time, student name. Optional notes field.
5. **"Book Meeting" button** → calls a Supabase Edge Function that:
   a. Inserts to `meeting_bookings`.
   b. Creates a Google Calendar event on the teacher's calendar.
   c. Returns the booking confirmation.

### Supabase Edge Function: `book-meeting`

Create a Supabase Edge Function at `supabase/functions/book-meeting/index.ts`:

```ts
// Input: { teacher_id, parent_id, student_id, date, start_time, end_time, notes }
// Process:
// 1. Validate the slot is still available (no double-booking).
// 2. Insert into meeting_bookings.
// 3. Use Google Calendar API (service account or OAuth) to create an event
//    on the teacher's calendar with:
//    - Title: "Parent Meeting — [Student Name]"
//    - Time: date + start/end time
//    - Description: Parent name, student name, notes
//    - Attendees: teacher email, parent email
// 4. Save the google_event_id back to the meeting_bookings row.
// 5. Return success with booking details.
```

**Google Calendar auth in Edge Function:**
- Use a Google service account with domain-wide delegation, OR
- Use OAuth refresh tokens stored in Supabase Vault (more complex but more standard).
- For v1, a service account with calendar write access is simplest.

Store the Google service account credentials as Supabase Edge Function secrets:
```bash
supabase secrets set GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

### Teacher Booking Management

On `app/(teacher)/settings.tsx`, add a "Upcoming Meetings" section:
- List of upcoming booked meetings sorted by date.
- Each entry: Parent name, student name, date, time.
- "Cancel" option → updates `meeting_bookings.status` to 'cancelled' and deletes the Google Calendar event.

### Parent Booking Management

On `app/(parent)/settings.tsx`, add a "My Meetings" section:
- List of upcoming meetings.
- "Cancel" option with confirmation (cancels and removes calendar event).

### Acceptance Criteria

- [ ] Teacher can add/edit/remove weekly availability slots
- [ ] Teacher can toggle slots active/inactive
- [ ] Parent sees available dates on the calendar based on teacher availability
- [ ] Parent sees available 30-minute time slots for a selected date
- [ ] Already-booked slots are grayed out
- [ ] Booking creates a row in `meeting_bookings`
- [ ] Supabase Edge Function creates a Google Calendar event
- [ ] Google Calendar event has correct title, time, description, attendees
- [ ] Teacher sees upcoming meetings list
- [ ] Cancellation updates booking status and deletes calendar event
- [ ] Double-booking is prevented (validation in Edge Function)

---

# SECTION 12: Push Notifications

> **Copy everything below this line into a new Claude Code session.**

---

## PROJECT CONTEXT

You are building "Hifdh Tracker" — a React Native / Expo / Supabase app for Qalam Institute. All features are built. Now wire up push notifications using Expo Push Notifications.

**Relevant table:** `push_tokens` (user_id, token, platform).

**Notification strategy:** "Light notifications" — focused on actionable events, not spammy.

---

## TASK: Set up push notification registration, token storage, and sending for key events.

### Client Side: Token Registration

Create `hooks/useNotifications.ts`:

1. On app launch (in root layout), check notification permissions.
2. If not granted, request permission via `expo-notifications`.
3. If granted, get the Expo push token via `Notifications.getExpoPushTokenAsync()`.
4. Save/upsert the token to the `push_tokens` table with the user's ID and platform (ios/android).
5. Set up notification received/response listeners.

Configure notification handler:
```ts
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

### Server Side: Sending Notifications

Create Supabase Edge Functions or database triggers for these notification events:

1. **New Assignment Logged** → Notify the parent(s) of the student.
   - Title: "New Assignment"
   - Body: "[Student name]'s assignment for [date] has been recorded."
   - Trigger: INSERT on `assignments` table.

2. **New Message** → Notify the recipient(s).
   - Title: "[Sender name]"
   - Body: Message preview (first 100 chars).
   - Trigger: INSERT on `messages` table.

3. **Meeting Booked** → Notify the teacher.
   - Title: "Meeting Scheduled"
   - Body: "[Parent name] booked a meeting on [date] at [time]."
   - Trigger: INSERT on `meeting_bookings` table.

4. **Attendance Marked Absent** → Notify the parent (if no excuse submitted).
   - Title: "Attendance Alert"
   - Body: "[Student name] was marked absent today."
   - Trigger: INSERT on `attendance` where status = 'absent'.

### Supabase Edge Function: `send-push-notification`

```ts
// Input: { user_id, title, body, data? }
// Process:
// 1. Fetch all push tokens for the user from push_tokens table.
// 2. Send via Expo Push API:
//    POST https://exp.host/--/api/v2/push/send
//    Body: { to: token, title, body, data, sound: 'default' }
// 3. Handle expired tokens (remove from push_tokens).
```

### Database Triggers

Create Postgres triggers that call the Edge Function via `pg_net` (or use Supabase Database Webhooks):

```sql
-- Example: Trigger on new assignment
CREATE OR REPLACE FUNCTION notify_parent_new_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Call Edge Function via pg_net or Supabase webhook
  -- to notify parent(s) of the student
  PERFORM net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-push-notification',
    headers := '{"Authorization": "Bearer SERVICE_ROLE_KEY", "Content-Type": "application/json"}',
    body := json_build_object(
      'student_id', NEW.student_id,
      'type', 'new_assignment',
      'date', NEW.date
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_assignment
  AFTER INSERT ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_parent_new_assignment();
```

### Notification Handling in App

When a user taps a notification, route them to the relevant screen:
- Assignment notification → Parent assignment detail.
- Message notification → Chat conversation.
- Meeting notification → Meeting details.

Use the `data` field in the push notification to include routing info:
```ts
{ screen: 'assignment', studentId: '...', date: '...' }
```

Handle in the notification response listener:
```ts
Notifications.addNotificationResponseReceivedListener((response) => {
  const data = response.notification.request.content.data;
  if (data.screen === 'assignment') {
    router.push(`/(parent)/assignments?date=${data.date}`);
  }
  // etc.
});
```

### Acceptance Criteria

- [ ] App requests notification permission on first launch
- [ ] Push token saved to `push_tokens` table
- [ ] Parent receives notification when teacher logs an assignment
- [ ] User receives notification for new chat messages (only when not in that conversation)
- [ ] Teacher receives notification when meeting is booked
- [ ] Parent receives notification when marked absent
- [ ] Tapping a notification navigates to the relevant screen
- [ ] Expired tokens are cleaned up
- [ ] Notifications have correct title, body, and sound

---

# SECTION 13: App Store & Play Store Deployment

> **Copy everything below this line into a new Claude Code session.**

---

## PROJECT CONTEXT

You are building "Hifdh Tracker" — a React Native / Expo app. All features are complete. Now configure EAS Build and submit to both app stores.

---

## TASK: Configure EAS Build, create production builds, and prepare all assets and metadata for App Store and Play Store submission.

### Step 1: Configure EAS

Create `eas.json` in the project root:

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "bundleIdentifier": "com.qalaminstitute.hifdhtracker"
      },
      "android": {
        "package": "com.qalaminstitute.hifdhtracker",
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "YOUR_APPLE_ID",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### Step 2: App Icons & Splash Screen

Generate required assets:
- **App icon:** 1024x1024 PNG (no transparency for iOS, transparency OK for Android adaptive icon).
- **Splash screen:** Simple screen with Qalam branding on `bg-offwhite`.
- **Adaptive icon (Android):** Foreground (logo) + background (solid `primary` color).

Update `app.json`:
```json
{
  "expo": {
    "icon": "./assets/images/icon.png",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#F8F8F8"
    },
    "ios": {
      "icon": "./assets/images/icon.png",
      "bundleIdentifier": "com.qalaminstitute.hifdhtracker",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "Used for profile photos",
        "NSPhotoLibraryUsageDescription": "Used for profile photos"
      }
    },
    "android": {
      "package": "com.qalaminstitute.hifdhtracker",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#3B8EAD"
      },
      "permissions": ["CAMERA", "READ_EXTERNAL_STORAGE"]
    }
  }
}
```

### Step 3: Build

```bash
# iOS production build
eas build --platform ios --profile production

# Android production build
eas build --platform android --profile production

# Or both at once
eas build --platform all --profile production
```

### Step 4: Submit

```bash
# Submit to App Store
eas submit --platform ios --profile production

# Submit to Google Play
eas submit --platform android --profile production
```

### Step 5: App Store Metadata

Prepare this information for both stores:

**App Name:** Hifdh Tracker
**Subtitle (iOS):** Quran Memorization Progress
**Category:** Education
**Description:**
> Hifdh Tracker helps Quran memorization (Hifdh) teachers and parents stay connected. Teachers record daily assignments, track student progress, and manage attendance. Parents monitor their child's performance, communicate with staff, and schedule meetings — all in one app.
>
> Features:
> • Daily assignment tracking with pass/fail, mistake counts, and teacher feedback
> • Behavior monitoring with historical trends
> • Attendance tracking with calendar views
> • Real-time messaging between parents and teachers
> • Meeting scheduling with Google Calendar integration
> • Progress reports with charts and analytics
> • Push notifications for important updates

**Keywords (iOS):** quran, hifdh, memorization, islamic, education, teacher, parent, tracking, progress, attendance

**Privacy Policy URL:** (you'll need to create one — required for both stores)

**Screenshots:** Generate screenshots on:
- iPhone 6.7" (iPhone 15 Pro Max)
- iPhone 6.5" (iPhone 11 Pro Max)
- iPad 12.9" (if targeting iPad)
- Android phone (any common resolution)

### Step 6: Pre-Launch Checklist

- [ ] All environment variables are set in EAS secrets: `eas secret:create`
- [ ] Supabase project is on a paid plan (free tier has limits)
- [ ] Google Calendar service account is configured for production
- [ ] Privacy policy page is live at a public URL
- [ ] App icons and splash screen look correct
- [ ] Test the production build on a real device before submitting
- [ ] RLS policies tested with production-like data
- [ ] No console.log statements left in production code

### Acceptance Criteria

- [ ] `eas build` succeeds for both iOS and Android
- [ ] Production builds install and work correctly on real devices
- [ ] `eas submit` successfully uploads to both stores
- [ ] App Store Connect shows the build ready for review
- [ ] Google Play Console shows the build ready for review
- [ ] All metadata (description, screenshots, etc.) is populated
- [ ] App icons render correctly on both platforms

---

# APPENDIX A: Complete TypeScript Types

Create this as `lib/types.ts` during Section 1 and reference it throughout:

```ts
// Database types — keep in sync with Supabase schema

export type UserRole = 'admin' | 'teacher' | 'parent';
export type AssignmentCategory = 'new_lesson' | 'previous_lesson' | 'revision';
export type PassStatus = 'pass' | 'not_pass';
export type BehaviorRating = 'very_good' | 'good' | 'needs_improvement';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'left_early';
export type InviteStatus = 'pending' | 'used' | 'expired';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  full_name: string;
  arabic_name: string | null;
  date_of_birth: string | null;
  current_juz: number;
  current_surah: string | null;
  enrollment_date: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParentStudent {
  id: string;
  parent_id: string;
  student_id: string;
  relationship: string;
  created_at: string;
}

export interface InviteCode {
  id: string;
  code: string;
  student_id: string;
  created_by: string;
  status: InviteStatus;
  used_by: string | null;
  expires_at: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  student_id: string;
  teacher_id: string;
  date: string;
  category: AssignmentCategory;
  pass_status: PassStatus | null;
  mistakes: number;
  pauses: number;
  pages_completed: number;
  recited_to: string | null;
  comments: string | null;
  next_assignment: string | null;
  parent_reviewed: boolean;
  parent_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  students?: Student;
}

export interface BehaviorLog {
  id: string;
  student_id: string;
  teacher_id: string;
  date: string;
  rating: BehaviorRating;
  notes: string | null;
  created_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  teacher_id: string;
  date: string;
  status: AttendanceStatus;
  created_at: string;
  updated_at: string;
}

export interface AbsenceExcuse {
  id: string;
  student_id: string;
  parent_id: string;
  date: string;
  reason: string;
  submitted_at: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  // Joined
  sender?: Profile;
}

export interface TeacherAvailability {
  id: string;
  teacher_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export interface MeetingBooking {
  id: string;
  teacher_id: string;
  parent_id: string;
  student_id: string;
  date: string;
  start_time: string;
  end_time: string;
  google_event_id: string | null;
  notes: string | null;
  status: 'confirmed' | 'cancelled';
  created_at: string;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android';
  created_at: string;
}
```

---

# APPENDIX B: Design System Quick Reference Card

Copy this block into any Claude Code session where you're building UI:

```
═══════════════════════════════════════════════════════
HIFDH TRACKER — DESIGN QUICK REFERENCE
═══════════════════════════════════════════════════════

COLORS
  Primary:    bg-primary (#3B8EAD)      text-primary
  Dark:       bg-primary-dark (#2A6F8A)  text-primary-dark
  Light:      bg-primary-light (#E6F2F7) text-primary
  50:         bg-primary-50 (#F0F7FA)
  Coral:      bg-coral (#D46B5A)         text-white
  Gold:       bg-accent (#C4983B)        text-white
  Gold Light: bg-accent-light (#F5EDD6)  text-accent
  Background: bg-offwhite (#F8F8F8)
  Cards:      bg-white
  Text:       text-charcoal (#2C2C2C)
  Secondary:  text-gray-600 (#6B6B6B)
  Hint:       text-gray-400 (#A0A0A0)
  Success:    text-success (#2D7A4F)     bg-success/15
  Warning:    text-warning (#D4922A)     bg-warning/15
  Error:      text-error (#C0392B)       bg-error/15

TYPOGRAPHY
  Screen title:  font-heading text-[24px] text-charcoal
  Section head:  font-body-semibold text-[18px] text-charcoal
  Body:          font-body text-[15px] text-charcoal
  Label:         font-body-medium text-[13px] text-gray-600
  Hint:          font-body text-[12px] text-gray-400
  Arabic:        font-arabic / font-arabic-bold

COMPONENTS
  Card:          bg-white rounded-card p-4 shadow-sm
  Button (pri):  bg-primary text-white rounded-button h-12
  Button (sec):  bg-primary-light text-primary rounded-button h-12
  Button (ghost): border border-gray-200 text-charcoal rounded-button h-12
  Input:         bg-white border border-gray-200 rounded-button h-12 px-4
  Chip:          rounded-chip px-3 py-1 text-[13px]

STATUS CHIPS
  pass/present/very_good: bg-success/15 text-success
  not_pass/absent:        bg-error/15 text-error
  good:                   bg-accent-light text-accent
  needs_improvement/late: bg-warning/15 text-warning

SPACING
  Screen:   px-4         Card:      p-4
  Gap:      gap-3        Section:   mb-6
  Min touch: h-12 (48px)

ISLAMIC TOUCHES (use sparingly)
  • Geometric divider: thin line + small SVG star at center
  • بسم الله: font-arabic text-gray-400 text-[13px]
  • Card ornament: 3px blue→gold gradient line at card top
  • Progress arc: gold accent circular SVG arc
  • Never: heavy patterns, gold overuse, calligraphy for UI labels
═══════════════════════════════════════════════════════
```

---

# APPENDIX C: Environment Variables Reference

```env
# === CLIENT-SIDE (in .env.local, prefixed with EXPO_PUBLIC_) ===
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...   # Publishable key from Supabase dashboard

# === SERVER-SIDE (Supabase Edge Function secrets — set via `supabase secrets set`) ===
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...             # Secret key — NEVER in client code
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# === EAS Build Secrets ===
# Set via: eas secret:create --name VARIABLE_NAME --value "value"
# These are injected at build time and available as process.env
```

---

# APPENDIX D: Section Dependency Map

```
Section 0: Pre-Dev Setup (manual)
    ↓
Section 1: Project Init ──────────────────────────────┐
    ↓                                                  │
Section 2: Supabase DB & Auth Setup                    │
    ↓                                                  │
Section 3: Authentication Flows ◄──────────────────────┘
    ↓
Section 4: Navigation & Shared Components
    ↓
    ├── Section 5: Assignments (Teacher) ─── Section 6: Assignments (Parent)
    │
    ├── Section 7: Behavior Log
    │
    ├── Section 8: Attendance
    │
    ├── Section 9: Reporting & Analytics (depends on 5-8 being complete)
    │
    ├── Section 10: Real-Time Chat
    │
    ├── Section 11: Meeting Scheduling
    │
    └── Section 12: Push Notifications (depends on 10-11 for notification triggers)
         ↓
    Section 13: App Store Deployment (do last)
```

Sections 5–11 can be done in parallel after Section 4, but the recommended order is as listed. Section 9 (Reporting) needs data from Sections 5–8 to be meaningful. Section 12 (Notifications) needs Sections 10–11 for message and meeting triggers.
