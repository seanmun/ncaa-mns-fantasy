import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and, isNotNull } from 'drizzle-orm';
import { verifyAuth, isAdmin } from '../_middleware.js';
import { db, schema } from '../_db.js';

const { players, playerTournamentStats, activeGames, ncaaTeams } = schema;

// In-memory rate limiter (per cold start)
let lastSyncTime: Date | null = null;
const MIN_SYNC_INTERVAL_MS = 60 * 1000; // 60 seconds

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth: Vercel cron (Authorization: Bearer), custom header, query param, or admin user
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
    // Rate limit: minimum 60-second gap
    if (lastSyncTime) {
      const elapsed = Date.now() - lastSyncTime.getTime();
      if (elapsed < MIN_SYNC_INTERVAL_MS) {
        const waitSeconds = Math.ceil((MIN_SYNC_INTERVAL_MS - elapsed) / 1000);
        return res.status(429).json({
          error: `Rate limited. Wait ${waitSeconds}s.`,
          lastSyncTime: lastSyncTime.toISOString(),
        });
      }
    }

    // Game-window guard: only run between 4 PM and midnight ET
    const now = new Date();
    const etHour = parseInt(
      now.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false })
    );
    // Allow override with ?force=true for manual admin testing
    const force = req.query.force === 'true';
    if (!force && (etHour < 16 || etHour >= 24)) {
      return res.status(200).json({
        data: {
          message: 'Outside game window (4 PM - midnight ET). Use ?force=true to override.',
          skipped: true,
        },
      });
    }

    const BASE_URL = process.env.SPORTSRADAR_BASE_URL;
    const API_KEY = process.env.SPORTSRADAR_API_KEY;

    if (!BASE_URL || !API_KEY) {
      return res.status(500).json({ error: 'SportsRadar API not configured' });
    }

    // Fetch today's schedule
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    const scheduleRes = await fetch(
      `${BASE_URL}/games/${year}/${month}/${day}/schedule.json?api_key=${API_KEY}`
    );

    if (!scheduleRes.ok) {
      console.error('SportsRadar schedule API error:', scheduleRes.status);
      return res.status(502).json({ error: 'Failed to fetch schedule from SportsRadar' });
    }

    const scheduleData = await scheduleRes.json();
    const allGames = scheduleData.games || [];

    if (allGames.length === 0) {
      lastSyncTime = new Date();
      return res.status(200).json({
        data: {
          message: 'No games today',
          gamesFound: 0,
          gamesPolled: 0,
          statsUpserted: 0,
          syncTime: lastSyncTime.toISOString(),
        },
      });
    }

    // Upsert ALL of today's games into activeGames table (for /api/stats/today)
    for (const game of allGames) {
      if (!game.id) continue;

      const homeName = game.home?.name || game.home?.alias || 'TBD';
      const awayName = game.away?.name || game.away?.alias || 'TBD';
      const homeScore = game.home?.points ?? 0;
      const awayScore = game.away?.points ?? 0;
      const status = game.status || 'scheduled';
      const scheduledTime = game.scheduled ? new Date(game.scheduled) : null;

      const [existing] = await db
        .select({ id: activeGames.id })
        .from(activeGames)
        .where(eq(activeGames.srGameId, game.id))
        .limit(1);

      if (existing) {
        await db
          .update(activeGames)
          .set({
            homeTeamName: homeName,
            awayTeamName: awayName,
            homeScore,
            awayScore,
            status,
            scheduledTime,
            updatedAt: new Date(),
          })
          .where(eq(activeGames.id, existing.id));
      } else {
        await db.insert(activeGames).values({
          srGameId: game.id,
          homeTeamName: homeName,
          awayTeamName: awayName,
          homeScore,
          awayScore,
          status,
          scheduledTime,
        });
      }
    }

    // Get all SR team IDs from our ncaa_teams table to filter relevant games
    const ourTeams = await db
      .select({ srTeamId: ncaaTeams.sportRadarTeamId })
      .from(ncaaTeams)
      .where(isNotNull(ncaaTeams.sportRadarTeamId));
    const ourTeamIds = new Set(ourTeams.map((t) => t.srTeamId));

    // Only poll games that: (1) have already started AND (2) involve one of our teams
    const liveGames = allGames.filter((g: { scheduled?: string; home?: { id?: string }; away?: { id?: string } }) => {
      if (!g.scheduled || new Date(g.scheduled) > now) return false;
      const homeId = g.home?.id;
      const awayId = g.away?.id;
      return (homeId && ourTeamIds.has(homeId)) || (awayId && ourTeamIds.has(awayId));
    });

    let statsUpserted = 0;

    for (const game of liveGames) {
      const gameId = game.id;
      if (!gameId) continue;

      // Rate limit: 1.1s between SportsRadar calls
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const summaryRes = await fetch(
        `${BASE_URL}/games/${gameId}/summary.json?api_key=${API_KEY}`
      );

      if (!summaryRes.ok) {
        console.error(`Failed to fetch summary for game ${gameId}:`, summaryRes.status);
        continue;
      }

      const summary = await summaryRes.json();
      const round = game.title || game.round || 'first_four';
      const gameDate = new Date(game.scheduled || today);

      // Update activeGames with detailed scores from summary
      const homePoints = summary.home?.points ?? 0;
      const awayPoints = summary.away?.points ?? 0;
      await db
        .update(activeGames)
        .set({
          homeScore: homePoints,
          awayScore: awayPoints,
          status: summary.status || game.status,
          updatedAt: new Date(),
        })
        .where(eq(activeGames.srGameId, gameId));

      // Process player stats from both teams
      const teams = [summary.home, summary.away].filter(Boolean);
      for (const team of teams) {
        const teamPlayers = team.players || [];
        for (const playerData of teamPlayers) {
          const srPlayerId = playerData.id;
          if (!srPlayerId) continue;

          const stats = playerData.statistics || {};
          const pts = stats.points || 0;
          const reb = stats.rebounds || 0;
          const ast = stats.assists || 0;

          // Find matching player in our DB by SportsRadar ID
          const [dbPlayer] = await db
            .select({ id: players.id })
            .from(players)
            .where(eq(players.sportRadarPlayerId, srPlayerId))
            .limit(1);

          if (!dbPlayer) continue;

          // Upsert tournament stats
          const [existingStat] = await db
            .select({ id: playerTournamentStats.id })
            .from(playerTournamentStats)
            .where(
              and(
                eq(playerTournamentStats.playerId, dbPlayer.id),
                eq(playerTournamentStats.sportRadarGameId, gameId)
              )
            )
            .limit(1);

          if (existingStat) {
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
              .where(eq(playerTournamentStats.id, existingStat.id));
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

    lastSyncTime = new Date();

    return res.status(200).json({
      data: {
        message: 'Live sync completed',
        gamesFound: allGames.length,
        gamesPolled: liveGames.length,
        statsUpserted,
        syncTime: lastSyncTime.toISOString(),
      },
    });
  } catch (err) {
    console.error('Error in live-sync:', err);
    return res.status(500).json({ error: 'Failed to sync live stats' });
  }
}
