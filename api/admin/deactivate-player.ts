import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, ilike } from 'drizzle-orm';
import { verifyAuth, isAdmin } from '../_middleware.js';
import { db, schema } from '../_db.js';

const { players } = schema;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await verifyAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!isAdmin(userId)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { playerName, playerId, reactivate } = req.body || {};

    if (!playerName && !playerId) {
      return res.status(400).json({ error: 'playerName or playerId is required' });
    }

    // Find player by ID or name (case-insensitive)
    const [player] = await db
      .select()
      .from(players)
      .where(
        playerId
          ? eq(players.id, playerId)
          : ilike(players.name, playerName)
      )
      .limit(1);

    if (!player) {
      return res.status(404).json({ error: `Player "${playerName || playerId}" not found` });
    }

    const newStatus = reactivate ? true : false;

    if (player.isActive === newStatus) {
      return res.status(400).json({
        error: `Player "${player.name}" is already ${newStatus ? 'active' : 'inactive'}`,
      });
    }

    const [updated] = await db
      .update(players)
      .set({ isActive: newStatus })
      .where(eq(players.id, player.id))
      .returning();

    return res.status(200).json({
      data: {
        message: `Player "${updated.name}" has been ${newStatus ? 'reactivated' : 'deactivated'}`,
        player: updated,
      },
    });
  } catch (err) {
    console.error('Error updating player status:', err);
    return res.status(500).json({ error: 'Failed to update player status' });
  }
}
