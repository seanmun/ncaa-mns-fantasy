import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and } from 'drizzle-orm';
import Papa from 'papaparse';
import { verifyAuth, isAdmin } from '../_middleware.js';
import { db, schema } from '../_db.js';
import { checkRateLimit } from '../_rateLimit.js';

const { players, playerTournamentStats } = schema;

interface StatsCSVRow {
  player_name?: string;
  player_id?: string;
  sportsradar_player_id?: string;
  round: string;
  game_date: string;
  pts: string;
  reb: string;
  ast: string;
  sportsradar_game_id?: string;
}

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

  const rl = checkRateLimit(`admin-upload:${userId}`, { limit: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  try {
    // Accept either { stats: [...] } (pre-parsed JSON) or { csv: "..." } (raw CSV string)
    let rows: StatsCSVRow[];

    if (req.body?.stats && Array.isArray(req.body.stats)) {
      rows = req.body.stats;
    } else if (req.body?.csv && typeof req.body.csv === 'string') {
      const parsed = Papa.parse<StatsCSVRow>(req.body.csv, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim().toLowerCase().replace(/\s+/g, '_'),
      });

      if (parsed.errors.length > 0) {
        return res.status(400).json({
          error: 'CSV parsing errors',
          details: parsed.errors.slice(0, 5),
        });
      }
      rows = parsed.data;
    } else {
      return res.status(400).json({ error: 'Request body must contain "stats" array or "csv" string' });
    }

    if (rows.length === 0) {
      return res.status(400).json({ error: 'No data rows provided' });
    }

    let statsUpserted = 0;
    let skipped = 0;

    for (const row of rows) {
      if (!row.round || !row.game_date || !row.pts || !row.reb || !row.ast) {
        skipped++;
        continue;
      }

      // Find player by player_id, sportsradar_player_id, or player_name
      let playerId: string | null = null;

      if (row.player_id) {
        playerId = row.player_id.trim();
      } else if (row.sportsradar_player_id) {
        const [found] = await db
          .select({ id: players.id })
          .from(players)
          .where(eq(players.sportRadarPlayerId, row.sportsradar_player_id.trim()))
          .limit(1);
        playerId = found?.id || null;
      } else if (row.player_name) {
        const [found] = await db
          .select({ id: players.id })
          .from(players)
          .where(eq(players.name, row.player_name.trim()))
          .limit(1);
        playerId = found?.id || null;
      }

      if (!playerId) {
        skipped++;
        continue;
      }

      const pts = parseInt(row.pts, 10) || 0;
      const reb = parseInt(row.reb, 10) || 0;
      const ast = parseInt(row.ast, 10) || 0;
      const gameDate = new Date(row.game_date);
      const gameId = row.sportsradar_game_id?.trim() || null;

      // Upsert: check if stat record already exists for this player + round + game
      if (gameId) {
        const [existing] = await db
          .select({ id: playerTournamentStats.id })
          .from(playerTournamentStats)
          .where(
            and(
              eq(playerTournamentStats.playerId, playerId),
              eq(playerTournamentStats.sportRadarGameId, gameId)
            )
          )
          .limit(1);

        if (existing) {
          await db
            .update(playerTournamentStats)
            .set({ pts, reb, ast, round: row.round.trim(), gameDate, updatedAt: new Date() })
            .where(eq(playerTournamentStats.id, existing.id));
        } else {
          await db.insert(playerTournamentStats).values({
            playerId,
            round: row.round.trim(),
            gameDate,
            pts,
            reb,
            ast,
            sportRadarGameId: gameId,
          });
        }
      } else {
        // Without a game ID, check by player + round + date
        const [existing] = await db
          .select({ id: playerTournamentStats.id })
          .from(playerTournamentStats)
          .where(
            and(
              eq(playerTournamentStats.playerId, playerId),
              eq(playerTournamentStats.round, row.round.trim())
            )
          )
          .limit(1);

        if (existing) {
          await db
            .update(playerTournamentStats)
            .set({ pts, reb, ast, gameDate, updatedAt: new Date() })
            .where(eq(playerTournamentStats.id, existing.id));
        } else {
          await db.insert(playerTournamentStats).values({
            playerId,
            round: row.round.trim(),
            gameDate,
            pts,
            reb,
            ast,
          });
        }
      }

      statsUpserted++;
    }

    return res.status(200).json({
      data: {
        message: 'Stats override import completed',
        statsUpserted,
        skipped,
        totalRowsProcessed: rows.length,
      },
    });
  } catch (err) {
    console.error('Error uploading stats:', err);
    return res.status(500).json({ error: 'Failed to import stats' });
  }
}
