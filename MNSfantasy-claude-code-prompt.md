# MNSfantasy — NCAA Men's Tournament Fantasy App
## Comprehensive Claude Code Build Prompt
### Subdomain: `ncaa.mnsfantasy.com`

---

## PLATFORM ARCHITECTURE CONTEXT

**MNSfantasy.com** is a multi-game fantasy sports platform. The main domain (`mnsfantasy.com`) serves as the platform landing page — a marketing hub that showcases all active and upcoming fantasy games. Each individual game lives on its own subdomain and is its own independent Vercel deployment.

**Planned subdomain structure:**
| Subdomain | Game |
|---|---|
| `ncaa.mnsfantasy.com` | NCAA Men's March Madness ← **this build** |
| `wncaa.mnsfantasy.com` | NCAA Women's Tournament |
| `pga.mnsfantasy.com` | PGA Tour events (Masters, US Open, etc.) |
| `nfl.mnsfantasy.com` | NFL Playoffs / Draft |
| *(more to come)* | |

**Shared infrastructure across all games:**
- **Neon Postgres** — single database, all games share it. Use a `game_slug` column on the `leagues` table (e.g. `'ncaa-mens-2025'`) to namespace data.
- **Clerk Auth** — single Clerk application. A user signs up once at any MNSfantasy subdomain and has access to all games. Use Clerk's `allowedRedirectOrigins` to support all subdomains.
- **Resend** — single sending domain `mnsfantasy.com`. All game emails come from `updates@mnsfantasy.com`.
- **Design system** — all game apps share the same Tailwind config, color tokens, and fonts. They feel like one platform.

**This build (`ncaa.mnsfantasy.com`) must be architected so that future games can reuse:**
- The Drizzle schema structure (leagues, members, rosters pattern)
- The Clerk auth flow
- The email templates (parameterized by game)
- The standings computation pattern
- The admin panel patterns

Build this with that reusability in mind. Comment shared patterns clearly with `// PLATFORM PATTERN — reuse in future game apps`.

---

## MISSION

Build a full-stack, production-ready NCAA Men's Tournament Fantasy web app deployed at **`ncaa.mnsfantasy.com`**. This is a one-shot build. Every decision below is final. Do not ask for clarification — implement exactly as specified. If something isn't specified, use best judgment consistent with the design direction and stack choices.

---

## TECH STACK (NON-NEGOTIABLE)

| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Routing | React Router v6 |
| Auth | Clerk |
| Database | Neon (serverless Postgres) |
| ORM | Drizzle ORM |
| Styling | Tailwind CSS v3 + custom CSS variables |
| Animation | Framer Motion |
| Email | Resend |
| API Routes | Express (Node server) or Hono on Cloudflare Workers — choose Hono for edge performance |
| Stats | SportsRadar College Basketball API (primary) |
| Deployment | Vercel (frontend) + Vercel serverless functions for API |
| CSV Parsing | papaparse |
| Date/Time | date-fns |
| Sounds | Howler.js (subtle micro-sounds) |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| Notifications | Sonner (toast) |

---

## PROJECT STRUCTURE

```
mnsfantasy/
├── src/
│   ├── components/
│   │   ├── ui/                    # Shared design system components
│   │   ├── layout/                # AppShell, Header, Footer, Nav
│   │   ├── league/                # League-specific components
│   │   ├── roster/                # Roster selection + display components
│   │   ├── bracket/               # Bracket visualization component
│   │   ├── player/                # Player card components
│   │   └── email/                 # React Email templates
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Dashboard.tsx
│   │   ├── CreateLeague.tsx
│   │   ├── JoinLeague.tsx
│   │   ├── LeagueHome.tsx
│   │   ├── PickRoster.tsx
│   │   ├── MemberRoster.tsx
│   │   ├── AdminPanel.tsx
│   │   └── NotFound.tsx
│   ├── hooks/                     # Custom hooks
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts          # Drizzle schema
│   │   │   └── index.ts           # Drizzle client
│   │   ├── clerk.ts
│   │   ├── resend.ts
│   │   ├── sportsradar.ts         # Stats API client
│   │   └── utils.ts
│   ├── store/                     # Zustand global state
│   ├── types/                     # Shared TypeScript types
│   └── main.tsx
├── api/                           # Vercel serverless functions
│   ├── leagues/
│   ├── players/
│   ├── rosters/
│   ├── stats/
│   ├── email/
│   └── admin/
├── drizzle/
│   └── migrations/
├── drizzle.config.ts
├── .env.example
└── package.json
```

---

## ENVIRONMENT VARIABLES

Create `.env.example` with all of these:

```
# Clerk
VITE_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Neon
DATABASE_URL=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=updates@mnsfantasy.com

# SportsRadar
SPORTSRADAR_API_KEY=
SPORTSRADAR_BASE_URL=https://api.sportsradar.com/ncaamb/trial/v8/en

# App subdomain
VITE_APP_URL=https://ncaa.mnsfantasy.com
VITE_PLATFORM_URL=https://mnsfantasy.com

# Game identifier (namespaces leagues in shared DB)
VITE_GAME_SLUG=ncaa-mens-2025
GAME_SLUG=ncaa-mens-2025

# Roster lock
ROSTER_LOCK_DATE=2025-03-20T12:00:00-05:00

# Tournament Year
TOURNAMENT_YEAR=2025

# Admin users (Clerk user IDs, comma-separated)
ADMIN_USER_IDS=
```

---

## DATABASE SCHEMA (Drizzle + Neon Postgres)

Define the full schema in `src/lib/db/schema.ts`:

