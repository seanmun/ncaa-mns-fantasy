import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { verifyAuth, isAdmin } from '../_middleware.js';
import { db, schema } from '../_db.js';

const { ncaaTeams } = schema;

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
    const { teamId, teamName, round } = req.body || {};

    if (!round || typeof round !== 'string') {
      return res.status(400).json({ error: 'round is required' });
    }
    if (!teamId && !teamName) {
      return res.status(400).json({ error: 'teamId or teamName is required' });
    }

    // Find team by ID or name
    const [team] = await db
      .select()
      .from(ncaaTeams)
      .where(
        teamId
          ? eq(ncaaTeams.id, teamId)
          : eq(ncaaTeams.name, teamName)
      )
      .limit(1);

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.isEliminated) {
      return res.status(400).json({
        error: `Team "${team.name}" is already eliminated (round: ${team.eliminatedInRound})`,
      });
    }

    // Mark as eliminated
    const [updated] = await db
      .update(ncaaTeams)
      .set({
        isEliminated: true,
        eliminatedInRound: round,
      })
      .where(eq(ncaaTeams.id, team.id))
      .returning();

    return res.status(200).json({
      data: {
        message: `Team "${updated.name}" marked as eliminated in ${round}`,
        team: updated,
      },
    });
  } catch (err) {
    console.error('Error eliminating team:', err);
    return res.status(500).json({ error: 'Failed to eliminate team' });
  }
}
