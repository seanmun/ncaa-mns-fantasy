import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { verifyAuth, isAdmin } from '../_middleware.js';
import { db, schema } from '../_db.js';

const { ncaaTeams, players } = schema;

interface TourneyTeam {
  id: string;
  name: string;
  alias: string;
  seed: number;
  region: string;
}

/**
 * POST /api/admin/import-players
 *
 * Two-step SportsRadar import (admin-only):
 *   step=teams   → fetches tournament schedule for all 68 teams with seeds + regions
 *   step=players → fetches season stats per team, upserts players (batched)
 *
 * Query params:
 *   step       — "teams" | "players" (default: "teams")
 *   batchSize  — number of teams to process in player step (default 25)
 *   offset     — skip N teams already processed (default 0)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await verifyAuth(req);
  if (!userId || !isAdmin(userId)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const BASE_URL = process.env.SPORTSRADAR_BASE_URL;
  const API_KEY = process.env.SPORTSRADAR_API_KEY;

  if (!BASE_URL || !API_KEY) {
    return res.status(500).json({ error: 'SportsRadar API not configured' });
  }

  const step = (req.query.step as string) || 'teams';

  try {
    if (step === 'teams') {
      return await importTeams(res, BASE_URL, API_KEY);
    } else if (step === 'players') {
      const batchSize = Math.min(Number(req.query.batchSize) || 25, 50);
      const offset = Number(req.query.offset) || 0;
      return await importPlayers(res, BASE_URL, API_KEY, batchSize, offset);
    } else {
      return res.status(400).json({ error: 'Invalid step. Use "teams" or "players".' });
    }
  } catch (err) {
    console.error('Import error:', err);
    return res.status(500).json({ error: 'Import failed' });
  }
}

/* ------------------------------------------------------------------ */
/*  Step 1: Import all 68 tournament teams from bracket schedule       */
/* ------------------------------------------------------------------ */

