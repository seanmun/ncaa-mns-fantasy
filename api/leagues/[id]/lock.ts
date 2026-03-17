import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '../../_middleware.js';
import { db, schema } from '../../_db.js';
import { lockLeagueSchema, parseBody } from '../../_validation.js';
import { checkRateLimit } from '../../_rateLimit.js';

const { leagues } = schema;

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
    // Verify user is league admin
    const [league] = await db
      .select()
      .from(leagues)
      .where(eq(leagues.id, leagueId))
      .limit(1);

    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }
    if (league.adminId !== userId) {
      return res.status(403).json({ error: 'Only the league admin can lock/unlock rosters' });
    }

    const rl = checkRateLimit(`lock-league:${userId}`, { limit: 10, windowMs: 60_000 });
    if (!rl.allowed) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
    }

    const parsed = parseBody(lockLeagueSchema, req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error });
    }

    const { isLocked } = parsed.data;

    const [updated] = await db
      .update(leagues)
      .set({ isLocked, updatedAt: new Date() })
      .where(eq(leagues.id, leagueId))
      .returning();

    return res.status(200).json({ data: updated });
  } catch (err) {
    console.error('Error toggling league lock:', err);
    return res.status(500).json({ error: 'Failed to update league lock status' });
  }
}
