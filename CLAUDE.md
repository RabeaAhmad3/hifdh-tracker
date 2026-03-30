# CLAUDE.md — Hifdh Tracker

Quran memorization tracking app for Qalam Institute. Teachers record assignments/behavior/attendance, parents monitor progress and communicate with staff. Single-tenant (Qalam only). iOS + Android via EAS Build.

## Tech Stack

React Native · Expo SDK 52+ (managed) · Expo Router · NativeWind v4 · Supabase · TypeScript

## Commands

```bash
npx expo start                    # Dev server
npx expo start --clear            # Dev server (cache cleared)
npx tsc --noEmit                  # Type check — ALWAYS run before committing
sb db push                        # Push Supabase migrations (uses project-scoped auth, no login needed)
eas build --platform all          # Production builds
eas submit --platform all         # Store submission
```

## Git Rules

- **IMPORTANT: All work on `dev` branch. NEVER commit to or push `main`.**
- Verify before every session: `git branch --show-current`
- Commit messages: `"[Section X] Description of change"`
- PR from `dev` → `main` only when a section is stable and tested.

## Project Structure

```
app/              Expo Router routes: (auth)/, (teacher)/, (parent)/
components/ui/    Design system: Button, Card, Input, StatusChip, Avatar, SectionDivider
components/       Domain components: assignments/, attendance/, behavior/, chat/, reports/
lib/              supabase.ts, auth.tsx, types.ts, constants.ts
hooks/            useAuth, useStudents, useAssignments, useMessages
```

## Auth Model

- **Admin** creates teacher accounts (Supabase dashboard).
- **Teacher** generates 8-char invite codes bound to a specific student.
- **Parent** signs up with email + password + invite code → links to student.
- One parent per student. A parent can have multiple children (multiple codes).
- Sessions persist via `expo-secure-store`. Role-based routing in `app/_layout.tsx`.

## Design System — Qalam Brand

For full component patterns, typography, and spacing: `@docs/design-system.md`

**Critical rules Claude must remember:**
- Screen bg: `bg-offwhite`. Cards: `bg-white rounded-card shadow-sm`.
- Primary actions: `bg-primary` (#3B8EAD). Status chips use semantic colors.
- Arabic text ALWAYS uses `font-arabic` (Amiri). Never all-caps on Arabic.
- Minimum tappable target: `h-12` (48px).
- **IMPORTANT: We use NativeWind v4 + Tailwind v3** (JS config). NOT v5/v4 CSS-first. Never use `react-native-css` component wrappers or `@tailwindcss/postcss`.
- Gold accent (`bg-accent` #C4983B) for progress arcs and celebrations only — not a primary color.
- Islamic touches are SUBTLE: thin dividers, small بسم الله, 3px gradient ornaments. Never heavy patterns behind text.

## Database Conventions

- All tables: UUID PKs, `created_at`, RLS enabled on every table.
- **IMPORTANT: Parents can only see data for their linked students.** Enforced by RLS via `parent_students` join table.
- Unique constraints prevent duplicates: one assignment per student/category/day, one behavior per student/day, one attendance per student/day.
- Realtime enabled on `messages` and `assignments`.
- Never `select('*')` — always specify columns. Paginate all list queries.

## Supabase Client

```ts
import { supabase } from '@/lib/supabase';  // Always use this — uses SecureStore
```

## Installed Skills & Plugins

```bash
# Install before starting Section 1
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-native-skills
npx skills add supabase/agent-skills
npx skills add https://github.com/callstackincubator/agent-skills --skill react-native-best-practices
npx skills add https://github.com/expo/skills --skill expo-deployment
```

| Skill | When |
|-------|------|
| superpowers | Always (auto-triggers: brainstorm → plan → implement → review) |
| vercel-react-native-skills | Any UI work: lists, animations, navigation, safe area |
| supabase/postgres-best-practices | Schema design, queries, RLS, indexes (Sections 2, 9) |
| react-native-best-practices | Perf issues, pre-deployment optimization (Section 13) |
| expo-deployment | EAS Build and store submission (Section 13) |

**DO NOT install** `expo-tailwind-setup` (NativeWind v5 — conflicts with our v4 setup) or `building-native-ui` (says "Tailwind not supported" — conflicts with NativeWind).

## Hooks

Add to `.claude/settings.json` for automatic type checking after edits:

```json
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
```

## Workflow

**Superpowers handles the workflow.** Let it auto-trigger brainstorming, planning, subagent-driven development, and code review.

**Project-specific rules:**
- TDD is mandatory for business logic and database functions (invite codes, assignment upserts, report calculations, booking slots). UI component tests are welcome but never block progress — if test infra setup gets finicky, skip and move on.
- After ANY correction: update `tasks/lessons.md` with the pattern and a rule to prevent it.
- After two failed attempts at the same fix: `/clear` and restart with a better prompt.
- Bug reports: just fix it. Don't ask for hand-holding.
- **IMPORTANT — when compacting, preserve: current section number, list of modified files, and test status.**

## Context Management

- At 50% context: `/compact` (include the preservation note above).
- At 70%+: finish current task, commit, `/clear`.
- At 90%+: `/clear` is mandatory.
- Use subagents for file exploration and research to keep main context clean.

## Implementation Sections

The build is organized into 13 sections in `docs/hifdh-implementation-guide.md`. **DO NOT read the full guide — it is 2000+ lines.** The user will copy-paste the relevant section into each session as a self-contained prompt.

| # | Section | Status |
|---|---------|--------|
| 0 | Pre-Dev Setup (manual) | ▢ |
| 1 | Project Init & Config | ▢ |
| 2 | Supabase DB & Auth Setup | ▢ |
| 3 | Authentication Flows | ▢ |
| 4 | Navigation & Shared Components | ▢ |
| 5 | Assignments — Teacher Input | ▢ |
| 6 | Assignments — Parent View | ▢ |
| 7 | Behavior Log | ▢ |
| 8 | Attendance | ▢ |
| 9 | Reports & Analytics | ▢ |
| 10 | Real-Time Chat | ▢ |
| 11 | Meeting Scheduling | ▢ |
| 12 | Push Notifications | ▢ |
| 13 | App Store Deployment | ▢ |

## Session Checklist

1. `git branch --show-current` → must be `dev`
2. Check `tasks/lessons.md`
3. The user will paste the current section's prompt — read it carefully
4. `git log --oneline -5`
5. For UI work, read `@docs/design-system.md`
6. Let Superpowers guide the workflow
7. Verify: `npx tsc --noEmit`, app runs on simulator
8. Commit to `dev`: `"[Section X] Description"`
9. **Never push to `main`**

## Important Files

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root layout — fonts, auth provider, routing gate |
| `lib/supabase.ts` | Supabase client (SecureStore adapter) |
| `lib/auth.tsx` | Auth context — session, profile, role |
| `lib/types.ts` | TypeScript interfaces (mirrors DB schema) |
| `tailwind.config.js` | Qalam design tokens — colors, fonts, radii |
| `docs/design-system.md` | Design reference — safe to @import for UI work |
| `docs/hifdh-implementation-guide.md` | Full build guide — USER copy-pastes sections, Claude does NOT read this |
| `tasks/todo.md` | Current task tracking |
| `tasks/lessons.md` | Lessons from corrections |