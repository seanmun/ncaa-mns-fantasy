import type { InferSelectModel } from 'drizzle-orm';
import type {
  users,
  ncaaTeams,
  players,
  playerTournamentStats,
  leagues,
  leagueMembers,
  rosters,
  marketingSubscribers,
  marketingGamePrefs,
} from '@/lib/db/schema';

// DB model types
export type User = InferSelectModel<typeof users>;
export type NcaaTeam = InferSelectModel<typeof ncaaTeams>;
export type Player = InferSelectModel<typeof players>;
export type PlayerTournamentStat = InferSelectModel<typeof playerTournamentStats>;
export type League = InferSelectModel<typeof leagues>;
export type LeagueMember = InferSelectModel<typeof leagueMembers>;
export type Roster = InferSelectModel<typeof rosters>;
export type MarketingSubscriber = InferSelectModel<typeof marketingSubscribers>;
export type MarketingGamePref = InferSelectModel<typeof marketingGamePrefs>;

// Extended types for frontend use
export interface PlayerWithTeam extends Player {
  team: NcaaTeam;
}

export interface PlayerWithStats extends PlayerWithTeam {
  tournamentStats: PlayerTournamentStat[];
  totalPts: number;
  totalReb: number;
  totalAst: number;
  totalScore: number;
}

export interface StandingsEntry {
  memberId: string;
  userId: string;
  teamName: string;
  displayName: string;
  playerCount: number;
  eliminatedCount: number;
  totalPts: number;
  totalReb: number;
  totalAst: number;
  totalScore: number;
}

export interface LeagueWithDetails extends League {
  memberCount: number;
  adminName: string;
}

export interface MemberWithRoster extends LeagueMember {
  user: User;
  players: PlayerWithStats[];
  totalScore: number;
}

// Seed tier configuration
export const SEED_TIERS = [
  { tier: 1, label: 'Tier 1', seeds: [1, 2, 3, 4], picks: 4, color: 'var(--tier-1)' },
  { tier: 2, label: 'Tier 2', seeds: [5, 6, 7, 8], picks: 3, color: 'var(--tier-2)' },
  { tier: 3, label: 'Tier 3', seeds: [9, 10, 11, 12], picks: 2, color: 'var(--tier-3)' },
  { tier: 4, label: 'Tier 4', seeds: [13, 14, 15, 16], picks: 1, color: 'var(--tier-4)' },
] as const;

export type SeedTier = (typeof SEED_TIERS)[number];

export function getTierForSeed(seed: number | undefined | null): SeedTier | undefined {
  if (seed == null || seed < 1) return undefined;
  return SEED_TIERS.find((t) => (t.seeds as readonly number[]).includes(seed));
}

// Roster pick state for the selection page
export interface RosterPickState {
  tier1: PlayerWithTeam[];
  tier2: PlayerWithTeam[];
  tier3: PlayerWithTeam[];
  tier4: PlayerWithTeam[];
}

// CSV import types
export interface PlayerCSVRow {
  team_name: string;
  seed: string;
  region: string;
  player_name: string;
  jersey: string;
  position: string;
  avg_pts: string;
  avg_reb: string;
  avg_ast: string;
}

export interface StatsCSVRow {
  player_name: string;
  team_name: string;
  game_date: string;
  pts: string;
  reb: string;
  ast: string;
}