```typescript
import { pgTable, text, integer, boolean, timestamp, uuid, decimal, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const leagueVisibilityEnum = pgEnum('league_visibility', ['public', 'private']);
export const tournamentRoundEnum = pgEnum('tournament_round', [
  'round_of_64', 'round_of_32', 'sweet_16', 'elite_8', 'final_four', 'championship'
]);

// Users (mirrors Clerk, minimal local data)
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// NCAA Tournament Teams
export const ncaaTeams = pgTable('ncaa_teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  shortName: text('short_name').notNull(),
  seed: integer('seed').notNull(), // 1-16
  region: text('region').notNull(), // East, West, South, Midwest
  isEliminated: boolean('is_eliminated').default(false).notNull(),
  eliminatedInRound: text('eliminated_in_round'),
  sportRadarTeamId: text('sportsradar_team_id'),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Players
export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => ncaaTeams.id).notNull(),
  name: text('name').notNull(),
  jersey: text('jersey'),
  position: text('position'),
  avgPts: decimal('avg_pts', { precision: 5, scale: 1 }).notNull().default('0'),
  avgReb: decimal('avg_reb', { precision: 5, scale: 1 }).notNull().default('0'),
  avgAst: decimal('avg_ast', { precision: 5, scale: 1 }).notNull().default('0'),
  sportRadarPlayerId: text('sportsradar_player_id'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tournament game stats (accumulated)
export const playerTournamentStats = pgTable('player_tournament_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id').references(() => players.id).notNull(),
  round: text('round').notNull(),
  gameDate: timestamp('game_date').notNull(),
  pts: integer('pts').default(0).notNull(),
  reb: integer('reb').default(0).notNull(),
  ast: integer('ast').default(0).notNull(),
  sportRadarGameId: text('sportsradar_game_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Leagues
export const leagues = pgTable('leagues', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  adminId: text('admin_id').references(() => users.id).notNull(),
  visibility: leagueVisibilityEnum('visibility').default('private').notNull(),
  buyInAmount: decimal('buy_in_amount', { precision: 10, scale: 2 }).default('0'),
  buyInCurrency: text('buy_in_currency').default('USD'), // USD, ETH, BTC
  cryptoWalletAddress: text('crypto_wallet_address'),
  cryptoWalletType: text('crypto_wallet_type'), // 'eth' | 'btc' | null
  gameSlug: text('game_slug').notNull().default('ncaa-mens-2025'), // PLATFORM PATTERN — namespace all leagues by game
  inviteCode: text('invite_code').notNull().unique(),
  isLocked: boolean('is_locked').default(false).notNull(), // true after roster lock
  maxMembers: integer('max_members').default(50),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// League Members
export const leagueMembers = pgTable('league_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  leagueId: uuid('league_id').references(() => leagues.id).notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  teamName: text('team_name').notNull(),
  rosterLocked: boolean('roster_locked').default(false).notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

// Rosters (junction: league member → players)
export const rosters = pgTable('rosters', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').references(() => leagueMembers.id).notNull(),
  playerId: uuid('player_id').references(() => players.id).notNull(),
  pickedAt: timestamp('picked_at').defaultNow().notNull(),
});

// Email log (prevent duplicate sends)
export const emailLog = pgTable('email_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  leagueId: uuid('league_id').references(() => leagues.id).notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  emailType: text('email_type').notNull(), // 'morning_update', 'welcome', 'roster_locked'
  sentAt: timestamp('sent_at').defaultNow().notNull(),
});

// PLATFORM PATTERN — reuse in all game apps and mnsfantasy.com root
// Global marketing opt-in (one row per user, set at first login on ANY subdomain)
export const marketingSubscribers = pgTable('marketing_subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id).notNull().unique(),
  email: text('email').notNull(),
  globalOptIn: boolean('global_opt_in').default(false).notNull(),
  // Global preference flags (managed at mnsfantasy.com/preferences)
  prefNewGames: boolean('pref_new_games').default(true).notNull(),       // new game launch announcements
  prefLeagueInvites: boolean('pref_league_invites').default(true).notNull(), // someone invites them
  prefPlatformNews: boolean('pref_platform_news').default(true).notNull(),   // platform-wide news
  prefMnsInsights: boolean('pref_mns_insights').default(false).notNull(),    // MoneyNeverSleeps.app cross-promo (separate consent)
  source: text('source').notNull(), // e.g. 'ncaa-mens-2025', 'mnsfantasy-landing'
  optedInAt: timestamp('opted_in_at'),
  unsubscribedAt: timestamp('unsubscribed_at'), // master unsub
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// PLATFORM PATTERN — per-game email preferences (opt-out granularity per subdomain)
// One row per user per game_slug. Only created when user changes from default.
export const marketingGamePrefs = pgTable('marketing_game_prefs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id).notNull(),
  gameSlug: text('game_slug').notNull(), // e.g. 'ncaa-mens-2025'
  // Per-game email types — false = opted out of that type for this game
  prefMorningUpdates: boolean('pref_morning_updates').default(true).notNull(),
  prefEliminationAlerts: boolean('pref_elimination_alerts').default(true).notNull(),
  prefScoreAlerts: boolean('pref_score_alerts').default(true).notNull(),
  prefRosterReminders: boolean('pref_roster_reminders').default(true).notNull(),
  optedOutOfGame: boolean('opted_out_of_game').default(false).notNull(), // full unsub from this game only
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
// Unique constraint: one prefs row per user per game
// Add index: CREATE UNIQUE INDEX ON marketing_game_prefs(user_id, game_slug);
```

Generate migrations with `drizzle-kit generate` and run them via `drizzle-kit push`.

---

## ROSTER RULES (CRITICAL — ENFORCE EVERYWHERE)

A fantasy team consists of exactly **10 players** across 4 seed tiers:

