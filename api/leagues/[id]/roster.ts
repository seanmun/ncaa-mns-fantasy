import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { verifyAuth } from '../../_middleware.js';
import { db, schema } from '../../_db.js';

const { leagues, leagueMembers, rosters, players, ncaaTeams } = schema;

// Tier distribution: seed ranges mapped to required picks
// Tier 1 (seeds 1-4): 4 players
// Tier 2 (seeds 5-8): 3 players
// Tier 3 (seeds 9-12): 2 players
// Tier 4 (seeds 13-16): 1 player
const TIER_RULES: { tier: number; seeds: number[]; required: number }[] = [
  { tier: 1, seeds: [1, 2, 3, 4], required: 4 },
  { tier: 2, seeds: [5, 6, 7, 8], required: 3 },
  { tier: 3, seeds: [9, 10, 11, 12], required: 2 },
  { tier: 4, seeds: [13, 14, 15, 16], required: 1 },
];

function getSeedTier(seed: number): number {
  for (const rule of TIER_RULES) {
    if (rule.seeds.includes(seed)) return rule.tier;
  }
  return 0;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const leagueId = req.query.id as string;
  if (!leagueId) {
    return res.status(400).json({ error: 'League ID is required' });
  }

  const userId = await verifyAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Check roster lock date
    const lockDateStr = process.env.ROSTER_LOCK_DATE;
    if (lockDateStr) {
      const lockDate = new Date(lockDateStr);
      if (new Date() >= lockDate) {
        return res.status(400).json({ error: 'Rosters are locked. The deadline has passed.' });
      }
    }

    // Verify membership
    const [membership] = await db
      .select()
      .from(leagueMembers)
      .where(
        and(
          eq(leagueMembers.leagueId, leagueId),
          eq(leagueMembers.userId, userId)
        )
      )
      .limit(1);

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this league' });
    }

    const { playerIds } = req.body || {};

    if (!Array.isArray(playerIds) || playerIds.length !== 10) {
      return res.status(400).json({ error: 'Exactly 10 player IDs are required' });
    }

    // Check for duplicates
    const uniqueIds = new Set(playerIds);
    if (uniqueIds.size !== 10) {
      return res.status(400).json({ error: 'Duplicate player IDs are not allowed' });
    }

    // Fetch all selected players with their team info
    const selectedPlayers = await db
      .select({
        playerId: players.id,
        teamSeed: ncaaTeams.seed,
      })
      .from(players)
      .innerJoin(ncaaTeams, eq(ncaaTeams.id, players.teamId))
      .where(inArray(players.id, playerIds));

    if (selectedPlayers.length !== 10) {
      return res.status(400).json({
        error: `Only ${selectedPlayers.length} of 10 player IDs are valid`,
      });
    }

    // Validate tier distribution
    const tierCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const p of selectedPlayers) {
      const tier = getSeedTier(p.teamSeed);
      if (tier === 0) {
        return res.status(400).json({ error: `Player has invalid seed: ${p.teamSeed}` });
      }
      tierCounts[tier]++;
    }

    for (const rule of TIER_RULES) {
      if (tierCounts[rule.tier] !== rule.required) {
        return res.status(400).json({
          error: `Tier ${rule.tier} (seeds ${rule.seeds.join(',')}) requires exactly ${rule.required} players, got ${tierCounts[rule.tier]}`,
        });
      }
    }

    // Delete existing roster for this member, then insert new picks
    console.log('[ROSTER SAVE] memberId:', membership.id, 'userId:', userId, 'leagueId:', leagueId, 'playerIds:', playerIds.length);

    await db
      .delete(rosters)
      .where(eq(rosters.memberId, membership.id));

    const rosterInserts = playerIds.map((playerId: string) => ({
      memberId: membership.id,
      playerId,
    }));

    await db.insert(rosters).values(rosterInserts);

    // Verify the insert actually persisted
    const [verification] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(rosters)
      .where(eq(rosters.memberId, membership.id));

    console.log('[ROSTER SAVE] verified count:', verification.count, 'for memberId:', membership.id);

    if (verification.count === 0) {
      console.error('[ROSTER SAVE] INSERT SUCCEEDED BUT VERIFICATION FOUND 0 ROWS!', {
        memberId: membership.id,
        userId,
        leagueId,
      });
      return res.status(500).json({ error: 'Roster save failed: data did not persist' });
    }

    return res.status(201).json({ data: { success: true, playerCount: verification.count } });
  } catch (err) {
    console.error('Error saving roster:', err);
    return res.status(500).json({ error: 'Failed to save roster' });
  }
}
