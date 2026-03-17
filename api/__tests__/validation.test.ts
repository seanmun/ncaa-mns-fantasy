import { describe, it, expect } from 'vitest';
import {
  createLeagueSchema,
  updateLeagueSchema,
  saveRosterSchema,
  lockLeagueSchema,
  joinLeagueSchema,
  userSyncSchema,
  eliminateTeamSchema,
  deactivatePlayerSchema,
  uploadPlayersSchema,
  uploadStatsSchema,
  gamePrefsSchema,
  marketingSubscribeSchema,
  parseBody,
} from '../_validation';

describe('createLeagueSchema', () => {
  it('accepts valid league creation body', () => {
    const result = createLeagueSchema.safeParse({
      name: 'My League',
      teamName: 'Hoops Squad',
      visibility: 'private',
      maxMembers: 20,
    });
    expect(result.success).toBe(true);
  });

  it('applies defaults for optional fields', () => {
    const result = createLeagueSchema.safeParse({
      name: 'League',
      teamName: 'Team',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.visibility).toBe('private');
      expect(result.data.buyInAmount).toBe('0');
      expect(result.data.buyInCurrency).toBe('USD');
      expect(result.data.maxMembers).toBe(50);
    }
  });

  it('rejects empty name', () => {
    const result = createLeagueSchema.safeParse({
      name: '',
      teamName: 'Team',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty teamName', () => {
    const result = createLeagueSchema.safeParse({
      name: 'League',
      teamName: '   ',
    });
    expect(result.success).toBe(false);
  });

  it('trims whitespace from name and teamName', () => {
    const result = createLeagueSchema.safeParse({
      name: '  My League  ',
      teamName: '  My Team  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('My League');
      expect(result.data.teamName).toBe('My Team');
    }
  });

  it('coerces buyInAmount to string', () => {
    const result = createLeagueSchema.safeParse({
      name: 'League',
      teamName: 'Team',
      buyInAmount: 25,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.buyInAmount).toBe('25');
  });

  it('rejects invalid visibility', () => {
    const result = createLeagueSchema.safeParse({
      name: 'League',
      teamName: 'Team',
      visibility: 'hidden',
    });
    expect(result.success).toBe(false);
  });

  it('rejects maxMembers below 2', () => {
    const result = createLeagueSchema.safeParse({
      name: 'League',
      teamName: 'Team',
      maxMembers: 1,
    });
    expect(result.success).toBe(false);
  });

  it('transforms null cryptoWalletAddress to null', () => {
    const result = createLeagueSchema.safeParse({
      name: 'League',
      teamName: 'Team',
      cryptoWalletAddress: '',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.cryptoWalletAddress).toBeNull();
  });
});

describe('updateLeagueSchema', () => {
  it('accepts partial updates', () => {
    const result = updateLeagueSchema.safeParse({ name: 'New Name' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (no updates)', () => {
    const result = updateLeagueSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts isLocked boolean', () => {
    const result = updateLeagueSchema.safeParse({ isLocked: true });
    expect(result.success).toBe(true);
  });
});

describe('saveRosterSchema', () => {
  const makeIds = (n: number) =>
    Array.from({ length: n }, (_, i) => `player-${i}`);

  it('accepts exactly 10 unique IDs', () => {
    const result = saveRosterSchema.safeParse({ playerIds: makeIds(10) });
    expect(result.success).toBe(true);
  });

  it('rejects fewer than 10 players', () => {
    const result = saveRosterSchema.safeParse({ playerIds: makeIds(9) });
    expect(result.success).toBe(false);
  });

  it('rejects more than 10 players', () => {
    const result = saveRosterSchema.safeParse({ playerIds: makeIds(11) });
    expect(result.success).toBe(false);
  });

  it('rejects duplicate player IDs', () => {
    const ids = [...makeIds(9), 'player-0'];
    const result = saveRosterSchema.safeParse({ playerIds: ids });
    expect(result.success).toBe(false);
  });

  it('rejects empty strings in array', () => {
    const ids = [...makeIds(9), ''];
    const result = saveRosterSchema.safeParse({ playerIds: ids });
    expect(result.success).toBe(false);
  });
});

describe('lockLeagueSchema', () => {
  it('accepts boolean true', () => {
    const result = lockLeagueSchema.safeParse({ isLocked: true });
    expect(result.success).toBe(true);
  });

  it('accepts boolean false', () => {
    const result = lockLeagueSchema.safeParse({ isLocked: false });
    expect(result.success).toBe(true);
  });

  it('rejects string "true"', () => {
    const result = lockLeagueSchema.safeParse({ isLocked: 'true' });
    expect(result.success).toBe(false);
  });

  it('rejects missing isLocked', () => {
    const result = lockLeagueSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('joinLeagueSchema', () => {
  it('accepts valid team name', () => {
    const result = joinLeagueSchema.safeParse({ teamName: 'My Team' });
    expect(result.success).toBe(true);
  });

  it('rejects empty team name', () => {
    const result = joinLeagueSchema.safeParse({ teamName: '' });
    expect(result.success).toBe(false);
  });

  it('trims whitespace', () => {
    const result = joinLeagueSchema.safeParse({ teamName: '  Team  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.teamName).toBe('Team');
  });
});

describe('userSyncSchema', () => {
  it('accepts valid user data', () => {
    const result = userSyncSchema.safeParse({
      email: 'test@example.com',
      displayName: 'Test User',
      avatarUrl: 'https://example.com/avatar.png',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing email', () => {
    const result = userSyncSchema.safeParse({ displayName: 'Test' });
    expect(result.success).toBe(false);
  });

  it('rejects missing displayName', () => {
    const result = userSyncSchema.safeParse({ email: 'test@example.com' });
    expect(result.success).toBe(false);
  });

  it('transforms null avatarUrl to null', () => {
    const result = userSyncSchema.safeParse({
      email: 'test@example.com',
      displayName: 'Test',
      avatarUrl: null,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.avatarUrl).toBeNull();
  });
});

describe('eliminateTeamSchema', () => {
  it('accepts teamId + round', () => {
    const result = eliminateTeamSchema.safeParse({
      teamId: 'team-123',
      round: 'Round of 64',
    });
    expect(result.success).toBe(true);
  });

  it('accepts teamName + round', () => {
    const result = eliminateTeamSchema.safeParse({
      teamName: 'Duke',
      round: 'Sweet 16',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when neither teamId nor teamName', () => {
    const result = eliminateTeamSchema.safeParse({ round: 'Round of 64' });
    expect(result.success).toBe(false);
  });

  it('rejects missing round', () => {
    const result = eliminateTeamSchema.safeParse({ teamName: 'Duke' });
    expect(result.success).toBe(false);
  });
});

describe('deactivatePlayerSchema', () => {
  it('accepts playerName', () => {
    const result = deactivatePlayerSchema.safeParse({ playerName: 'John Doe' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.reactivate).toBe(false);
  });

  it('accepts playerId with reactivate', () => {
    const result = deactivatePlayerSchema.safeParse({
      playerId: 'player-123',
      reactivate: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects when neither playerName nor playerId', () => {
    const result = deactivatePlayerSchema.safeParse({ reactivate: true });
    expect(result.success).toBe(false);
  });
});

describe('uploadPlayersSchema', () => {
  it('accepts players array', () => {
    const result = uploadPlayersSchema.safeParse({
      players: [
        { player_name: 'John', team_name: 'Duke', seed: '1', region: 'East' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts csv string', () => {
    const result = uploadPlayersSchema.safeParse({ csv: 'name,team\nJohn,Duke' });
    expect(result.success).toBe(true);
  });

  it('rejects empty players array', () => {
    const result = uploadPlayersSchema.safeParse({ players: [] });
    expect(result.success).toBe(false);
  });

  it('rejects empty csv string', () => {
    const result = uploadPlayersSchema.safeParse({ csv: '' });
    expect(result.success).toBe(false);
  });

  it('rejects player row missing required fields', () => {
    const result = uploadPlayersSchema.safeParse({
      players: [{ player_name: 'John' }],
    });
    expect(result.success).toBe(false);
  });
});

describe('uploadStatsSchema', () => {
  it('accepts stats array', () => {
    const result = uploadStatsSchema.safeParse({
      stats: [
        { round: 'R64', game_date: '2026-03-20', pts: '20', reb: '5', ast: '3', player_name: 'John' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts csv string', () => {
    const result = uploadStatsSchema.safeParse({ csv: 'round,game_date,pts,reb,ast\nR64,2026-03-20,20,5,3' });
    expect(result.success).toBe(true);
  });

  it('rejects empty stats array', () => {
    const result = uploadStatsSchema.safeParse({ stats: [] });
    expect(result.success).toBe(false);
  });
});

describe('gamePrefsSchema', () => {
  it('accepts all boolean prefs', () => {
    const result = gamePrefsSchema.safeParse({
      prefMorningUpdates: true,
      prefEliminationAlerts: false,
      prefScoreAlerts: true,
      prefRosterReminders: false,
      optedOutOfGame: false,
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (no changes)', () => {
    const result = gamePrefsSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('marketingSubscribeSchema', () => {
  it('accepts valid subscribe body', () => {
    const result = marketingSubscribeSchema.safeParse({
      globalOptIn: true,
      source: 'settings',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = marketingSubscribeSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('parseBody helper', () => {
  it('returns success with parsed data for valid input', () => {
    const result = parseBody(lockLeagueSchema, { isLocked: true });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isLocked).toBe(true);
  });

  it('returns error string for invalid input', () => {
    const result = parseBody(lockLeagueSchema, { isLocked: 'yes' });
    expect(result.success).toBe(false);
    if (!result.success) expect(typeof result.error).toBe('string');
  });

  it('returns descriptive error path', () => {
    const result = parseBody(createLeagueSchema, { name: '', teamName: 'Team' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('name');
  });
});
