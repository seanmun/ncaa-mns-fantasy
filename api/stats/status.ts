import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from 'drizzle-orm';
import { verifyAuth } from '../_middleware.js';
import { db, schema } from '../_db.js';

const { playerTournamentStats } = schema;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await verifyAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get the most recent stat update timestamp
    const [latest] = await db
      .select({
        lastUpdated: sql<string>`MAX(${playerTournamentStats.updatedAt})`.as('last_updated'),
        totalStatRecords: sql<number>`COUNT(*)`.as('total_stat_records'),
        uniquePlayers: sql<number>`COUNT(DISTINCT ${playerTournamentStats.playerId})`.as(
          'unique_players'
        ),
        uniqueGames: sql<number>`COUNT(DISTINCT ${playerTournamentStats.sportRadarGameId})`.as(
          'unique_games'
        ),
      })
      .from(playerTournamentStats);

    // Get stats breakdown by round
    const roundBreakdown = await db
      .select({
        round: playerTournamentStats.round,
        gameCount: sql<number>`COUNT(DISTINCT ${playerTournamentStats.sportRadarGameId})`.as(
          'game_count'
        ),
        playerCount: sql<number>`COUNT(DISTINCT ${playerTournamentStats.playerId})`.as(
          'player_count'
        ),
      })
      .from(playerTournamentStats)
      .groupBy(playerTournamentStats.round)
      .orderBy(playerTournamentStats.round);

    return res.status(200).json({
      data: {
        lastUpdated: latest?.lastUpdated || null,
        totalStatRecords: latest?.totalStatRecords || 0,
        uniquePlayers: latest?.uniquePlayers || 0,
        uniqueGames: latest?.uniqueGames || 0,
        roundBreakdown,
      },
    });
  } catch (err) {
    console.error('Error fetching stats status:', err);
    return res.status(500).json({ error: 'Failed to fetch stats status' });
  }
}
