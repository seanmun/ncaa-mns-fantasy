import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, isAdmin } from '../_middleware.js';
import { db, schema } from '../_db.js';
import { getSportsRadarBaseUrl, getActiveGameSlugs } from '../../src/lib/gameConfig.js';

const { players, ncaaTeams, playerTournamentStats, activeGames } = schema;

// In-memory last sync tracker (per cold start — for persistent tracking use DB)
let lastSyncTime: Date | null = null;
const MIN_SYNC_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes (reduced for manual testing)

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

    const API_KEY = process.env.SPORTSRADAR_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: 'SportsRadar API not configured' });
    }

    // If game_slug provided, sync only that game; otherwise sync all
    const requestedSlug = req.query.game_slug as string | undefined;
    const gameSlugs = requestedSlug ? [requestedSlug] : getActiveGameSlugs();

    // Determine which date to sync: "yesterday", "today" (default), or "YYYY-MM-DD"
    const dateParam = (req.query.date as string) || 'today';

    const allResults: Record<string, { gamesProcessed: number; statsUpserted: number; teamsEliminated: number; scoreboardUpdated: number; debug?: string[] }> = {};
  const debugInfo: string[] = [];

    for (const gameSlug of gameSlugs) {
      const result = await syncForGame(gameSlug, API_KEY, dateParam, debugInfo);
      allResults[gameSlug] = { ...result, debug: debugInfo };
    }

    lastSyncTime = new Date();

    return res.status(200).json({
      data: {
        message: 'Stats sync completed',
        results: allResults,
        syncTime: lastSyncTime.toISOString(),
      },
    });
  } catch (err) {
    console.error('Error syncing stats:', err);
    return res.status(500).json({ error: 'Failed to sync stats' });
  }
}