async function importTeams(
  res: VercelResponse,
  baseUrl: string,
  apiKey: string
) {
  const tourneyYear = process.env.TOURNAMENT_YEAR || '2026';

  // First Four: Tue Mar 17 + Wed Mar 18
  // Round of 64: Thu Mar 19 + Fri Mar 20
  // Round of 32: Sat Mar 21 + Sun Mar 22
  const dates = [
    `${tourneyYear}/03/17`,
    `${tourneyYear}/03/18`,
    `${tourneyYear}/03/19`,
    `${tourneyYear}/03/20`,
    `${tourneyYear}/03/21`,
    `${tourneyYear}/03/22`,
  ];

  const teams = new Map<string, TourneyTeam>();
  const errors: string[] = [];

  for (const date of dates) {
    // Respect SportsRadar trial rate limit (1 req/sec)
    await new Promise((r) => setTimeout(r, 1200));

    try {
      const schedRes = await fetch(
        `${baseUrl}/games/${date}/schedule.json?api_key=${apiKey}`
      );

      if (!schedRes.ok) {
        const msg = `Schedule API error for ${date}: ${schedRes.status}`;
        console.error(msg);
        errors.push(msg);
        continue;
      }

      const data = await schedRes.json();

      for (const game of data.games || []) {
        const title: string = game.title || '';
        // Extract region from titles like "East Regional - First Round - Game 2"
        // Also handles "Midwest Regional", "South Regional", "West Regional"
        const regionMatch = title.match(/^(\w+)\s+Regional/);
        const region = regionMatch ? regionMatch[1] : 'TBD';

        for (const side of ['home', 'away'] as const) {
          const t = game[side];
          if (!t?.id || teams.has(t.id)) continue;
          // Skip TBD placeholder teams and First Four winner placeholders
          if (t.alias === 'TBD' || !t.alias) continue;

          teams.set(t.id, {
            id: t.id,
            name: `${t.market || ''} ${t.name || ''}`.trim(),
            alias: t.alias || '',
            seed: t.seed ?? 0,
            region,
          });
        }
      }
    } catch (err) {
      const msg = `Failed to fetch schedule for ${date}: ${err}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  if (teams.size === 0) {
    return res.status(200).json({
      data: {
        message: 'No tournament games found. Bracket may not be announced yet.',
        teamsInserted: 0,
        teamsUpdated: 0,
        totalProcessed: 0,
        errors,
      },
    });
  }

  let teamsInserted = 0;
  let teamsUpdated = 0;

  for (const team of teams.values()) {
    const [existing] = await db
      .select({ id: ncaaTeams.id, region: ncaaTeams.region })
      .from(ncaaTeams)
      .where(eq(ncaaTeams.sportRadarTeamId, team.id))
      .limit(1);

    if (existing) {
      // Don't overwrite a real region with TBD
      const newRegion =
        team.region !== 'TBD' ? team.region : existing.region || 'TBD';

      await db
        .update(ncaaTeams)
        .set({
          name: team.name,
          shortName: team.alias,
          seed: team.seed,
          region: newRegion,
        })
        .where(eq(ncaaTeams.id, existing.id));
      teamsUpdated++;
    } else {
      await db.insert(ncaaTeams).values({
        name: team.name,
        shortName: team.alias,
        seed: team.seed,
        region: team.region,
        sportRadarTeamId: team.id,
        isEliminated: false,
      });
      teamsInserted++;
    }
  }

  return res.status(200).json({
    data: {
      message: `Tournament teams imported (${teams.size} teams from bracket)`,
      teamsInserted,
      teamsUpdated,
      totalProcessed: teamsInserted + teamsUpdated,
      errors,
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Step 2: Import players + season averages for a batch of teams       */
/* ------------------------------------------------------------------ */

async function importPlayers(
  res: VercelResponse,
  baseUrl: string,
  apiKey: string,
  batchSize: number,
  offset: number
) {
  const tourneyYear = process.env.TOURNAMENT_YEAR || '2026';

  // Get teams from DB that have a SportsRadar ID
  const allTeams = await db
    .select({
      id: ncaaTeams.id,
      sportRadarTeamId: ncaaTeams.sportRadarTeamId,
      name: ncaaTeams.name,
    })
    .from(ncaaTeams)
    .orderBy(ncaaTeams.name);

  const teamsWithSrId = allTeams.filter((t) => t.sportRadarTeamId);
  const batch = teamsWithSrId.slice(offset, offset + batchSize);

  if (batch.length === 0) {
    return res.status(200).json({
      data: {
        message: 'No more teams to process',
        playersUpserted: 0,
        teamsProcessed: 0,
        totalTeams: teamsWithSrId.length,
        offset,
        done: true,
      },
    });
  }

  let playersUpserted = 0;
  let teamsProcessed = 0;
  let teamsErrored = 0;

  for (const team of batch) {
    // Respect SportsRadar trial rate limit (1 req/sec)
    if (teamsProcessed > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    try {
      const statsRes = await fetch(
        `${baseUrl}/seasons/${tourneyYear}/REG/teams/${team.sportRadarTeamId}/statistics.json?api_key=${apiKey}`
      );

      if (!statsRes.ok) {
        console.error(
          `Failed to fetch stats for ${team.name} (${team.sportRadarTeamId}): ${statsRes.status}`
        );
        teamsErrored++;
        teamsProcessed++;
        continue;
      }

      const statsData = await statsRes.json();
      const teamPlayers = statsData.players || [];

      for (const p of teamPlayers) {
        const srPlayerId = p.id;
        if (!srPlayerId) continue;

        const avg = p.average || {};
        const avgPts = String(avg.points ?? 0);
        const avgReb = String(avg.rebounds ?? 0);
        const avgAst = String(avg.assists ?? 0);

        // Check if player already exists by SportsRadar ID
        const [existing] = await db
          .select({ id: players.id })
          .from(players)
          .where(eq(players.sportRadarPlayerId, srPlayerId))
          .limit(1);

        if (existing) {
          await db
            .update(players)
            .set({
              name: p.full_name,
              jersey: p.jersey_number || null,
              position: p.position || null,
              avgPts,
              avgReb,
              avgAst,
              teamId: team.id,
              isActive: true,
            })
            .where(eq(players.id, existing.id));
        } else {
          await db.insert(players).values({
            teamId: team.id,
            name: p.full_name,
            jersey: p.jersey_number || null,
            position: p.position || null,
            avgPts,
            avgReb,
            avgAst,
            sportRadarPlayerId: srPlayerId,
            isActive: true,
          });
        }

        playersUpserted++;
      }

      teamsProcessed++;
    } catch (err) {
      console.error(`Error processing team ${team.name}:`, err);
      teamsErrored++;
      teamsProcessed++;
    }
  }

  const nextOffset = offset + batchSize;
  const done = nextOffset >= teamsWithSrId.length;

  return res.status(200).json({
    data: {
      message: done
        ? 'Player import complete!'
        : `Batch complete. Call again with offset=${nextOffset} for next batch.`,
      playersUpserted,
      teamsProcessed,
      teamsErrored,
      totalTeams: teamsWithSrId.length,
      offset,
      nextOffset: done ? null : nextOffset,
      done,
    },
  });
}
