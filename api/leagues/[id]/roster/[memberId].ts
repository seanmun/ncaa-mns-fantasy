import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and, sql } from 'drizzle-orm';
import { verifyAuth } from '../../../_middleware';
import { db, schema } from '../../../_db';

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
    const [targetMember] = await db
      .select()
      .from(leagueMembers)
      .where(
        and(
          eq(leagueMembers.id, memberId),
          eq(leagueMembers.leagueId, leagueId)
        )
      )
      .limit(1);

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
      .where(eq(rosters.memberId, memberId))
      .groupBy(
        rosters.id,
        players.id,
        players.name,
        players.jersey,
        players.position,
        players.avgPts,
        players.avgReb,
        players.avgAst,
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

    return res.status(200).json({
      data: {
        member: {
          id: targetMember.id,
          teamName: targetMember.teamName,
          userId: targetMember.userId,
        },
        players: rosterPlayers,
      },
    });
  } catch (err) {
    console.error('Error fetching member roster:', err);
    return res.status(500).json({ error: 'Failed to fetch roster' });
  }
}
