// Centralized game configuration — shared by frontend + backend
// All game-specific settings live here instead of env vars

export interface GameConfig {
  slug: string;
  label: string;
  shortLabel: string;
  sportRadarPath: 'ncaamb' | 'ncaawb';
  tournamentYear: number;
  rosterLockDate: string; // ISO 8601
}

export const GAME_CONFIGS: Record<string, GameConfig> = {
  'ncaa-mens-2026': {
    slug: 'ncaa-mens-2026',
    label: "Men's NCAA 2026",
    shortLabel: "Men's",
    sportRadarPath: 'ncaamb',
    tournamentYear: 2026,
    rosterLockDate: '2026-03-19T12:00:00-05:00',
  },
  'ncaa-womens-2026': {
    slug: 'ncaa-womens-2026',
    label: "Women's NCAA 2026",
    shortLabel: "Women's",
    sportRadarPath: 'ncaawb',
    tournamentYear: 2026,
    rosterLockDate: '2026-03-21T18:00:00-05:00',
  },
};

export const DEFAULT_GAME_SLUG = 'ncaa-mens-2026';

export function getGameConfig(slug: string): GameConfig {
  return GAME_CONFIGS[slug] || GAME_CONFIGS[DEFAULT_GAME_SLUG];
}

export function getActiveGameSlugs(): string[] {
  return Object.keys(GAME_CONFIGS);
}

export function getSportsRadarBaseUrl(gameSlug: string): string {
  const config = getGameConfig(gameSlug);
  const tier = process.env.SPORTSRADAR_TIER || 'trial';
  return `https://api.sportradar.com/${config.sportRadarPath}/${tier}/v8/en`;
}

export function isGameRosterLocked(gameSlug: string): boolean {
  const config = getGameConfig(gameSlug);
  return new Date() >= new Date(config.rosterLockDate);
}

export function getGameRosterLockDate(gameSlug: string): Date {
  const config = getGameConfig(gameSlug);
  return new Date(config.rosterLockDate);
}
