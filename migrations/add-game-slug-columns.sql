-- Add game_slug column to tables that don't have it yet
-- Existing rows get tagged as 'ncaa-mens-2026' (all current data is Men's tournament)

ALTER TABLE ncaa_teams ADD COLUMN IF NOT EXISTS game_slug TEXT NOT NULL DEFAULT 'ncaa-mens-2026';
ALTER TABLE players ADD COLUMN IF NOT EXISTS game_slug TEXT NOT NULL DEFAULT 'ncaa-mens-2026';
ALTER TABLE player_tournament_stats ADD COLUMN IF NOT EXISTS game_slug TEXT NOT NULL DEFAULT 'ncaa-mens-2026';
ALTER TABLE active_games ADD COLUMN IF NOT EXISTS game_slug TEXT NOT NULL DEFAULT 'ncaa-mens-2026';

-- Indexes for filtering by game
CREATE INDEX IF NOT EXISTS idx_ncaa_teams_game_slug ON ncaa_teams(game_slug);
CREATE INDEX IF NOT EXISTS idx_players_game_slug ON players(game_slug);
CREATE INDEX IF NOT EXISTS idx_pts_game_slug ON player_tournament_stats(game_slug);
CREATE INDEX IF NOT EXISTS idx_active_games_game_slug ON active_games(game_slug);
