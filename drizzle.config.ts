import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // All NCAA game tables live in the ncaa schema; shared cross-game
  // tables (users, marketing_*, email_log) live in public and are NOT
  // managed by this app's push. Never add 'public' here — the generic
  // table names would match other games' tables and drizzle would try
  // to DROP them.
  schemaFilter: ['ncaa'],
} satisfies Config;
