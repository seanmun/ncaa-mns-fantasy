import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, sql, and, isNull, isNotNull } from 'drizzle-orm';
import { verifyAuth, isAdmin } from '../_middleware.js';
import { db, schema } from '../_db.js';

const { players, ncaaTeams } = schema;

/**
 * GET /api/stats/diagnostic?game_slug=ncaa-mens-2026
 *
 * Shows diagnostic info about players and their SportsRadar IDs
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await verifyAuth(req);
  if (!userId || !isAdmin(userId)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const gameSlug = (req.query.game_slug as string) || 'ncaa-mens-2026';

    // Count total players
    const [totalCount] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(players)
      .where(eq(players.gameSlug, gameSlug));

    // Count players with SportsRadar IDs
    const [withSrIdCount] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(players)
      .where(and(
        eq(players.gameSlug, gameSlug),
        isNotNull(players.sportRadarPlayerId)
      ));

    // Count players WITHOUT SportsRadar IDs
    const [withoutSrIdCount] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(players)
      .where(and(
        eq(players.gameSlug, gameSlug),
        isNull(players.sportRadarPlayerId)
      ));

    // Get sample of players without SR IDs
    const samplePlayersWithoutSrId = await db
      .select({
        name: players.name,
        teamId: players.teamId,
        jersey: players.jersey,
        avgPts: players.avgPts,
      })
      .from(players)
      .where(and(
        eq(players.gameSlug, gameSlug),
        isNull(players.sportRadarPlayerId)
      ))
      .limit(10);

    // Get sample of players WITH SR IDs
    const samplePlayersWithSrId = await db
      .select({
        name: players.name,
        sportRadarPlayerId: players.sportRadarPlayerId,
        jersey: players.jersey,
        avgPts: players.avgPts,
      })
      .from(players)
      .where(and(
        eq(players.gameSlug, gameSlug),
        isNotNull(players.sportRadarPlayerId)
      ))
      .limit(10);

    // Get team count
    const [teamCount] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(ncaaTeams)
      .where(eq(ncaaTeams.gameSlug, gameSlug));

    // Get teams with SR IDs
    const [teamsWithSrId] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(ncaaTeams)
      .where(and(
        eq(ncaaTeams.gameSlug, gameSlug),
        isNotNull(ncaaTeams.sportRadarTeamId)
      ));

    return res.status(200).json({
      data: {
        gameSlug,
        teams: {
          total: teamCount?.count || 0,
          withSportsRadarId: teamsWithSrId?.count || 0,
        },
        players: {
          total: totalCount?.count || 0,
          withSportsRadarId: withSrIdCount?.count || 0,
          withoutSportsRadarId: withoutSrIdCount?.count || 0,
          percentageWithId: totalCount?.count
            ? Math.round((withSrIdCount?.count || 0) / totalCount.count * 100)
            : 0,
        },
        samples: {
          playersWithoutSrId: samplePlayersWithoutSrId,
          playersWithSrId: samplePlayersWithSrId,
        },
      },
    });
  } catch (err) {
    console.error('Error in diagnostic endpoint:', err);
    return res.status(500).json({ error: 'Failed to fetch diagnostic info' });
  }
}
