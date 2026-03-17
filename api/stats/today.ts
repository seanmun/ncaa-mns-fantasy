import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from 'drizzle-orm';
import { verifyAuth } from '../_middleware.js';
import { db, schema } from '../_db.js';

const { activeGames } = schema;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await verifyAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Fetch today's games from activeGames table
    // Filter to games updated within the last 24 hours
    const games = await db
      .select({
        srGameId: activeGames.srGameId,
        homeTeamName: activeGames.homeTeamName,
        awayTeamName: activeGames.awayTeamName,
        homeScore: activeGames.homeScore,
        awayScore: activeGames.awayScore,
        status: activeGames.status,
        scheduledTime: activeGames.scheduledTime,
        updatedAt: activeGames.updatedAt,
      })
      .from(activeGames)
      .where(
        sql`${activeGames.updatedAt} > NOW() - INTERVAL '24 hours'`
      )
      .orderBy(activeGames.scheduledTime);

    // Get the most recent sync time
    const lastSync = games.length > 0
      ? games.reduce((latest, g) => {
          const t = new Date(g.updatedAt).getTime();
          return t > latest ? t : latest;
        }, 0)
      : null;

    const hasLiveGames = games.some((g) => g.status === 'inprogress');

    return res.status(200).json({
      data: {
        games: games.map((g) => ({
          gameId: g.srGameId,
          homeTeam: g.homeTeamName,
          awayTeam: g.awayTeamName,
          homeScore: g.homeScore,
          awayScore: g.awayScore,
          status: g.status,
          scheduledTime: g.scheduledTime,
        })),
        lastSyncTime: lastSync ? new Date(lastSync).toISOString() : null,
        hasLiveGames,
      },
    });
  } catch (err) {
    console.error('Error fetching today games:', err);
    return res.status(500).json({ error: 'Failed to fetch today\'s games' });
  }
}
