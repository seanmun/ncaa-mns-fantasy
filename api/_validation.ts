import { z } from 'zod';

// --- Leagues ---

export const createLeagueSchema = z.object({
  name: z.string().trim().min(1, 'League name is required').max(100),
  teamName: z.string().trim().min(1, 'Team name is required').max(50),
  gameSlug: z.string().min(1, 'Game type is required'),
  visibility: z.enum(['public', 'private']).default('private'),
  buyInAmount: z.coerce.number().min(0).default(0).transform(String),
  buyInCurrency: z.string().max(10).default('USD'),
  cryptoWalletAddress: z.string().max(200).nullish().transform((v) => v || null),
  cryptoWalletType: z.string().max(20).nullish().transform((v) => v || null),
  maxMembers: z.coerce.number().int().min(2).max(500).default(50),
});

export const updateLeagueSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  visibility: z.enum(['public', 'private']).optional(),
  buyInAmount: z.coerce.number().min(0).transform(String).optional(),
  buyInCurrency: z.string().max(10).optional(),
  cryptoWalletAddress: z.string().max(200).nullish().transform((v) => v || null),
  cryptoWalletType: z.string().max(20).nullish().transform((v) => v || null),
  maxMembers: z.coerce.number().int().min(2).max(500).optional(),
  isLocked: z.boolean().optional(),
});

// --- Roster ---

export const saveRosterSchema = z.object({
  playerIds: z
    .array(z.string().min(1))
    .length(10, 'Exactly 10 player IDs are required')
    .refine(
      (ids) => new Set(ids).size === 10,
      'Duplicate player IDs are not allowed'
    ),
});

// --- League Lock ---

export const lockLeagueSchema = z.object({
  isLocked: z.boolean({ required_error: 'isLocked (boolean) is required' }),
});

// --- Join League ---

export const joinLeagueSchema = z.object({
  teamName: z.string().trim().min(1, 'Team name is required').max(50),
});

// --- User Sync ---

export const userSyncSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  displayName: z.string().trim().min(1, 'Display name is required').max(100),
  avatarUrl: z.string().nullish().transform((v) => v || null),
});

// --- Admin: Eliminate Team ---

export const eliminateTeamSchema = z
  .object({
    teamId: z.string().optional(),
    teamName: z.string().optional(),
    round: z.string().optional(),
    restore: z.boolean().optional().default(false),
  })
  .refine((data) => data.teamId || data.teamName, {
    message: 'teamId or teamName is required',
  })
  .refine((data) => data.restore || data.round, {
    message: 'round is required when eliminating (not restoring)',
  });

// --- Admin: Deactivate Player ---

export const deactivatePlayerSchema = z
  .object({
    playerName: z.string().optional(),
    playerId: z.string().optional(),
    reactivate: z.boolean().optional().default(false),
  })
  .refine((data) => data.playerName || data.playerId, {
    message: 'playerName or playerId is required',
  });

// --- Admin: Upload Players ---

const playerRowSchema = z.object({
  player_name: z.string().min(1),
  team_name: z.string().min(1),
  seed: z.string().min(1),
  region: z.string().min(1),
  team_short_name: z.string().optional(),
  jersey: z.string().optional(),
  position: z.string().optional(),
  avg_pts: z.string().optional(),
  avg_reb: z.string().optional(),
  avg_ast: z.string().optional(),
  sportsradar_player_id: z.string().optional(),
  sportsradar_team_id: z.string().optional(),
  logo_url: z.string().optional(),
});

export const uploadPlayersSchema = z.union([
  z.object({ players: z.array(playerRowSchema).min(1, 'Players array must not be empty') }),
  z.object({ csv: z.string().min(1, 'CSV string must not be empty') }),
]);

// --- Admin: Upload Stats ---

const statsRowSchema = z.object({
  player_name: z.string().optional(),
  player_id: z.string().optional(),
  sportsradar_player_id: z.string().optional(),
  round: z.string().min(1),
  game_date: z.string().min(1),
  pts: z.string().min(1),
  reb: z.string().min(1),
  ast: z.string().min(1),
  sportsradar_game_id: z.string().optional(),
});

export const uploadStatsSchema = z.union([
  z.object({ stats: z.array(statsRowSchema).min(1, 'Stats array must not be empty') }),
  z.object({ csv: z.string().min(1, 'CSV string must not be empty') }),
]);

// --- Marketing: Game Prefs ---

export const gamePrefsSchema = z.object({
  prefMorningUpdates: z.boolean().optional(),
  prefEliminationAlerts: z.boolean().optional(),
  prefScoreAlerts: z.boolean().optional(),
  prefRosterReminders: z.boolean().optional(),
  optedOutOfGame: z.boolean().optional(),
});

// --- Marketing: Subscribe ---

export const marketingSubscribeSchema = z.object({
  globalOptIn: z.boolean().optional(),
  mnsInsights: z.boolean().optional(),
  prefNewGames: z.boolean().optional(),
  prefLeagueInvites: z.boolean().optional(),
  prefPlatformNews: z.boolean().optional(),
  source: z.string().optional(),
});

// --- Helper: parse & respond ---

export function parseBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      success: false,
      error: firstError
        ? `${firstError.path.join('.') || 'body'}: ${firstError.message}`
        : 'Invalid request body',
    };
  }
  return { success: true, data: result.data };
}
