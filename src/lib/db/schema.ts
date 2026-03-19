import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  decimal,
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// Enums
export const leagueVisibilityEnum = pgEnum('league_visibility', [
  'public',
  'private',
]);
export const tournamentRoundEnum = pgEnum('tournament_round', [
  'round_of_64',
  'round_of_32',
  'sweet_16',
  'elite_8',
  'final_four',
  'championship',
]);

// PLATFORM PATTERN — Users (mirrors Clerk, minimal local data)
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
  seed: integer('seed').notNull(),
  region: text('region').notNull(),
  isEliminated: boolean('is_eliminated').default(false).notNull(),
  eliminatedInRound: text('eliminated_in_round'),
  sportRadarTeamId: text('sportsradar_team_id'),
  logoUrl: text('logo_url'),
  gameSlug: text('game_slug').notNull().default('ncaa-mens-2026'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Players
export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id')
    .references(() => ncaaTeams.id)
    .notNull(),
  name: text('name').notNull(),
  jersey: text('jersey'),
  position: text('position'),
  avgPts: decimal('avg_pts', { precision: 5, scale: 1 })
    .notNull()
    .default('0'),
  avgReb: decimal('avg_reb', { precision: 5, scale: 1 })
    .notNull()
    .default('0'),
  avgAst: decimal('avg_ast', { precision: 5, scale: 1 })
    .notNull()
    .default('0'),
  sportRadarPlayerId: text('sportsradar_player_id'),
  isActive: boolean('is_active').default(true).notNull(),
  gameSlug: text('game_slug').notNull().default('ncaa-mens-2026'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tournament game stats (accumulated)
export const playerTournamentStats = pgTable('player_tournament_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id')
    .references(() => players.id)
    .notNull(),
  round: text('round').notNull(),
  gameDate: timestamp('game_date').notNull(),
  pts: integer('pts').default(0).notNull(),
  reb: integer('reb').default(0).notNull(),
  ast: integer('ast').default(0).notNull(),
  sportRadarGameId: text('sportsradar_game_id'),
  gameSlug: text('game_slug').notNull().default('ncaa-mens-2026'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// PLATFORM PATTERN — Leagues (reuse in future game apps)
export const leagues = pgTable('leagues', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  adminId: text('admin_id')
    .references(() => users.id)
    .notNull(),
  visibility: leagueVisibilityEnum('visibility')
    .default('private')
    .notNull(),
  buyInAmount: decimal('buy_in_amount', { precision: 10, scale: 2 }).default(
    '0'
  ),
  buyInCurrency: text('buy_in_currency').default('USD'),
  cryptoWalletAddress: text('crypto_wallet_address'),
  cryptoWalletType: text('crypto_wallet_type'),
  gameSlug: text('game_slug').notNull().default('ncaa-mens-2026'), // PLATFORM PATTERN — namespace all leagues by game
  inviteCode: text('invite_code').notNull().unique(),
  isLocked: boolean('is_locked').default(false).notNull(),
  maxMembers: integer('max_members').default(50),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// PLATFORM PATTERN — League Members (reuse in future game apps)
export const leagueMembers = pgTable('league_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  leagueId: uuid('league_id')
    .references(() => leagues.id)
    .notNull(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  teamName: text('team_name').notNull(),
  rosterLocked: boolean('roster_locked').default(false).notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

// Rosters (junction: league member → players)
export const rosters = pgTable('rosters', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .references(() => leagueMembers.id)
    .notNull(),
  playerId: uuid('player_id')
    .references(() => players.id)
    .notNull(),
  pickedAt: timestamp('picked_at').defaultNow().notNull(),
});

// PLATFORM PATTERN — Email log (prevent duplicate sends)
export const emailLog = pgTable('email_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  leagueId: uuid('league_id')
    .references(() => leagues.id)
    .notNull(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  emailType: text('email_type').notNull(),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
});

// Active games (live scores from SportsRadar, populated by live-sync cron)
export const activeGames = pgTable('active_games', {
  id: uuid('id').primaryKey().defaultRandom(),
  srGameId: text('sr_game_id').notNull().unique(),
  homeTeamName: text('home_team_name').notNull(),
  awayTeamName: text('away_team_name').notNull(),
  homeScore: integer('home_score').default(0).notNull(),
  awayScore: integer('away_score').default(0).notNull(),
  status: text('status').notNull().default('scheduled'),
  scheduledTime: timestamp('scheduled_time'),
  gameSlug: text('game_slug').notNull().default('ncaa-mens-2026'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// PLATFORM PATTERN — reuse in all game apps and mnsfantasy.com root
// Global marketing opt-in (one row per user, set at first login on ANY subdomain)
export const marketingSubscribers = pgTable('marketing_subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull()
    .unique(),
  email: text('email').notNull(),
  globalOptIn: boolean('global_opt_in').default(false).notNull(),
  prefNewGames: boolean('pref_new_games').default(true).notNull(),
  prefLeagueInvites: boolean('pref_league_invites').default(true).notNull(),
  prefPlatformNews: boolean('pref_platform_news').default(true).notNull(),
  prefMnsInsights: boolean('pref_mns_insights').default(false).notNull(),
  source: text('source').notNull(),
  optedInAt: timestamp('opted_in_at'),
  unsubscribedAt: timestamp('unsubscribed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// PLATFORM PATTERN — per-game email preferences (opt-out granularity per subdomain)
export const marketingGamePrefs = pgTable(
  'marketing_game_prefs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .references(() => users.id)
      .notNull(),
    gameSlug: text('game_slug').notNull(),
    prefMorningUpdates: boolean('pref_morning_updates')
      .default(true)
      .notNull(),
    prefEliminationAlerts: boolean('pref_elimination_alerts')
      .default(true)
      .notNull(),
    prefScoreAlerts: boolean('pref_score_alerts').default(true).notNull(),
    prefRosterReminders: boolean('pref_roster_reminders')
      .default(true)
      .notNull(),
    optedOutOfGame: boolean('opted_out_of_game').default(false).notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userGameUnique: uniqueIndex('marketing_game_prefs_user_game_idx').on(
      table.userId,
      table.gameSlug
    ),
  })
);