| Seed Tier | Seeds | Picks Required |
|---|---|---|
| Tier 1 | Seeds 1–4 | **4 players** |
| Tier 2 | Seeds 5–8 | **3 players** |
| Tier 3 | Seeds 9–12 | **2 players** |
| Tier 4 | Seeds 13–16 | **1 player** |

- Multiple league members CAN pick the same player (not a draft).
- Members set their own **team name** when joining.
- Roster lock: **Thursday, March 20, 2025 at 12:00 PM Eastern** (first round of 64 tip-off). This is stored as `ROSTER_LOCK_DATE` env var so it's configurable for future years.
- **Play-in games (Tue/Wed) are completely ignored** — the app only tracks the Round of 64 onward. Seeds 1–16 are already finalized before Thursday.
- After lock: roster picks are frozen. No changes allowed. Show visual lock indicator.

---

## SCORING

- **Total score = sum of all tournament pts + reb + ast** across all games while the player's team is still alive.
- A player's stats stop accumulating the moment their team is eliminated.
- Eliminated players show as "ELIMINATED" with a visual strikethrough/dim effect.
- Tiebreaker: most total points scored (pts category) if overall totals are tied.
- Display three sub-columns per member: PTS | REB | AST | **TOTAL**

---

## STATS INTEGRATION — SportsRadar

### Setup
- Use SportsRadar NCAAMB (NCAA Men's Basketball) API v8.
- Endpoint for tournament schedule: `GET /tournaments/{year}/schedule.json`
- Endpoint for game summary: `GET /games/{game_id}/summary.json`
- Endpoint for team roster: `GET /teams/{team_id}/profile.json`

### Stats Sync Flow
1. Create a Vercel cron job (`vercel.json` cron) that runs at **7:00 AM ET every day** during the tournament (March 20 – April 7).
2. The cron hits `/api/stats/sync` which:
   a. Fetches yesterday's completed tournament games from SportsRadar.
   b. For each game, fetches the box score.
   c. Upserts stats into `player_tournament_stats` table.
   d. Checks if a team was eliminated (loser of each game) and marks `ncaa_teams.is_eliminated = true`.
   e. After sync completes, triggers morning email send to all league members.

### Fallback: Manual Stats Upload
- Admin panel has a "Manual Stats Upload" section.
- Admin can upload a CSV with columns: `player_name, team_name, game_date, pts, reb, ast`
- This upserts into `player_tournament_stats`.
- Also has a manual "Mark Team Eliminated" UI — dropdown of remaining teams, button to eliminate.

---

## CSV IMPORT FORMAT (Player Roster Upload)

Admin uploads the initial player pool via CSV. Format:

```
team_name,seed,region,player_name,jersey,position,avg_pts,avg_reb,avg_ast
Duke,1,East,Cooper Flagg,2,F,17.2,8.1,4.3
...
```

Parsing logic:
1. Parse CSV with papaparse.
2. For each row, upsert into `ncaa_teams` (by team_name + seed), then upsert into `players`.
3. Show a preview table before confirming the upload.
4. After upload show: X teams, Y players imported.

---

## PAGES & ROUTES

### `/` — Landing Page
- Dark, animated hero. App logo + tagline: **"Pick Smart. Win Big. March Never Sleeps."**
- Brief explanation of how the game works (3 steps: join a league → pick your 10 → watch the madness).
- CTA buttons: "Create a League" and "Join a League".
- Subtle footer: *"MNSfantasy is powered by [MoneyNeverSleeps.app](https://moneyneversleeps.app)"* — clickable, opens in new tab.
- Small nav link in header: `← All Games` linking back to `mnsfantasy.com` (the platform hub).
- Show a live/demo league standings preview widget if tournament is active.

### `/sign-in` and `/sign-up` — Clerk Auth Pages
- Use Clerk's `<SignIn />` and `<SignUp />` components.
- Wrap in the app's dark theme shell (do not use Clerk's hosted pages).
- After sign-in, redirect to `/dashboard`.
- On first sign-up, upsert user record into `users` table.

### `/dashboard` — My Leagues
- List all leagues the user is a member of, plus leagues they admin.
- Each league card shows: league name, member count, user's current rank, user's total score, roster lock status.
- "Create League" button.
- "Join League" input (paste invite code or URL).
- If tournament hasn't started: countdown timer to roster lock.

### `/leagues/create` — Create League
Form fields:
- **League Name** (required, 3–50 chars)
- **Your Team Name** (required, 2–30 chars) — the admin's own team
- **Visibility** — toggle: Public / Private
- **Buy-In Amount** — numeric input, defaults to 0
- **Buy-In Currency** — select: USD / ETH / BTC (only shown if buy-in > 0)
- **Crypto Wallet Address** — text input (only shown if ETH or BTC selected), with a small tooltip: *"Optional: share your wallet so members can send their buy-in directly. MNSfantasy does not handle payments."*
- **Max Members** — number input (default 50, max 500)

On submit:
1. Generate a unique `invite_code` (nanoid, 8 chars, uppercase).
2. Create league record.
3. Create `league_members` record for admin.
4. Redirect to `/leagues/{id}`.

Show the shareable invite URL prominently: `https://mnsfantasy.com/join/{invite_code}` with a one-click copy button.

### `/join/:inviteCode` — Join League
- Publicly accessible (no auth wall on the URL itself, but requires sign-in to complete join).
- Show league name, admin name, member count, buy-in info, crypto wallet if present.
- If buy-in > 0 show: *"Buy-in: $X USD"* or *"Buy-in: X ETH — send to {wallet}"*.
- **Team Name** input for the joining user.
- "Join League" button.
- On join: create `league_members` record, redirect to `/leagues/{id}/pick`.

