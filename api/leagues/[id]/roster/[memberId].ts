import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and, sql } from 'drizzle-orm';
import { verifyAuth } from '../../../_middleware.js';
import { db, schema } from '../../../_db.js';

const { leagueMembers, rosters, players, ncaaTeams, playerTournamentStats } = schema;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const leagueId = req.query.id as string;
  const memberId = req.query.memberId as string;

  if (!leagueId || !memberId) {
    return res.status(400).json({ error: 'League ID and Member ID are required' });
  }

  const userId = await verifyAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Verify the requesting user is a member of this league
    const [requestingMember] = await db
      .select()
      .from(leagueMembers)
      .where(
        and(
          eq(leagueMembers.leagueId, leagueId),
          eq(leagueMembers.userId, userId)
        )
      )
      .limit(1);

    if (!requestingMember) {
      return res.status(403).json({ error: 'Not a member of this league' });
    }

    // Verify the target member belongs to this league
    // Support lookup by memberId (UUID) or userId (Clerk ID string)
    // UUID regex: try UUID lookup first, fall back to userId lookup for Clerk IDs
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(memberId);

    let targetMember: typeof leagueMembers.$inferSelect | undefined;

    if (isUuid) {
      [targetMember] = await db
        .select()
        .from(leagueMembers)
        .where(
          and(
            eq(leagueMembers.id, memberId),
            eq(leagueMembers.leagueId, leagueId)
          )
        )
        .limit(1);
    }

    // Fallback: try looking up by userId (for PickRoster which passes Clerk user.id)
    if (!targetMember) {
      [targetMember] = await db
        .select()
        .from(leagueMembers)
        .where(
          and(
            eq(leagueMembers.userId, memberId),
            eq(leagueMembers.leagueId, leagueId)
          )
        )
        .limit(1);
    }

    if (!targetMember) {
      return res.status(404).json({ error: 'Member not found in this league' });
    }

    // Get roster players with team info and tournament stats
    const rosterPlayers = await db
      .select({
        rosterId: rosters.id,
        playerId: players.id,
        playerName: players.name,
        jersey: players.jersey,
        position: players.position,
        avgPts: players.avgPts,
        avgReb: players.avgReb,
        avgAst: players.avgAst,
        playerIsActive: players.isActive,
        teamId: ncaaTeams.id,
        teamName: ncaaTeams.name,
        teamShortName: ncaaTeams.shortName,
        seed: ncaaTeams.seed,
        region: ncaaTeams.region,
        isEliminated: ncaaTeams.isEliminated,
        eliminatedInRound: ncaaTeams.eliminatedInRound,
        logoUrl: ncaaTeams.logoUrl,
        totalPts: sql<number>`COALESCE(SUM(${playerTournamentStats.pts}), 0)`.as('total_pts'),
        totalReb: sql<number>`COALESCE(SUM(${playerTournamentStats.reb}), 0)`.as('total_reb'),
        totalAst: sql<number>`COALESCE(SUM(${playerTournamentStats.ast}), 0)`.as('total_ast'),
        totalScore:
          sql<number>`COALESCE(SUM(${playerTournamentStats.pts}), 0) + COALESCE(SUM(${playerTournamentStats.reb}), 0) + COALESCE(SUM(${playerTournamentStats.ast}), 0)`.as(
            'total_score'
          ),
        gamesPlayed: sql<number>`COUNT(DISTINCT ${playerTournamentStats.id})`.as('games_played'),
      })
      .from(rosters)
      .innerJoin(players, eq(players.id, rosters.playerId))
      .innerJoin(ncaaTeams, eq(ncaaTeams.id, players.teamId))
      .leftJoin(playerTournamentStats, eq(playerTournamentStats.playerId, players.id))
      .where(eq(rosters.memberId, targetMember.id))
      .groupBy(
        rosters.id,
        players.id,
        players.name,
        players.jersey,
        players.position,
        players.avgPts,
        players.avgReb,
        players.avgAst,
        players.isActive,
        ncaaTeams.id,
        ncaaTeams.name,
        ncaaTeams.shortName,
        ncaaTeams.seed,
        ncaaTeams.region,
        ncaaTeams.isEliminated,
        ncaaTeams.eliminatedInRound,
        ncaaTeams.logoUrl
      )
      .orderBy(sql`total_score DESC`);

    // Fetch per-game stats for all roster players
    const playerIds = rosterPlayers.map((p) => p.playerId);
    const allStats = playerIds.length > 0
      ? await db
          .select()
          .from(playerTournamentStats)
          .where(sql`${playerTournamentStats.playerId} IN (${sql.join(playerIds.map(id => sql`${id}`), sql`, `)})`)
          .orderBy(playerTournamentStats.gameDate)
      : [];

    // Group stats by player ID
    const statsByPlayer: Record<string, typeof allStats> = {};
    for (const s of allStats) {
      if (!statsByPlayer[s.playerId]) statsByPlayer[s.playerId] = [];
      statsByPlayer[s.playerId].push(s);
    }

    // Reshape into the format the frontend expects (PlayerWithStats with nested team)
    const shapedPlayers = rosterPlayers.map((p) => ({
      id: p.playerId,
      name: p.playerName,
      jersey: p.jersey,
      position: p.position,
      avgPts: p.avgPts,
      avgReb: p.avgReb,
      avgAst: p.avgAst,
      teamId: p.teamId,
      isActive: p.playerIsActive,
      createdAt: new Date().toISOString(),
      sportRadarPlayerId: null,
      team: {
        id: p.teamId,
        name: p.teamName,
        shortName: p.teamShortName,
        seed: p.seed,
        region: p.region,
        isEliminated: p.isEliminated,
        eliminatedInRound: p.eliminatedInRound,
        logoUrl: p.logoUrl,
        sportRadarTeamId: null,
        createdAt: new Date().toISOString(),
      },
      tournamentStats: statsByPlayer[p.playerId] || [],
      totalPts: Number(p.totalPts),
      totalReb: Number(p.totalReb),
      totalAst: Number(p.totalAst),
      totalScore: Number(p.totalScore),
    }));

    const overallScore = shapedPlayers.reduce((sum, p) => sum + p.totalScore, 0);

    // Get display name from users table
    const [memberUser] = await db
      .select({ displayName: schema.users.displayName })
      .from(schema.users)
      .where(eq(schema.users.id, targetMember.userId))
      .limit(1);

    return res.status(200).json({
      memberId: targetMember.id,
      userId: targetMember.userId,
      teamName: targetMember.teamName,
      displayName: memberUser?.displayName || 'Unknown',
      players: shapedPlayers,
      totalScore: overallScore,
    });
  } catch (err) {
    console.error('Error fetching member roster:', err);
    return res.status(500).json({ error: 'Failed to fetch roster' });
  }
}
