import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, isAdmin } from '../_middleware.js';
import { db, schema } from '../_db.js';

const { playerTournamentStats, activeGames } = schema;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await verifyAuth(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!isAdmin(userId)) return res.status(403).json({ error: 'Admin access required' });

  try {
    // Delete all player tournament stats (play-in data that doesn't count)
    const deletedStats = await db.delete(playerTournamentStats).returning({ id: playerTournamentStats.id });

    // Delete all active games (play-in scoreboard entries)
    const deletedGames = await db.delete(activeGames).returning({ id: activeGames.id });

    return res.status(200).json({
      message: 'Play-in data cleared',
      deletedStats: deletedStats.length,
      deletedGames: deletedGames.length,
    });
  } catch (err) {
    console.error('Error clearing play-in data:', err);
    return res.status(500).json({ error: 'Failed to clear play-in data' });
  }
}