### `/leagues/:id` — League Home (Standings)
This is the primary view during the tournament. Show:

**Header bar:** League name | Member count | Lock status badge

**Standings table** (sortable by total, pts, reb, ast):
| Rank | Team Name | Player Count | PTS | REB | AST | TOTAL | 🏆 |
- Each row is clickable → goes to that member's roster page.
- Eliminated player count shown as: `10 picks (3 eliminated)`.
- Highlight the current user's row.
- "Your Roster" sticky button if roster not yet locked.

**League Info sidebar/drawer** (mobile: expandable):
- Buy-in info + crypto wallet address (if set), with QR code for crypto address.
- Invite link + copy button.
- Admin controls (if current user is admin): lock override, stat sync trigger.

**Today's Games** section: show games happening today where members have players active.

### `/leagues/:id/pick` — Roster Selection
This is the most complex UI. Full-screen pick interface, mobile-first.

Layout: 4 seed tier sections, each showing available players in that tier.

**Top sticky bar:** Shows current pick counts: `Tier 1: 2/4 | Tier 2: 1/3 | Tier 3: 0/2 | Tier 4: 0/1` with color-coded progress.

**Player card** (per player in list):
- Player name + jersey number
- Team name + seed badge
- Region badge
- Season avg: PTS / REB / AST
- "Projected score" = avg_pts + avg_reb + avg_ast (show as a single number with a subtle label)
- Pick button (green glow when selected, disabled style when tier is full)

**Seed tier sections:**
- Clear tier headers: `TIER 1 — Seeds 1–4 (Pick 4)`, etc.
- Sort players within each tier by projected score descending by default.
- Filter bar: filter by team name or region within a tier.
- Selected players show a neon-bordered selected state.

**Bottom sticky bar (mobile):**
- "My Picks: X/10" progress
- Preview of picks so far (tiny player name chips, color-coded by tier)
- "Confirm Roster" button (disabled until all 10 picks made, glows green when complete)

**Confirmation modal:**
- Show all 10 picks organized by tier.
- Show projected total score.
- Warning: *"Once confirmed, your roster cannot be changed after {lock_date}."*
- "Confirm" button.

After confirming:
- Show a confetti animation + success toast.
- Redirect to `/leagues/{id}`.

**Locked state:** If after roster lock, show read-only view of their picks with locked badge.

### `/leagues/:id/roster/:memberId` — Member Roster View
Two views toggled by a tab: **Roster View** | **Bracket View**

**Roster View:**
- Player cards for all 10 picks, grouped by seed tier.
- Each card shows: current tournament pts + reb + ast + total (live).
- Eliminated players shown dimmed with "ELIMINATED — Round X" badge.
- Running total at the bottom.

**Bracket View:**
- Visual bracket showing only the member's remaining players' paths through the tournament.
- Each bracket slot shows: team name vs opponent, with the member's player(s) highlighted.
- Eliminated teams/players shown in muted style.
- This does not need to show the full 68-team bracket — just the paths relevant to this member's players.
- Build this as a custom SVG/Canvas component. Use a simplified single-elimination tree.

### `/admin` — Admin Panel
Protected: only accessible by users whose Clerk user ID is in an `ADMIN_USER_IDS` env var (comma-separated).

Sections:
1. **Player Pool Upload** — CSV upload UI with preview and confirm.
2. **Stats Sync** — "Sync Stats from SportsRadar" button (calls `/api/stats/sync`). Shows last sync time.
3. **Manual Stats Upload** — CSV upload for manual game stats override.
4. **Eliminate Team** — Dropdown of active teams, "Eliminate" button. Requires confirmation.
5. **Email Blast** — "Send Morning Update to All Leagues" button (manual trigger of the morning email job).
6. **League Overview** — Table of all leagues: name, member count, admin, created date.

---

## DESIGN SYSTEM

### Color Palette (CSS Variables)
```css
:root {
  /* Backgrounds */
  --bg-primary: #080b10;
  --bg-secondary: #0d1117;
  --bg-card: #111827;
  --bg-card-hover: #1a2235;
  --bg-border: #1f2937;

  /* Neon Accents */
  --neon-green: #00ff87;
  --neon-cyan: #00e5ff;
  --neon-purple: #bf5af2;
  --neon-orange: #ff9f0a;
  --neon-red: #ff453a;

  /* Text */
  --text-primary: #f0f4f8;
  --text-secondary: #8b949e;
  --text-muted: #4b5563;

  /* Seed tier colors */
  --tier-1: #00ff87;   /* green — top seeds */
  --tier-2: #00e5ff;   /* cyan */
  --tier-3: #bf5af2;   /* purple */
  --tier-4: #ff9f0a;   /* orange — underdogs */

  /* Status */
  --status-locked: #ff453a;
  --status-active: #00ff87;
  --status-eliminated: #4b5563;
}

/* Light mode override */
[data-theme="light"] {
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --bg-card-hover: #f1f5f9;
  --bg-border: #e2e8f0;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
}
```

### Typography
- **Display font:** `Bebas Neue` (headings, scores, large numbers) — Google Fonts
- **Body font:** `DM Sans` (body text, UI labels) — Google Fonts
- **Mono font:** `JetBrains Mono` (stats, numbers) — Google Fonts

### Font Size Toggle
Persist in localStorage. Apply `data-fontsize="sm|md|lg"` to `<html>`.
- `sm`: base 14px
- `md`: base 16px (default)
- `lg`: base 18px

