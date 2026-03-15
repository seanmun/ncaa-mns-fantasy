import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { verifyAuth, isAdmin } from '../_middleware';
import { db, schema } from '../_db';

const { ncaaTeams, players } = schema;

/**
 * POST /api/admin/import-players
 *
 * Two-step SportsRadar import (admin-only):
 *   step=teams   → fetches hierarchy, upserts all teams (1 API call, fast)
 *   step=players  → fetches season stats per team, upserts players (batched)
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
/*  Step 1: Import all teams from hierarchy                            */
/* ------------------------------------------------------------------ */

async function importTeams(
  res: VercelResponse,
  baseUrl: string,
  apiKey: string
) {
  const hierarchyRes = await fetch(
    `${baseUrl}/league/hierarchy.json?api_key=${apiKey}`
  );

  if (!hierarchyRes.ok) {
    return res.status(502).json({
      error: `SportsRadar hierarchy API returned ${hierarchyRes.status}`,
    });
  }

  const data = await hierarchyRes.json();
  let teamsInserted = 0;
  let teamsUpdated = 0;

  // Only import NCAA Division I teams (the tournament field comes from D1)
  const d1Division = (data.divisions || []).find(
    (d: { alias?: string; name?: string }) =>
      d.alias === 'D1' || d.name === 'NCAA Division I'
  );

  if (!d1Division) {
    return res.status(502).json({ error: 'D1 division not found in hierarchy' });
  }

  // Walk D1 conferences → teams
  for (const conference of d1Division.conferences || []) {
    for (const team of conference.teams || []) {
        const srId = team.id;
        const name = `${team.market} ${team.name}`; // e.g. "Duke Blue Devils"
        const shortName = team.alias || team.market || '';

        // Check if team already exists by SportsRadar ID
        const [existing] = await db
          .select({ id: ncaaTeams.id })
          .from(ncaaTeams)
          .where(eq(ncaaTeams.sportRadarTeamId, srId))
          .limit(1);

        if (existing) {
          await db
            .update(ncaaTeams)
            .set({ name, shortName })
            .where(eq(ncaaTeams.id, existing.id));
          teamsUpdated++;
        } else {
          await db.insert(ncaaTeams).values({
            name,
            shortName,
            seed: 0,        // Will be set when tournament bracket is announced
            region: 'TBD',  // Will be set when tournament bracket is announced
            sportRadarTeamId: srId,
            isEliminated: false,
          });
          teamsInserted++;
        }
      }
    }

  return res.status(200).json({
    data: {
      message: 'Teams imported from SportsRadar hierarchy',
      teamsInserted,
      teamsUpdated,
      totalProcessed: teamsInserted + teamsUpdated,
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
    // Respect SportsRadar trial rate limit (~1 req/sec)
    if (teamsProcessed > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1100));
    }

    try {
      const statsRes = await fetch(
        `${baseUrl}/seasons/2025/REG/teams/${team.sportRadarTeamId}/statistics.json?api_key=${apiKey}`
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
