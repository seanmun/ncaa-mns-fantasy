# NCAA MNS Fantasy

Fantasy basketball game for the NCAA March Madness tournament. Users create leagues, draft real tournament players across seed-based tiers, and earn points from actual game stats (PTS + REB + AST).

Live at **ncaa.mnsfantasy.com**

## Features

- Create/join fantasy leagues (up to 50 members)
- Draft 10 players across 4 seed-based tiers (1-4, 5-8, 9-12, 13-16)
- Real-time stat tracking via SportsRadar API
- Player elimination alerts when teams are knocked out
- Men's and Women's NCAA tournament support
- Email notifications (morning updates, elimination alerts, roster reminders)
- Admin panel for importing teams/players, syncing stats, and managing eliminations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Routing | React Router v6 |
| State | TanStack React Query v5, Zustand |
| Auth | Clerk (satellite mode on ncaa.mnsfantasy.com) |
| Database | PostgreSQL via Neon (serverless) |
| ORM | Drizzle ORM |
| API | Vercel Serverless Functions |
| Stats | SportsRadar API |
| Email | Resend + React Email |
| Hosting | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A [Neon](https://neon.tech) PostgreSQL database
- [Clerk](https://clerk.com) application
- [SportsRadar](https://developer.sportradar.com) API key
- [Resend](https://resend.com) API key

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/your-org/NCAA-MNS-fantasy.git
   cd NCAA-MNS-fantasy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

4. Push the database schema:
   ```bash
   npm run db:push
   ```

5. Start the dev server:
   ```bash
   npm run dev
   ```
   The app runs at `http://localhost:5173`. API calls are proxied to Vercel dev server.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk public key |
| `CLERK_SECRET_KEY` | Clerk secret key (server-side only) |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `ADMIN_USER_IDS` | Comma-separated Clerk user IDs for admin access |
| `SPORTSRADAR_API_KEY` | SportsRadar API token |
| `SPORTSRADAR_TIER` | API tier (`trial` or `production`) |
| `RESEND_API_KEY` | Resend email API key |
| `RESEND_FROM_EMAIL` | Verified sender email address |
| `VITE_APP_URL` | App URL (`https://ncaa.mnsfantasy.com` in prod) |
| `VITE_PLATFORM_URL` | Primary Clerk domain (`https://mnsfantasy.com` in prod) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + Vite build |
| `npm run db:push` | Push Drizzle schema to Neon |
| `npm run db:studio` | Open Drizzle Studio (visual DB explorer) |
| `npm run db:generate` | Generate migration files from schema changes |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |

## Project Structure

```
src/
  components/     # UI components (admin, league, layout, roster, etc.)
  pages/          # Route pages (Dashboard, LeagueHome, PickRoster, etc.)
  hooks/          # Custom hooks (useApi, useUserSync, useAdminCheck)
  lib/            # Config, DB schema, utilities
  store/          # Zustand store
  types/          # TypeScript interfaces

api/              # Vercel serverless endpoints
  admin/          # Import teams/players, eliminate, deactivate
  leagues/        # CRUD, join, roster, standings
  players/        # Player listing
  stats/          # Sync scores, today's games
  email/          # Morning updates, welcome, reminders
  marketing/      # Email preferences

email-templates/  # HTML email templates (Resend)
drizzle/          # Generated DB migrations
```

## Syncing Stats

Stats are synced manually from the admin panel using the **Sync Today** and **Sync Yesterday** buttons, which pull game scores and player stats from the SportsRadar API. This uses the `/api/stats/sync` endpoint.

## Deployment

Deployed on Vercel. Push to `main` to trigger a deploy.

Ensure all environment variables are set in the Vercel dashboard under Settings > Environment Variables.
