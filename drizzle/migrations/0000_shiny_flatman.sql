DO $$ BEGIN
 CREATE TYPE "league_visibility" AS ENUM('public', 'private');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "tournament_round" AS ENUM('round_of_64', 'round_of_32', 'sweet_16', 'elite_8', 'final_four', 'championship');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "active_games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sr_game_id" text NOT NULL,
	"home_team_name" text NOT NULL,
	"away_team_name" text NOT NULL,
	"home_score" integer DEFAULT 0 NOT NULL,
	"away_score" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"scheduled_time" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "active_games_sr_game_id_unique" UNIQUE("sr_game_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"email_type" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "league_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"team_name" text NOT NULL,
	"roster_locked" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leagues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"admin_id" text NOT NULL,
	"visibility" "league_visibility" DEFAULT 'private' NOT NULL,
	"buy_in_amount" numeric(10, 2) DEFAULT '0',
	"buy_in_currency" text DEFAULT 'USD',
	"crypto_wallet_address" text,
	"crypto_wallet_type" text,
	"game_slug" text DEFAULT 'ncaa-mens-2025' NOT NULL,
	"invite_code" text NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"max_members" integer DEFAULT 50,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leagues_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "marketing_game_prefs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"game_slug" text NOT NULL,
	"pref_morning_updates" boolean DEFAULT true NOT NULL,
	"pref_elimination_alerts" boolean DEFAULT true NOT NULL,
	"pref_score_alerts" boolean DEFAULT true NOT NULL,
	"pref_roster_reminders" boolean DEFAULT true NOT NULL,
	"opted_out_of_game" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "marketing_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"email" text NOT NULL,
	"global_opt_in" boolean DEFAULT false NOT NULL,
	"pref_new_games" boolean DEFAULT true NOT NULL,
	"pref_league_invites" boolean DEFAULT true NOT NULL,
	"pref_platform_news" boolean DEFAULT true NOT NULL,
	"pref_mns_insights" boolean DEFAULT false NOT NULL,
	"source" text NOT NULL,
	"opted_in_at" timestamp,
	"unsubscribed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "marketing_subscribers_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ncaa_teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"seed" integer NOT NULL,
	"region" text NOT NULL,
	"is_eliminated" boolean DEFAULT false NOT NULL,
	"eliminated_in_round" text,
	"sportsradar_team_id" text,
	"logo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "player_tournament_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"round" text NOT NULL,
	"game_date" timestamp NOT NULL,
	"pts" integer DEFAULT 0 NOT NULL,
	"reb" integer DEFAULT 0 NOT NULL,
	"ast" integer DEFAULT 0 NOT NULL,
	"sportsradar_game_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" text NOT NULL,
	"jersey" text,
	"position" text,
	"avg_pts" numeric(5, 1) DEFAULT '0' NOT NULL,
	"avg_reb" numeric(5, 1) DEFAULT '0' NOT NULL,
	"avg_ast" numeric(5, 1) DEFAULT '0' NOT NULL,
	"sportsradar_player_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rosters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"picked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "marketing_game_prefs_user_game_idx" ON "marketing_game_prefs" ("user_id","game_slug");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_log" ADD CONSTRAINT "email_log_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_log" ADD CONSTRAINT "email_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "league_members" ADD CONSTRAINT "league_members_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "league_members" ADD CONSTRAINT "league_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leagues" ADD CONSTRAINT "leagues_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "marketing_game_prefs" ADD CONSTRAINT "marketing_game_prefs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "marketing_subscribers" ADD CONSTRAINT "marketing_subscribers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_tournament_stats" ADD CONSTRAINT "player_tournament_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "players" ADD CONSTRAINT "players_team_id_ncaa_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "ncaa_teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rosters" ADD CONSTRAINT "rosters_member_id_league_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "league_members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rosters" ADD CONSTRAINT "rosters_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