async function syncForGame(gameSlug: string, apiKey: string, dateParam: string, debugInfo: string[] = []) {
  const BASE_URL = getSportsRadarBaseUrl(gameSlug);

  // Resolve which date to sync
  const targetDate = new Date();
  if (dateParam === 'yesterday') {
    targetDate.setDate(targetDate.getDate() - 1);
  } else if (dateParam !== 'today' && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    const [y, m, d] = dateParam.split('-').map(Number);
    targetDate.setFullYear(y, m - 1, d);
  }
  // else "today" — use current date as-is

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');

  const scheduleRes = await fetch(
    `${BASE_URL}/games/${year}/${month}/${day}/schedule.json?api_key=${apiKey}`
  );

  if (!scheduleRes.ok) {
    console.error(`SportsRadar schedule API error for ${gameSlug} ${year}/${month}/${day}:`, scheduleRes.status);
    return { gamesProcessed: 0, statsUpserted: 0, teamsEliminated: 0, scoreboardUpdated: 0 };
  }

  const scheduleData = await scheduleRes.json();
  const games = scheduleData.games || [];

  console.log(`[${gameSlug}] Schedule for ${year}/${month}/${day}: ${games.length} games found`);

  if (games.length === 0) {
    console.log(`[${gameSlug}] No games in schedule for ${year}/${month}/${day}`);
    return { gamesProcessed: 0, statsUpserted: 0, teamsEliminated: 0, scoreboardUpdated: 0 };
  }

  // Get our tournament team SportsRadar IDs to filter which games need summaries
  const ourTeamRows = await db
    .select({ sportRadarTeamId: ncaaTeams.sportRadarTeamId })
    .from(ncaaTeams)
    .where(eq(ncaaTeams.gameSlug, gameSlug));
  const ourTeamIds = new Set(
    ourTeamRows.map((t) => t.sportRadarTeamId).filter(Boolean)
  );

  console.log(`[${gameSlug}] Found ${ourTeamIds.size} tournament teams in database`);

  let statsUpserted = 0;
  let scoreboardUpdated = 0;
  let apiCallsSaved = 0;
  const eliminatedTeamIds: { srTeamId: string; round: string }[] = [];
  const errors: string[] = [];
  let boxScoresFetched = 0;
  let playersNotMatched = 0;

  for (const game of games) {
    const gameId = game.id;
    if (!gameId) continue;

    const isTournamentGame = ourTeamIds.has(game.home?.id) || ourTeamIds.has(game.away?.id);

    // Skip non-tournament games entirely (NIT, WNIT, CBI, etc.)
    if (!isTournamentGame) {
      apiCallsSaved++;
      console.log(`[${gameSlug}] Skipping non-tournament game: ${game.away?.name || 'TBD'} @ ${game.home?.name || 'TBD'}`);
      continue;
    }

    const round = game.title || game.round || 'unknown';
    const gameDate = new Date(game.scheduled || targetDate);
    const scheduledTime = game.scheduled ? new Date(game.scheduled) : null;

    // Update activeGames scoreboard from schedule data (no extra API call needed)
    const homeName = game.home?.name || game.home?.alias || 'TBD';
    const awayName = game.away?.name || game.away?.alias || 'TBD';
    const scheduleHomeScore = game.home?.points ?? 0;
    const scheduleAwayScore = game.away?.points ?? 0;
    const scheduleStatus = game.status || 'unknown';
    // Don't overwrite real scores with 0-0 from schedule data
    const hasRealScores = scheduleHomeScore > 0 || scheduleAwayScore > 0;

    const [existingGame] = await db
      .select({ id: activeGames.id, homeScore: activeGames.homeScore, awayScore: activeGames.awayScore })
      .from(activeGames)
      .where(eq(activeGames.srGameId, gameId))
      .limit(1);

    if (existingGame) {
      const existingHasScores = (existingGame.homeScore ?? 0) > 0 || (existingGame.awayScore ?? 0) > 0;
      await db
        .update(activeGames)
        .set({
          homeTeamName: homeName,
          awayTeamName: awayName,
          // Only update scores if schedule has real scores, or existing has none
          ...(hasRealScores || !existingHasScores
            ? { homeScore: scheduleHomeScore, awayScore: scheduleAwayScore }
            : {}),
          status: scheduleStatus,
          scheduledTime,
          gameSlug,
          updatedAt: new Date(),
        })
        .where(eq(activeGames.id, existingGame.id));
    } else {
      await db.insert(activeGames).values({
        srGameId: gameId,
        homeTeamName: homeName,
        awayTeamName: awayName,
        homeScore: scheduleHomeScore,
        awayScore: scheduleAwayScore,
        status: scheduleStatus,
        scheduledTime,
        gameSlug,
      });
    }
    scoreboardUpdated++;

    // Fetch box score for ALL tournament games (don't filter by status)
    console.log(`[${gameSlug}] Fetching stats for game: ${awayName} @ ${homeName} (status: ${scheduleStatus})`);

    // Add small delay to respect API rate limits
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const boxScoreRes = await fetch(
      `${BASE_URL}/games/${gameId}/summary.json?api_key=${apiKey}`
    );

    if (!boxScoreRes.ok) {
      const errMsg = `Box score API failed: ${awayName}@${homeName} - HTTP ${boxScoreRes.status}`;
      errors.push(errMsg);
      console.error(`[${gameSlug}] ${errMsg}`);
      continue;
    }

    boxScoresFetched++;

    const boxScore = await boxScoreRes.json();
    console.log(`[${gameSlug}] Box score fetched for ${gameId}, status: ${boxScore.status}`);
    const gameStatus = boxScore.status || game.status || 'unknown';

    // Update scoreboard with more accurate summary scores
    const homeScore = boxScore.home?.points ?? 0;
    const awayScore = boxScore.away?.points ?? 0;
    await db
      .update(activeGames)
      .set({
        homeScore,
        awayScore,
        status: gameStatus,
        updatedAt: new Date(),
      })
      .where(eq(activeGames.srGameId, gameId));

    // Determine the losing team for elimination — ONLY from completed games
    if (
      (gameStatus === 'closed' || gameStatus === 'complete') &&
      boxScore.home?.points !== undefined &&
      boxScore.away?.points !== undefined &&
      boxScore.home.points !== boxScore.away.points
    ) {
      const losingTeam =
        boxScore.home.points < boxScore.away.points ? boxScore.home : boxScore.away;
      if (losingTeam.id) {
        eliminatedTeamIds.push({ srTeamId: losingTeam.id, round });
      }
    }

    // Process player stats from both teams
    const teams = [boxScore.home, boxScore.away].filter(Boolean);
    console.log(`[${gameSlug}] Processing ${teams.length} teams for game ${gameId}`);

    for (const team of teams) {
      const teamPlayers = team.players || [];
      const srTeamId = team.id;
      console.log(`[${gameSlug}] Team ${team.name || 'unknown'} (SR ID: ${srTeamId}) has ${teamPlayers.length} players in box score`);

      // DIAGNOSTIC: Check if this team exists in our DB
      const [dbTeam] = await db
        .select({ id: ncaaTeams.id, name: ncaaTeams.name, sportRadarTeamId: ncaaTeams.sportRadarTeamId })
        .from(ncaaTeams)
        .where(and(eq(ncaaTeams.sportRadarTeamId, srTeamId), eq(ncaaTeams.gameSlug, gameSlug)))
        .limit(1);

      if (!dbTeam) {
        console.error(`[${gameSlug}] ⚠️ TEAM NOT IN DATABASE: ${team.name} (SR ID: ${srTeamId})`);
        continue;
      }

      console.log(`[${gameSlug}] ✓ Team found in DB: ${dbTeam.name}`);

      // DIAGNOSTIC: Get all players for this team from DB to see what SR IDs we have
      const dbTeamPlayers = await db
        .select({
          id: players.id,
          name: players.name,
          sportRadarPlayerId: players.sportRadarPlayerId
        })
        .from(players)
        .where(and(eq(players.teamId, dbTeam.id), eq(players.gameSlug, gameSlug)));

      console.log(`[${gameSlug}] DB has ${dbTeamPlayers.length} players for ${dbTeam.name}, ${dbTeamPlayers.filter(p => p.sportRadarPlayerId).length} have SR IDs`);

      for (const playerData of teamPlayers) {
        const srPlayerId = playerData.id;
        if (!srPlayerId) {
          console.log(`[${gameSlug}] ⚠️ Player from box score has no ID: ${playerData.full_name || playerData.name}`);
          continue;
        }

        const stats = playerData.statistics || {};
        const pts = stats.points || 0;
        const reb = (stats.rebounds || 0) + (stats.offensive_rebounds || 0) + (stats.defensive_rebounds || 0);
        const ast = stats.assists || 0;

        // Find matching player in our DB by SportsRadar ID + game
        const [dbPlayer] = await db
          .select({ id: players.id, name: players.name })
          .from(players)
          .where(and(eq(players.sportRadarPlayerId, srPlayerId), eq(players.gameSlug, gameSlug)))
          .limit(1);

        if (!dbPlayer) {
          playersNotMatched++;
          console.error(`[${gameSlug}] ❌ PLAYER NOT FOUND: ${playerData.full_name || playerData.name} (SR ID: ${srPlayerId})`);
          console.error(`[${gameSlug}]    Box score team: ${team.name} (${srTeamId})`);
          console.error(`[${gameSlug}]    Stats: ${pts}pts ${reb}reb ${ast}ast`);

          // DIAGNOSTIC: Try to find player by team only
          const [playerByTeam] = await db
            .select({ id: players.id, name: players.name, sportRadarPlayerId: players.sportRadarPlayerId })
            .from(players)
            .where(and(eq(players.teamId, dbTeam.id), eq(players.gameSlug, gameSlug)))
            .limit(1);

          if (playerByTeam) {
            console.error(`[${gameSlug}]    Example player from this team in DB: ${playerByTeam.name} (SR ID: ${playerByTeam.sportRadarPlayerId || 'NULL'})`);
          } else {
            console.error(`[${gameSlug}]    No players found in DB for team ${dbTeam.name}`);
          }

          continue;
        }

        console.log(`[${gameSlug}] ✓ Matched player: ${dbPlayer.name} - ${pts}pts, ${reb}reb, ${ast}ast`);

        // Upsert tournament stats
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
            gameSlug,
          });
        }

        statsUpserted++;
      }
    }
  }

  // Mark eliminated teams (only from completed games)
  let teamsEliminated = 0;
  for (const { srTeamId, round } of eliminatedTeamIds) {
    const result = await db
      .update(ncaaTeams)
      .set({
        isEliminated: true,
        eliminatedInRound: round,
      })
      .where(
        and(
          eq(ncaaTeams.sportRadarTeamId, srTeamId),
          eq(ncaaTeams.gameSlug, gameSlug),
          eq(ncaaTeams.isEliminated, false)
        )
      )
      .returning();

    if (result.length > 0) teamsEliminated++;
  }

  return {
    gamesProcessed: games.length,
    statsUpserted,
    teamsEliminated,
    scoreboardUpdated,
    boxScoresFetched,
    playersNotMatched,
    errors: errors.length > 0 ? errors : undefined
  };
}
