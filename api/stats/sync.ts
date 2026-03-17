import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and, sql, desc } from 'drizzle-orm';
import { verifyAuth, isAdmin } from '../_middleware.js';
import { db, schema } from '../_db.js';

const { players, ncaaTeams, playerTournamentStats } = schema;

// In-memory last sync tracker (per cold start — for persistent tracking use DB)
let lastSyncTime: Date | null = null;
const MIN_SYNC_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Allow either admin user or cron secret (Vercel sends Authorization: Bearer)
  const bearerToken = req.headers.authorization?.replace('Bearer ', '');
  const cronSecret = bearerToken || req.headers['x-cron-secret'] || req.query.cron_secret;
  let authorized = !!process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET;

  if (!authorized) {
    const userId = await verifyAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!isAdmin(userId)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    authorized = true;
  }

  try {
    // Rate limit: minimum 10-minute gap between syncs
    if (lastSyncTime) {
      const elapsed = Date.now() - lastSyncTime.getTime();
      if (elapsed < MIN_SYNC_INTERVAL_MS) {
        const waitSeconds = Math.ceil((MIN_SYNC_INTERVAL_MS - elapsed) / 1000);
        return res.status(429).json({
          error: `Rate limited. Please wait ${waitSeconds} seconds before syncing again.`,
          lastSyncTime: lastSyncTime.toISOString(),
        });
      }
    }

    const BASE_URL = process.env.SPORTSRADAR_BASE_URL;
    const API_KEY = process.env.SPORTSRADAR_API_KEY;

    if (!BASE_URL || !API_KEY) {
      return res.status(500).json({ error: 'SportsRadar API not configured' });
    }

    // Get yesterday's date for game lookup
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');

    // Fetch tournament schedule to find yesterday's games
    const scheduleRes = await fetch(
      `${BASE_URL}/games/${year}/${month}/${day}/schedule.json?api_key=${API_KEY}`
    );

    if (!scheduleRes.ok) {
      console.error('SportsRadar schedule API error:', scheduleRes.status);
      return res.status(502).json({ error: 'Failed to fetch game schedule from SportsRadar' });
    }

    const scheduleData = await scheduleRes.json();
    const games = scheduleData.games || [];

    if (games.length === 0) {
      lastSyncTime = new Date();
      return res.status(200).json({
        data: {
          message: 'No games found for yesterday',
          gamesProcessed: 0,
          statsUpserted: 0,
          syncTime: lastSyncTime.toISOString(),
        },
      });
    }

    let statsUpserted = 0;
    const eliminatedTeamIds: string[] = [];

    // Process each game's box score
    for (const game of games) {
      const gameId = game.id;
      if (!gameId) continue;

      // Add small delay to respect API rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const boxScoreRes = await fetch(
        `${BASE_URL}/games/${gameId}/summary.json?api_key=${API_KEY}`
      );

      if (!boxScoreRes.ok) {
        console.error(`Failed to fetch box score for game ${gameId}:`, boxScoreRes.status);
        continue;
      }

      const boxScore = await boxScoreRes.json();
      const round = game.title || game.round || 'unknown';
      const gameDate = new Date(game.scheduled || yesterday);

      // Determine the losing team for elimination tracking
      if (boxScore.home?.points !== undefined && boxScore.away?.points !== undefined) {
        const losingTeam =
          boxScore.home.points < boxScore.away.points ? boxScore.home : boxScore.away;
        if (losingTeam.id) {
          eliminatedTeamIds.push(losingTeam.id);
        }
      }

      // Process player stats from both teams
      const teams = [boxScore.home, boxScore.away].filter(Boolean);
      for (const team of teams) {
        const teamPlayers = team.players || [];
        for (const playerData of teamPlayers) {
          const srPlayerId = playerData.id;
          if (!srPlayerId) continue;

          const stats = playerData.statistics || {};
          const pts = stats.points || 0;
          const reb = (stats.rebounds || 0) + (stats.offensive_rebounds || 0) + (stats.defensive_rebounds || 0);
          const ast = stats.assists || 0;

          // Find matching player in our DB by SportsRadar ID
          const [dbPlayer] = await db
            .select({ id: players.id })
            .from(players)
            .where(eq(players.sportRadarPlayerId, srPlayerId))
            .limit(1);

          if (!dbPlayer) continue;

          // Upsert tournament stats
          // Check if a record exists for this player + game
          const [existing] = await db
            .select({ id: playerTournamentStats.id })
            .from(playerTournamentStats)
            .where(
              and(
                eq(playerTournamentStats.playerId, dbPlayer.id),
                eq(playerTournamentStats.sportRadarGameId, gameId)
              )
            )
            .limit(1);

          if (existing) {
            await db
              .update(playerTournamentStats)
              .set({
                pts,
                reb,
                ast,
                round,
                gameDate,
                updatedAt: new Date(),
              })
              .where(eq(playerTournamentStats.id, existing.id));
          } else {
            await db.insert(playerTournamentStats).values({
              playerId: dbPlayer.id,
              round,
              gameDate,
              pts,
              reb,
              ast,
              sportRadarGameId: gameId,
            });
          }

          statsUpserted++;
        }
      }
    }

    // Mark eliminated teams
    let teamsEliminated = 0;
    for (const srTeamId of eliminatedTeamIds) {
      const result = await db
        .update(ncaaTeams)
        .set({
          isEliminated: true,
          eliminatedInRound: games[0]?.title || 'unknown',
        })
        .where(
          and(
            eq(ncaaTeams.sportRadarTeamId, srTeamId),
            eq(ncaaTeams.isEliminated, false)
          )
        )
        .returning();

      if (result.length > 0) teamsEliminated++;
    }

    lastSyncTime = new Date();

    return res.status(200).json({
      data: {
        message: 'Stats sync completed',
        gamesProcessed: games.length,
        statsUpserted,
        teamsEliminated,
        syncTime: lastSyncTime.toISOString(),
      },
    });
  } catch (err) {
    console.error('Error syncing stats:', err);
    return res.status(500).json({ error: 'Failed to sync stats' });
  }
}
