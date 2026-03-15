import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and, sql } from 'drizzle-orm';
import { verifyAuth } from '../../_middleware';
import { db, schema } from '../../_db';

const { leagues, leagueMembers, users, rosters, players, ncaaTeams, playerTournamentStats } =
  schema;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const leagueId = req.query.id as string;
  if (!leagueId) {
    return res.status(400).json({ error: 'League ID is required' });
  }

  const userId = await verifyAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Verify membership
    const [membership] = await db
      .select()
      .from(leagueMembers)
      .where(
        and(
          eq(leagueMembers.leagueId, leagueId),
          eq(leagueMembers.userId, userId)
        )
      )
      .limit(1);

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this league' });
    }

    // Compute standings:
    // Join league_members -> users -> rosters -> players -> ncaa_teams -> LEFT JOIN player_tournament_stats
    // Group by member, sum pts/reb/ast, compute total_score
    // Order by total_score DESC, total_pts DESC (tiebreaker)
    const standings = await db
      .select({
        memberId: leagueMembers.id,
        userId: leagueMembers.userId,
        teamName: leagueMembers.teamName,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        totalPts: sql<number>`COALESCE(SUM(${playerTournamentStats.pts}), 0)`.as('total_pts'),
        totalReb: sql<number>`COALESCE(SUM(${playerTournamentStats.reb}), 0)`.as('total_reb'),
        totalAst: sql<number>`COALESCE(SUM(${playerTournamentStats.ast}), 0)`.as('total_ast'),
        totalScore:
          sql<number>`COALESCE(SUM(${playerTournamentStats.pts}), 0) + COALESCE(SUM(${playerTournamentStats.reb}), 0) + COALESCE(SUM(${playerTournamentStats.ast}), 0)`.as(
            'total_score'
          ),
        playerCount: sql<number>`COUNT(DISTINCT ${rosters.playerId})`.as('player_count'),
        eliminatedCount:
          sql<number>`COUNT(DISTINCT CASE WHEN ${ncaaTeams.isEliminated} THEN ${rosters.playerId} END)`.as(
            'eliminated_count'
          ),
      })
      .from(leagueMembers)
      .innerJoin(users, eq(users.id, leagueMembers.userId))
      .leftJoin(rosters, eq(rosters.memberId, leagueMembers.id))
      .leftJoin(players, eq(players.id, rosters.playerId))
      .leftJoin(ncaaTeams, eq(ncaaTeams.id, players.teamId))
      .leftJoin(playerTournamentStats, eq(playerTournamentStats.playerId, players.id))
      .where(eq(leagueMembers.leagueId, leagueId))
      .groupBy(
        leagueMembers.id,
        leagueMembers.userId,
        leagueMembers.teamName,
        users.displayName,
        users.avatarUrl
      )
      .orderBy(
        sql`total_score DESC`,
        sql`total_pts DESC`
      );

    // Map to StandingsEntry shape the frontend expects
    const result = standings.map((entry, index) => ({
      memberId: entry.memberId,
      teamName: entry.teamName,
      displayName: entry.displayName,
      playerCount: Number(entry.playerCount),
      eliminatedCount: Number(entry.eliminatedCount),
      totalPts: Number(entry.totalPts),
      totalReb: Number(entry.totalReb),
      totalAst: Number(entry.totalAst),
      totalScore: Number(entry.totalScore),
    }));

    return res.status(200).json(result);
  } catch (err) {
    console.error('Error computing standings:', err);
    return res.status(500).json({ error: 'Failed to compute standings' });
  }
}