### Spacing & Cards
- Border radius on cards: `12px`
- Card border: `1px solid var(--bg-border)`
- Card background: `var(--bg-card)`
- Hover: background shifts to `var(--bg-card-hover)` + subtle `box-shadow: 0 0 20px rgba(0,255,135,0.05)`
- Neon glow on selected/active elements: `box-shadow: 0 0 12px var(--neon-green), 0 0 24px rgba(0,255,135,0.3)`

### Mobile-First Layout
- Mobile (< 768px): locked header (64px) + locked bottom nav (60px). Content scrolls between them. No horizontal scrolling.
- Tablet (768–1024px): sidebar begins to appear.
- Desktop (> 1024px): full two-column layout with sidebar.

**Bottom nav items (mobile):**
- 🏠 Home (Dashboard)
- 🏆 My Leagues
- 👤 Profile / Settings
- ⚙️ Admin (only visible to admins)

**Header:**
- Left: MNSfantasy logo (stylized text or SVG)
- Center (desktop): nav links
- Right: Clerk `<UserButton />` component

### Animations (Framer Motion)
- Page transitions: `fade + slide up` (0.2s)
- Card hover: `scale(1.01)` with spring physics
- Number counters: animate from 0 to final value on mount (use `useMotionValue` + `useSpring`)
- Standings table row updates: highlight flash on score change (green pulse)
- Pick confirmation: confetti burst (use `canvas-confetti`)
- Roster lock countdown: pulsing red glow when < 1 hour remaining
- Eliminated player: dimming animation with `opacity: 0.4` transition

### Micro-Sounds (Howler.js)
All sounds optional — respect system preferences (`prefers-reduced-motion`) and provide a mute toggle in settings.
- Player pick: soft `click.mp3` (subtle, like a card snap)
- Roster confirmed: short `success.mp3` chime
- Tier full: gentle `ding.mp3`
- Elimination notification: somber `elimination.mp3` (low tone)
- Score update: very subtle `tick.mp3`

Store all sounds in `public/sounds/`. Generate/source royalty-free short clips.
Sound mute state persists in localStorage: `mns_sounds_muted`.

### Accessibility
- All interactive elements have `:focus-visible` outlines in `var(--neon-cyan)`.
- Minimum contrast ratio 4.5:1 for all text.
- `aria-label` on all icon-only buttons.
- `role="table"` semantics on standings.
- Theme toggle (dark/light): top-right in settings panel. Persist in localStorage: `mns_theme`.
- Font size toggle: persist in localStorage: `mns_fontsize`.
- Announce score updates to screen readers with `aria-live="polite"` region.

---

## BRANDING

- App name: **MNSfantasy**
- Domain: `mnsfantasy.com`
- Every page footer (and mobile about screen): *"Powered by [MoneyNeverSleeps.app](https://moneyneversleeps.app)"*
- Header includes a subtle `← All MNSfantasy Games` breadcrumb linking to `mnsfantasy.com`.
- Keep the MoneyNeverSleeps reference subtle — a small line of muted text, not a banner.
- Color palette and aggressive dark aesthetic should feel like a sibling to MoneyNeverSleeps (finance + sports = money + March Madness).
- Taglines to use throughout:
  - *"March Never Sleeps"*
  - *"Pick Smart. Win Big."*
  - *"Underdogs Welcome."*

---

## API ROUTES (`/api/*` — Vercel serverless functions)

All API routes require Clerk authentication via `@clerk/backend` `verifyToken`, except public league lookup.

### Auth Middleware
Create `api/_middleware.ts` that verifies Clerk session token on all protected routes.

### Routes

**Leagues**
- `POST /api/leagues` — create league
- `GET /api/leagues` — list user's leagues
- `GET /api/leagues/:id` — get league (public data if public league)
- `GET /api/leagues/join/:inviteCode` — get league info by invite code (public)
- `POST /api/leagues/join/:inviteCode` — join league (auth required)
- `PUT /api/leagues/:id` — update league (admin only)

**Rosters**
- `GET /api/leagues/:id/roster/:memberId` — get member roster + stats
- `POST /api/leagues/:id/roster` — save roster picks (pre-lock only)
- `GET /api/players` — get all players (with optional `?seed_tier=1` filter)

**Standings**
- `GET /api/leagues/:id/standings` — computed standings for league

**Stats**
- `POST /api/stats/sync` — trigger SportsRadar sync (admin or cron)
- `GET /api/stats/sync/status` — last sync time + status

**Admin**
- `POST /api/admin/upload-players` — CSV player pool import
- `POST /api/admin/upload-stats` — CSV stats override
- `POST /api/admin/eliminate-team` — mark team eliminated
- `GET /api/admin/leagues` — all leagues overview

**Email**
- `POST /api/email/morning-update` — trigger morning update for all leagues (cron or manual)
- `POST /api/email/welcome` — send welcome email to new member

---

## STANDINGS COMPUTATION

The standings query should be a single efficient SQL query using Drizzle. Logic:

```sql
SELECT
  lm.id as member_id,
  lm.team_name,
  u.display_name,
  COUNT(DISTINCT r.player_id) as player_count,
  COUNT(DISTINCT CASE WHEN t.is_eliminated THEN r.player_id END) as eliminated_count,
  COALESCE(SUM(pts.pts), 0) as total_pts,
  COALESCE(SUM(pts.reb), 0) as total_reb,
  COALESCE(SUM(pts.ast), 0) as total_ast,
  COALESCE(SUM(pts.pts + pts.reb + pts.ast), 0) as total_score
FROM league_members lm
JOIN users u ON lm.user_id = u.id
JOIN rosters r ON r.member_id = lm.id
JOIN players p ON r.player_id = p.id
JOIN ncaa_teams t ON p.team_id = t.id
LEFT JOIN player_tournament_stats pts ON pts.player_id = p.id
WHERE lm.league_id = {leagueId}
GROUP BY lm.id, lm.team_name, u.display_name
ORDER BY total_score DESC, total_pts DESC
```

