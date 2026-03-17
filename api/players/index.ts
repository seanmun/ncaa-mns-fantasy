import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, inArray, and } from 'drizzle-orm';
import { verifyAuth } from '../_middleware.js';
import { db, schema } from '../_db.js';

const { players, ncaaTeams } = schema;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await verifyAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const seedTier = req.query.seed_tier as string | undefined;

    let query = db
      .select({
        id: players.id,
        name: players.name,
        jersey: players.jersey,
        position: players.position,
        avgPts: players.avgPts,
        avgReb: players.avgReb,
        avgAst: players.avgAst,
        isActive: players.isActive,
        teamId: ncaaTeams.id,
        teamName: ncaaTeams.name,
        teamShortName: ncaaTeams.shortName,
        seed: ncaaTeams.seed,
        region: ncaaTeams.region,
        isEliminated: ncaaTeams.isEliminated,
        logoUrl: ncaaTeams.logoUrl,
      })
      .from(players)
      .innerJoin(ncaaTeams, eq(ncaaTeams.id, players.teamId))
      .$dynamic();

    // Filter by seed tier if provided, always exclude inactive players
    if (seedTier) {
      const tier = parseInt(seedTier, 10);
      let seeds: number[] = [];

      switch (tier) {
        case 1:
          seeds = [1, 2, 3, 4];
          break;
        case 2:
          seeds = [5, 6, 7, 8];
          break;
        case 3:
          seeds = [9, 10, 11, 12];
          break;
        case 4:
          seeds = [13, 14, 15, 16];
          break;
        default:
          return res.status(400).json({ error: 'Invalid seed_tier. Must be 1, 2, 3, or 4.' });
      }

      query = query.where(and(eq(players.isActive, true), inArray(ncaaTeams.seed, seeds)));
    } else {
      query = query.where(eq(players.isActive, true));
    }

    const rows = await query;

    // Nest team fields into a `team` object to match PlayerWithTeam type
    const result = rows.map((row) => ({
      id: row.id,
      name: row.name,
      jersey: row.jersey,
      position: row.position,
      avgPts: row.avgPts,
      avgReb: row.avgReb,
      avgAst: row.avgAst,
      isActive: row.isActive,
      teamId: row.teamId,
      team: {
        id: row.teamId,
        name: row.teamName,
        shortName: row.teamShortName,
        seed: row.seed,
        region: row.region,
        isEliminated: row.isEliminated,
        logoUrl: row.logoUrl,
      },
    }));

    return res.status(200).json({ data: result });
  } catch (err) {
    console.error('Error fetching players:', err);
    return res.status(500).json({ error: 'Failed to fetch players' });
  }
}
