import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, isAdmin } from '../_middleware.js';
import { db, schema } from '../_db.js';
import { eliminateTeamSchema, parseBody } from '../_validation.js';
import { checkRateLimit } from '../_rateLimit.js';

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
    const rl = checkRateLimit(`admin:${userId}`, { limit: 20, windowMs: 60_000 });
    if (!rl.allowed) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
    }

    const parsed = parseBody(eliminateTeamSchema, req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error });
    }

    const { teamId, teamName, round } = parsed.data;
    const gameSlug = (req.query.game_slug as string) || 'ncaa-mens-2026';

    // Find team by ID or name, scoped to game
    const [team] = await db
      .select()
      .from(ncaaTeams)
      .where(
        and(
          teamId
            ? eq(ncaaTeams.id, teamId)
            : eq(ncaaTeams.name, teamName),
          eq(ncaaTeams.gameSlug, gameSlug)
        )
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