Cache standings in memory (or React Query) and refresh every 60 seconds during active tournament days.

---

## EMAIL TEMPLATES (Resend + React Email)

Install `@react-email/components` and build templates in `src/components/email/`.

### Templates to Build:

**1. `WelcomeEmail.tsx`**
- Welcome to the league, your team name, league name.
- Link to pick your roster (if pre-lock) or view standings.
- Subtle: "Powered by MoneyNeverSleeps.app"

**2. `MorningUpdateEmail.tsx`**
- Subject: `☀️ MNSfantasy Update — {leagueName} | {date}`
- Sections:
  1. **League Standings** — current rank, total score for each member.
  2. **Yesterday's Top Performers** — top 5 players by total stats from yesterday's games.
  3. **Eliminations** — list any teams eliminated yesterday and affected roster picks per member.
  4. **Games Today** — list of today's tournament matchups with the recipient's players highlighted (bold).
- Dark HTML email design matching the app aesthetic.
- CTA button: "View Full Standings →" linking to the league page.

**3. `RosterLockedEmail.tsx`**
- Sent when roster lock triggers.
- Show the member's confirmed 10 picks with their projected scores.
- "Good luck! May your underdogs survive."

### Email Send Logic
- Morning update cron: 7:00 AM ET, after stats sync completes.
- Query all leagues, get all members with email addresses.
- Send individual emails via Resend (not bulk — one per member per league they're in).
- Log to `email_log` table to prevent duplicates.
- Use Resend's batch send API for efficiency.

### Vercel Cron Config (`vercel.json`)
```json
{
  "crons": [
    {
      "path": "/api/stats/sync",
      "schedule": "0 12 * * *"
    }
  ]
}
```
(Vercel crons run in UTC. 12:00 UTC = 7:00 AM ET during EDT.)

---

## SPORTSRADAR INTEGRATION DETAIL

```typescript
// src/lib/sportsradar.ts

const BASE_URL = process.env.SPORTSRADAR_BASE_URL;
const API_KEY = process.env.SPORTSRADAR_API_KEY;

export async function getTournamentSchedule(year: number) {
  const res = await fetch(`${BASE_URL}/tournaments/${year}/schedule.json?api_key=${API_KEY}`);
  return res.json();
}

export async function getGameSummary(gameId: string) {
  const res = await fetch(`${BASE_URL}/games/${gameId}/summary.json?api_key=${API_KEY}`);
  return res.json();
}

export async function getTeamRoster(teamId: string) {
  const res = await fetch(`${BASE_URL}/teams/${teamId}/profile.json?api_key=${API_KEY}`);
  return res.json();
}
```

Map SportsRadar player IDs to our `players.sportsradar_player_id` field during the CSV import (or via a separate mapping step in admin). The sync function should handle players not yet mapped (skip with a warning log).

---

## REACT QUERY SETUP

Use `@tanstack/react-query` for all data fetching:
- Standings: `staleTime: 60_000` (1 min)
- Player list: `staleTime: 300_000` (5 min, changes rarely)
- Roster: `staleTime: 30_000`
- Enable `refetchOnWindowFocus: true` for standings during tournament.

---

## ZUSTAND STORE

```typescript
// src/store/index.ts
interface AppStore {
  theme: 'dark' | 'light';
  fontSize: 'sm' | 'md' | 'lg';
  soundsMuted: boolean;
  setTheme: (theme: 'dark' | 'light') => void;
  setFontSize: (size: 'sm' | 'md' | 'lg') => void;
  toggleSounds: () => void;
}
```
Persist all values via `zustand/middleware` `persist` to localStorage.

---

## SPECIFIC COMPONENT NOTES

### `<PlayerCard>` Component
Props: `player`, `isSelected`, `isDisabled`, `onPick`, `tier`
- Show tier color accent on left border.
- Selected state: full neon border glow matching tier color.
- Disabled state (tier full, not this player): 50% opacity, no hover effect.
- Show a small "🔥" flame emoji if the player's projected score is in the top 10% of all players.

### `<BracketView>` Component
- Build as an SVG-based component.
- Only render the rounds relevant to the tournament progress (don't pre-render future rounds).
- Member's players are highlighted with a neon dot indicator.
- Eliminated paths are greyed out.
- On mobile: horizontal scroll with touch support.

### `<CountdownTimer>` Component
- Shows time remaining until roster lock.
- Format: `Xd Xh Xm Xs`
- When < 24 hours: show only hours/minutes/seconds, color turns orange.
- When < 1 hour: color turns red with pulsing glow animation.
- When locked: shows "🔒 ROSTER LOCKED" badge.

### `<SeedTierBadge>` Component
- Small colored pill badge showing seed number.
- Colors: Tier 1 = `var(--tier-1)`, Tier 2 = `var(--tier-2)`, etc.

### `<CryptoWalletDisplay>` Component
- Shows wallet type icon (ETH/BTC), truncated address, copy button, and QR code.
- Use `qrcode.react` library for QR generation.
- Tooltip: "Scan to send your buy-in. MNSfantasy does not process payments."

---

## MOBILE UX SPECIFICS

- Header height: 64px, `position: fixed`, `z-index: 50`.
- Bottom nav height: 60px, `position: fixed`, `z-index: 50`.
- Page content: `padding-top: 64px; padding-bottom: 60px`.
- All modals/drawers use `react-bottom-drawer` or custom Framer Motion sheet from bottom on mobile.
- Swipe gestures on roster page to move between tiers.
- Pull-to-refresh on standings page (triggers React Query invalidation).
- `viewport` meta: `width=device-width, initial-scale=1, maximum-scale=1` to prevent unwanted zoom.
- Active link states in bottom nav: neon glow on active icon.

---

## SETTINGS PANEL

Accessible via `/settings` or a drawer from the profile icon.

Options:
- **Theme:** Dark / Light toggle (pill switch)
- **Font Size:** Small / Medium / Large (segmented control)
- **Sounds:** On / Off toggle
- **Account:** Clerk account management link
- **About:** *"MNSfantasy is powered by MoneyNeverSleeps.app — the home of fantasy sports and investment fantasy leagues."*

---

## ERROR HANDLING & LOADING STATES

- All async operations show skeleton loaders (not spinners) — use `react-loading-skeleton` configured with dark theme colors.
- API errors display via Sonner toast (red, 5s duration).
- Form validation errors inline under fields (React Hook Form + Zod).
- 404 page: dark themed with *"This game went to overtime... and we lost the page."*
- Network error boundary: catch React errors globally with an error boundary component.

---

## SECURITY NOTES

- Never expose `CLERK_SECRET_KEY`, `DATABASE_URL`, `RESEND_API_KEY`, or `SPORTSRADAR_API_KEY` to the frontend. These are server-only.
- All API routes validate Clerk session before any DB operation.
- Admin routes additionally check `ADMIN_USER_IDS` env var.
- Roster save endpoint: verify `isLocked` flag before allowing writes.
- Rate limit stats sync endpoint to prevent abuse (check last sync time, minimum 10-minute gap).
- Invite codes are nanoid-generated (URL-safe, random, non-guessable).

---

## PACKAGE.JSON DEPENDENCIES (key packages)

```json
{
  "dependencies": {
    "@clerk/clerk-react": "^5",
    "@clerk/backend": "^1",
    "@tanstack/react-query": "^5",
    "@react-email/components": "^0.0.22",
    "drizzle-orm": "^0.30",
    "@neondatabase/serverless": "^0.9",
    "resend": "^3",
    "framer-motion": "^11",
    "howler": "^2.2",
    "papaparse": "^5.4",
    "react-hook-form": "^7",
    "zod": "^3",
    "zustand": "^4",
    "sonner": "^1",
    "canvas-confetti": "^1.9",
    "qrcode.react": "^3",
    "lucide-react": "^0.400",
    "date-fns": "^3",
    "nanoid": "^5",
    "react-router-dom": "^6"
  },
  "devDependencies": {
    "drizzle-kit": "^0.20",
    "tailwindcss": "^3",
    "typescript": "^5",
    "vite": "^5",
    "@types/howler": "^2",
    "@types/papaparse": "^5",
    "@types/canvas-confetti": "^1"
  }
}
```

---

## TAILWIND CONFIG

Extend Tailwind with custom colors matching the CSS variables:

```js
// tailwind.config.js
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        'neon-green': '#00ff87',
        'neon-cyan': '#00e5ff',
        'neon-purple': '#bf5af2',
        'neon-orange': '#ff9f0a',
        'neon-red': '#ff453a',
        'bg-primary': '#080b10',
        'bg-secondary': '#0d1117',
        'bg-card': '#111827',
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { boxShadow: '0 0 5px #00ff87, 0 0 10px #00ff87' },
          '50%': { boxShadow: '0 0 20px #00ff87, 0 0 40px #00ff87' },
        },
        'glow': {
          'from': { textShadow: '0 0 5px #00ff87' },
          'to': { textShadow: '0 0 20px #00ff87, 0 0 30px #00ff87' },
        },
      },
    },
  },
}
```

---

## DEPLOYMENT CHECKLIST

1. Create Vercel project named `mnsfantasy-ncaa`, set custom domain to `ncaa.mnsfantasy.com`.
2. In Cloudflare (or your DNS provider), add CNAME: `ncaa.mnsfantasy.com → cname.vercel-dns.com`.
3. Set all env vars in Vercel project settings (see .env.example above).
4. Connect Neon database — use the **same DATABASE_URL** that will be shared with future game apps.
5. Run `drizzle-kit push` to apply schema to production DB (only needed once; future game apps share the DB).
6. Configure Clerk production instance with allowed origins: `mnsfantasy.com`, `ncaa.mnsfantasy.com`, `wncaa.mnsfantasy.com` (add future subdomains proactively).
7. In Clerk dashboard: set `allowedRedirectOrigins` to include all MNSfantasy subdomains.
8. Verify `mnsfantasy.com` in Resend. Set DNS records for `updates@mnsfantasy.com` (done once, all subdomains use it).
9. Configure Vercel cron job in `vercel.json`.
10. Verify SportsRadar API key covers NCAAMB tournament games.
11. Upload initial player CSV via admin panel before Thursday lock.
12. Test invite flow end-to-end on `ncaa.mnsfantasy.com`.
13. Ensure `mnsfantasy.com` platform landing page (separate project, build later) links to `ncaa.mnsfantasy.com`.

---

## MARKETING & PREFERENCE SYSTEM

### First-Login Onboarding Modal

This fires **once** for every new user, regardless of which subdomain they first sign up on. Use Clerk's `useUser()` hook — after Clerk confirms the session is new (check for absence of a `marketing_subscribers` row for this user ID), show a full-screen modal overlay before letting them into the app.

**Modal content:**
- Headline: *"Before you play..."*
- Subhead: *"MNSfantasy is free. We keep you in the game with email updates."*
- Single opt-in checkbox (pre-checked): **"Yes, keep me posted on new MNSfantasy games, league activity, and platform updates."**
- Secondary checkbox (unchecked): **"Also send me fantasy insights from MoneyNeverSleeps.app"** — this is separate consent for cross-brand marketing.
- "Let's Play" button (always enabled — they can decline both checkboxes).
- Tiny legal line: *"You can update these preferences anytime at mnsfantasy.com/preferences. We never sell your data."*

**On submit:**
1. Upsert into `marketing_subscribers` with `global_opt_in` and `pref_mns_insights` values from checkboxes.
2. Set `source = GAME_SLUG env var` (so we know which game acquired them).
3. Set `opted_in_at = now()` if opted in.
4. Store a flag in localStorage (`mns_onboarding_complete`) so the modal never re-fires even if the DB call fails momentarily.
5. Send a welcome email via Resend (only if opted in).

**This modal must never show again** — check both the localStorage flag AND the DB row presence.

---

### In-App Preference Center (ncaa.mnsfantasy.com/settings)

Add a "Notifications" tab to the settings page with two sections:

**Section 1 — Platform preferences** (links to full preference center)
- Read-only summary of global opt-in status.
- "Manage all MNSfantasy email preferences →" — links to `mnsfantasy.com/preferences`.

**Section 2 — NCAA Tournament emails** (editable in-app)
Toggles that write to `marketing_game_prefs` for `game_slug = 'ncaa-mens-2025'`:
- Morning updates (daily standings recap)
- Elimination alerts (when one of your players' teams is knocked out)
- Score change alerts (significant score movements)
- Roster lock reminders (48h and 2h before lock)
- "Unsubscribe from all NCAA emails" — sets `opted_out_of_game = true` (does not affect global opt-in)

Show a note: *"Turning off individual alerts here only affects NCAA emails. Visit mnsfantasy.com/preferences to manage all platform communications."*

---

### Email Send Guard (enforce in every email-sending function)

Before sending ANY marketing or update email, every send function must run this check:

```typescript
// src/lib/email-guard.ts
// PLATFORM PATTERN — copy this to every game app
export async function canSendEmail(
  userId: string,
  gameSlug: string,
  emailType: 'morning_update' | 'elimination_alert' | 'score_alert' | 'roster_reminder' | 'new_game' | 'league_invite'
): Promise<boolean> {
  const subscriber = await db
    .select()
    .from(marketingSubscribers)
    .where(eq(marketingSubscribers.userId, userId))
    .limit(1);

  // No record = never opted in = no send
  if (!subscriber[0]) return false;

  // Master unsub or global opt-out = no send
  if (!subscriber[0].globalOptIn || subscriber[0].unsubscribedAt) return false;

  // Platform-level email types check global prefs
  if (emailType === 'new_game') return subscriber[0].prefNewGames;
  if (emailType === 'league_invite') return subscriber[0].prefLeagueInvites;

  // Game-level email types check per-game prefs
  const gamePrefs = await db
    .select()
    .from(marketingGamePrefs)
    .where(
      and(
        eq(marketingGamePrefs.userId, userId),
        eq(marketingGamePrefs.gameSlug, gameSlug)
      )
    )
    .limit(1);

  // No game prefs row = all defaults = send allowed
  if (!gamePrefs[0]) return true;

  // Full game unsub
  if (gamePrefs[0].optedOutOfGame) return false;

  // Per-type checks
  if (emailType === 'morning_update') return gamePrefs[0].prefMorningUpdates;
  if (emailType === 'elimination_alert') return gamePrefs[0].prefEliminationAlerts;
  if (emailType === 'score_alert') return gamePrefs[0].prefScoreAlerts;
  if (emailType === 'roster_reminder') return gamePrefs[0].prefRosterReminders;

  return true;
}
```

Call `canSendEmail()` for every recipient before every Resend call. Never bypass it.

---

### Email Footer (all emails)

Every email template — transactional or marketing — must include this footer:

```
You're receiving this because you play MNSfantasy.
Manage preferences → mnsfantasy.com/preferences
Unsubscribe from all → mnsfantasy.com/preferences?unsubscribe=all

MNSfantasy · Powered by MoneyNeverSleeps.app
```

The unsubscribe link must include the user's ID as a signed token (use a simple HMAC with `CLERK_SECRET_KEY` as the signing key) so one-click unsubscribe works without requiring login. The `/preferences` page on `mnsfantasy.com` handles the token verification and sets `unsubscribed_at`.

---

## COMPANION PROJECT NOTE (Build Separately)

After this app is complete, a separate project will be built: a **universal sports stats scraper** that:
- Scrapes multiple public sources (ESPN, CBS Sports, NCAA.com, 247Sports)
- Achieves consensus across sources
- Exposes a unified API that MNSfantasy (and future apps) can call as a stats source
- This scraper will be a standalone Node.js/TypeScript project with its own repo

Do NOT build the scraper in this project. Flag `SPORTSRADAR_BASE_URL` as swappable when the scraper is ready.

---

## FINAL NOTES FOR CLAUDE CODE

- Build mobile-first. Every component should be usable on a 390px wide screen before considering desktop.
- Do not use placeholder/lorem content anywhere — use realistic NCAA basketball content (player names, team names, seeds) in any mock data.
- The roster selection page is the heart of the UX. Spend extra care on it. It needs to feel like a premium fantasy sports app, not a form.
- Every number that represents a score or stat should use the `JetBrains Mono` font.
- Eliminated players should always be visually distinct — never just greyed out text. Use strikethrough + dim + a small 💀 or ❌ indicator.
- The whole app should feel like it was designed by someone who actually watches basketball — urgent, alive, competitive.
- When in doubt about a UI decision: mobile-first, dark, neon, fast, accessible.

Build the complete application now.


## Once finished push to github
https://github.com/seanmun/ncaa-mns-fantasy.git