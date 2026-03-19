import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, isAdmin } from '../_middleware.js';
import { db, schema } from '../_db.js';
import { getSportsRadarBaseUrl, getActiveGameSlugs } from '../../src/lib/gameConfig.js';

const { players, playerTournamentStats, activeGames, ncaaTeams } = schema;

// In-memory rate limiter (per cold start)
let lastSyncTime: Date | null = null;
const MIN_SYNC_INTERVAL_MS = 60 * 1000; // 60 seconds

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Accept GET (Vercel crons) and POST (admin panel)
  if (req.method !== 'POST' && req.method !== 'GET') {
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

    const now = new Date();
    const API_KEY = process.env.SPORTSRADAR_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: 'SportsRadar API not configured' });
    }

    // If game_slug provided, sync only that game; otherwise sync all
    const requestedSlug = req.query.game_slug as string | undefined;
    const gameSlugs = requestedSlug ? [requestedSlug] : getActiveGameSlugs();

    const allResults: Record<string, object> = {};

    for (const gameSlug of gameSlugs) {
      const result = await liveSyncForGame(gameSlug, API_KEY, now);
      allResults[gameSlug] = result;
    }

    lastSyncTime = new Date();

    return res.status(200).json({
      data: {
        message: 'Live sync completed',
        results: allResults,
        syncTime: lastSyncTime.toISOString(),
      },
    });
  } catch (err) {
    console.error('Error in live-sync:', err);
    return res.status(500).json({ error: 'Failed to sync live stats' });
  }
}

async function liveSyncForGame(gameSlug: string, apiKey: string, now: Date) {
  const BASE_URL = getSportsRadarBaseUrl(gameSlug);

  // Fetch today's schedule (use Eastern time for date, since games are US-based)
  const etDateStr = now.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // etDateStr is "MM/DD/YYYY"
  const [mm, dd, yyyy] = etDateStr.split('/');
  const year = yyyy;
  const month = mm;
  const day = dd;

  const scheduleRes = await fetch(
    `${BASE_URL}/games/${year}/${month}/${day}/schedule.json?api_key=${apiKey}`
  );

  if (!scheduleRes.ok) {
    console.error(`SportsRadar schedule API error for ${gameSlug}:`, scheduleRes.status);
    return { gamesFound: 0, gamesPolled: 0, statsUpserted: 0, error: `Schedule API ${scheduleRes.status}` };
  }

  const scheduleData = await scheduleRes.json();
  const allGames = scheduleData.games || [];

  if (allGames.length === 0) {
    return { gamesFound: 0, gamesPolled: 0, statsUpserted: 0 };
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
          gameSlug,
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
        gameSlug,
      });
    }
  }

  // Get our tournament team names for this game to filter summary calls
  const ourTeamRows = await db
    .select({ name: ncaaTeams.name, shortName: ncaaTeams.shortName })
    .from(ncaaTeams)
    .where(eq(ncaaTeams.gameSlug, gameSlug));
  const ourTeamNames = new Set(
    ourTeamRows.flatMap((t) => [t.name.toLowerCase(), t.shortName.toLowerCase()])
  );

  // Only poll games that: (1) already started AND (2) involve a tournament team
  const liveGames = allGames.filter((g: { scheduled?: string; home?: { name?: string }; away?: { name?: string } }) => {
    if (!g.scheduled || new Date(g.scheduled) > now) return false;
    const homeName = (g.home?.name || '').toLowerCase();
    const awayName = (g.away?.name || '').toLowerCase();
    return [...ourTeamNames].some((tn) => homeName.includes(tn) || awayName.includes(tn));
  });

  let statsUpserted = 0;
  let totalSrPlayers = 0;
  let matchedPlayers = 0;
  let failedSummaries = 0;
  const debugGames: { id: string; home: string; away: string; players: number; matched: number }[] = [];

  for (const game of liveGames) {
    const gameId = game.id;
    if (!gameId) continue;

    // Rate limit: 1.1s between SportsRadar calls
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const summaryRes = await fetch(
      `${BASE_URL}/games/${gameId}/summary.json?api_key=${apiKey}`
    );

    if (!summaryRes.ok) {
      console.error(`Failed to fetch summary for game ${gameId}:`, summaryRes.status);
      failedSummaries++;
      continue;
    }

    const summary = await summaryRes.json();
    const round = game.title || game.round || 'first_four';
    const gameDate = new Date(game.scheduled || now);

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

    let gamePlayerCount = 0;
    let gameMatchCount = 0;

    // Process player stats from both teams
    const teams = [summary.home, summary.away].filter(Boolean);
    for (const team of teams) {
      const teamPlayers = team.players || [];
      for (const playerData of teamPlayers) {
        const srPlayerId = playerData.id;
        if (!srPlayerId) continue;

        totalSrPlayers++;
        gamePlayerCount++;

        const stats = playerData.statistics || {};
        const pts = stats.points || 0;
        const reb = stats.rebounds || 0;
        const ast = stats.assists || 0;

        // Find matching player in our DB by SportsRadar ID + game
        const [dbPlayer] = await db
          .select({ id: players.id })
          .from(players)
          .where(and(eq(players.sportRadarPlayerId, srPlayerId), eq(players.gameSlug, gameSlug)))
          .limit(1);

        if (!dbPlayer) continue;

        matchedPlayers++;
        gameMatchCount++;

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
            gameSlug,
          });
        }

        statsUpserted++;
      }
    }

    debugGames.push({
      id: gameId,
      home: summary.home?.name || '?',
      away: summary.away?.name || '?',
      players: gamePlayerCount,
      matched: gameMatchCount,
    });
  }

  return {
    gamesFound: allGames.length,
    gamesPolled: liveGames.length,
    statsUpserted,
    debug: {
      totalSrPlayers,
      matchedPlayers,
      failedSummaries,
      games: debugGames,
    },
  };
}
