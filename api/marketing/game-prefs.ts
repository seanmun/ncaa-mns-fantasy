import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../_middleware.js';
import { db } from '../_db.js';
import { marketingGamePrefs } from '../../src/lib/db/schema.js';
import { eq, and } from 'drizzle-orm';

const GAME_SLUG = process.env.GAME_SLUG || 'ncaa-mens-2025';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await verifyAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET — fetch current preferences
  if (req.method === 'GET') {
    const [prefs] = await db
      .select()
      .from(marketingGamePrefs)
      .where(
        and(
          eq(marketingGamePrefs.userId, userId),
          eq(marketingGamePrefs.gameSlug, GAME_SLUG)
        )
      )
      .limit(1);

    // Return defaults if no row exists
    return res.status(200).json(
      prefs || {
        prefMorningUpdates: true,
        prefEliminationAlerts: true,
        prefScoreAlerts: true,
        prefRosterReminders: true,
        optedOutOfGame: false,
      }
    );
  }

  // PUT — update preferences
  if (req.method === 'PUT') {
    const {
      prefMorningUpdates,
      prefEliminationAlerts,
      prefScoreAlerts,
      prefRosterReminders,
      optedOutOfGame,
    } = req.body;

    await db
      .insert(marketingGamePrefs)
      .values({
        userId,
        gameSlug: GAME_SLUG,
        prefMorningUpdates: prefMorningUpdates ?? true,
        prefEliminationAlerts: prefEliminationAlerts ?? true,
        prefScoreAlerts: prefScoreAlerts ?? true,
        prefRosterReminders: prefRosterReminders ?? true,
        optedOutOfGame: optedOutOfGame ?? false,
      })
      .onConflictDoUpdate({
        target: [marketingGamePrefs.userId, marketingGamePrefs.gameSlug],
        set: {
          prefMorningUpdates: prefMorningUpdates ?? true,
          prefEliminationAlerts: prefEliminationAlerts ?? true,
          prefScoreAlerts: prefScoreAlerts ?? true,
          prefRosterReminders: prefRosterReminders ?? true,
          optedOutOfGame: optedOutOfGame ?? false,
          updatedAt: new Date(),
        },
      });

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
