import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and } from 'drizzle-orm';
import Papa from 'papaparse';
import { verifyAuth, isAdmin } from '../_middleware';
import { db, schema } from '../_db';

const { players, ncaaTeams } = schema;

interface PlayerCSVRow {
  player_name: string;
  team_name: string;
  team_short_name?: string;
  seed: string;
  region: string;
  jersey?: string;
  position?: string;
  avg_pts?: string;
  avg_reb?: string;
  avg_ast?: string;
  sportsradar_player_id?: string;
  sportsradar_team_id?: string;
  logo_url?: string;
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

  try {
    const { csv } = req.body || {};
    if (!csv || typeof csv !== 'string') {
      return res.status(400).json({ error: 'CSV string is required in body as "csv"' });
    }

    const parsed = Papa.parse<PlayerCSVRow>(csv, {
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

    const rows = parsed.data;
    if (rows.length === 0) {
      return res.status(400).json({ error: 'CSV contains no data rows' });
    }

    // Track unique teams and players
    const teamMap = new Map<string, string>(); // "teamName-seed" -> teamId
    let teamsUpserted = 0;
    let playersUpserted = 0;

    for (const row of rows) {
      if (!row.player_name || !row.team_name || !row.seed || !row.region) {
        continue; // Skip incomplete rows
      }

      const seed = parseInt(row.seed, 10);
      if (isNaN(seed) || seed < 1 || seed > 16) {
        continue; // Skip invalid seeds
      }

      const teamKey = `${row.team_name.trim()}-${seed}`;

      // Upsert team if not already processed
      if (!teamMap.has(teamKey)) {
        // Check if team exists
        const [existingTeam] = await db
          .select({ id: ncaaTeams.id })
          .from(ncaaTeams)
          .where(
            and(
              eq(ncaaTeams.name, row.team_name.trim()),
              eq(ncaaTeams.seed, seed)
            )
          )
          .limit(1);

        if (existingTeam) {
          // Update existing team
          await db
            .update(ncaaTeams)
            .set({
              shortName: row.team_short_name?.trim() || row.team_name.trim().substring(0, 5).toUpperCase(),
              region: row.region.trim(),
              sportRadarTeamId: row.sportsradar_team_id?.trim() || undefined,
              logoUrl: row.logo_url?.trim() || undefined,
            })
            .where(eq(ncaaTeams.id, existingTeam.id));

          teamMap.set(teamKey, existingTeam.id);
        } else {
          // Insert new team
          const [newTeam] = await db
            .insert(ncaaTeams)
            .values({
              name: row.team_name.trim(),
              shortName: row.team_short_name?.trim() || row.team_name.trim().substring(0, 5).toUpperCase(),
              seed,
              region: row.region.trim(),
              sportRadarTeamId: row.sportsradar_team_id?.trim() || null,
              logoUrl: row.logo_url?.trim() || null,
            })
            .returning();

          teamMap.set(teamKey, newTeam.id);
          teamsUpserted++;
        }
      }

      const teamId = teamMap.get(teamKey)!;

      // Upsert player
      // Check if player with same name on same team exists
      const [existingPlayer] = await db
        .select({ id: players.id })
        .from(players)
        .where(
          and(
            eq(players.name, row.player_name.trim()),
            eq(players.teamId, teamId)
          )
        )
        .limit(1);

      if (existingPlayer) {
        await db
          .update(players)
          .set({
            jersey: row.jersey?.trim() || null,
            position: row.position?.trim() || null,
            avgPts: row.avg_pts || '0',
            avgReb: row.avg_reb || '0',
            avgAst: row.avg_ast || '0',
            sportRadarPlayerId: row.sportsradar_player_id?.trim() || null,
            isActive: true,
          })
          .where(eq(players.id, existingPlayer.id));
      } else {
        await db.insert(players).values({
          name: row.player_name.trim(),
          teamId,
          jersey: row.jersey?.trim() || null,
          position: row.position?.trim() || null,
          avgPts: row.avg_pts || '0',
          avgReb: row.avg_reb || '0',
          avgAst: row.avg_ast || '0',
          sportRadarPlayerId: row.sportsradar_player_id?.trim() || null,
        });
      }

      playersUpserted++;
    }

    return res.status(200).json({
      data: {
        message: 'Player pool import completed',
        teamsUpserted,
        playersUpserted,
        totalRowsProcessed: rows.length,
      },
    });
  } catch (err) {
    console.error('Error uploading players:', err);
    return res.status(500).json({ error: 'Failed to import player pool' });
  }
}
