import type { VercelRequest, VercelResponse } from '@vercel/node';
import { render } from '@react-email/components';
import { Resend } from 'resend';
import { eq, and, desc, gte, lt, sql } from 'drizzle-orm';
import { verifyAuth, isAdmin } from '../_middleware.js';
import { db, schema } from '../_db.js';
import MorningUpdateEmail from '../../src/components/email/MorningUpdateEmail.js';

const {
  leagues,
  leagueMembers,
  users,
  rosters,
  players,
  ncaaTeams,
  playerTournamentStats,
  emailLog,
  marketingSubscribers,
  marketingGamePrefs,
} = schema;

const resend = new Resend(process.env.RESEND_API_KEY!);
const GAME_SLUG = process.env.GAME_SLUG || 'ncaa-mens-2025';
const BASE_URL = process.env.VITE_APP_URL || 'https://ncaa.mnsfantasy.com';

// ---------------------------------------------------------------------------
// Email guard (inlined for serverless — mirrors src/lib/email-guard.ts)
// ---------------------------------------------------------------------------
type EmailType =
  | 'morning_update'
  | 'elimination_alert'
  | 'score_alert'
  | 'roster_reminder'
  | 'new_game'
  | 'league_invite';

async function canSendEmail(
  userId: string,
  gameSlug: string,
  emailType: EmailType
): Promise<boolean> {
  const subscriber = await db
    .select()
    .from(marketingSubscribers)
    .where(eq(marketingSubscribers.userId, userId))
    .limit(1);

  if (!subscriber[0]) return false;
  if (!subscriber[0].globalOptIn || subscriber[0].unsubscribedAt) return false;

  if (emailType === 'new_game') return subscriber[0].prefNewGames;
  if (emailType === 'league_invite') return subscriber[0].prefLeagueInvites;

  const gamePrefs = await db
    .select()
    .from(marketingGamePrefs)
    .where(
      and(
        eq(marketingGamePrefs.userId, userId),
        eq(marketingGamePrefs.gameSlug, gameSlug)
      )
    )
    .limit(1);

  if (!gamePrefs[0]) return true;
  if (gamePrefs[0].optedOutOfGame) return false;

  if (emailType === 'morning_update') return gamePrefs[0].prefMorningUpdates;
  if (emailType === 'elimination_alert')
    return gamePrefs[0].prefEliminationAlerts;
  if (emailType === 'score_alert') return gamePrefs[0].prefScoreAlerts;
  if (emailType === 'roster_reminder')
    return gamePrefs[0].prefRosterReminders;

  return true;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth: must be admin or cron (Vercel cron sends CRON_SECRET header)
  const cronSecret = req.headers['authorization'];
  const isCron =
    cronSecret === `Bearer ${process.env.CRON_SECRET}`;

  if (!isCron) {
    const userId = await verifyAuth(req);
    if (!userId || !isAdmin(userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  try {
    // Date boundaries: yesterday 00:00 UTC .. today 00:00 UTC
    const now = new Date();
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
    const dateLabel = todayStart.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    // Fetch all active leagues for this game
    const allLeagues = await db
      .select()
      .from(leagues)
      .where(eq(leagues.gameSlug, GAME_SLUG));

    let totalSent = 0;

    for (const league of allLeagues) {
      // ------------------------------------------------------------------
      // 1. Members + users for this league
      // ------------------------------------------------------------------
      const members = await db
        .select({
          memberId: leagueMembers.id,
          userId: leagueMembers.userId,
          teamName: leagueMembers.teamName,
          email: users.email,
          displayName: users.displayName,
        })
        .from(leagueMembers)
        .innerJoin(users, eq(users.id, leagueMembers.userId))
        .where(eq(leagueMembers.leagueId, league.id));

      if (members.length === 0) continue;

      // ------------------------------------------------------------------
      // 2. Compute standings (total pts + reb + ast per member)
      // ------------------------------------------------------------------
      const standingsData: Array<{
        rank: number;
        teamName: string;
        totalScore: number;
      }> = [];

      for (const member of members) {
        const rosterRows = await db
          .select({ playerId: rosters.playerId })
          .from(rosters)
          .where(eq(rosters.memberId, member.memberId));

        let totalScore = 0;
        for (const r of rosterRows) {
          const stats = await db
            .select({
              pts: sql<number>`COALESCE(SUM(${playerTournamentStats.pts}), 0)`,
              reb: sql<number>`COALESCE(SUM(${playerTournamentStats.reb}), 0)`,
              ast: sql<number>`COALESCE(SUM(${playerTournamentStats.ast}), 0)`,
            })
            .from(playerTournamentStats)
            .where(eq(playerTournamentStats.playerId, r.playerId));

          const s = stats[0];
          if (s) totalScore += Number(s.pts) + Number(s.reb) + Number(s.ast);
        }

        standingsData.push({
          rank: 0,
          teamName: member.teamName,
          totalScore,
        });
      }

      // Sort descending by score and assign ranks
      standingsData.sort((a, b) => b.totalScore - a.totalScore);
      standingsData.forEach((entry, idx) => {
        entry.rank = idx + 1;
      });

      // ------------------------------------------------------------------
      // 3. Yesterday's top performers (all players in tournament)
      // ------------------------------------------------------------------
      const yesterdayStats = await db
        .select({
          playerName: players.name,
          teamName: ncaaTeams.name,
          pts: playerTournamentStats.pts,
          reb: playerTournamentStats.reb,
          ast: playerTournamentStats.ast,
        })
        .from(playerTournamentStats)
        .innerJoin(players, eq(players.id, playerTournamentStats.playerId))
        .innerJoin(ncaaTeams, eq(ncaaTeams.id, players.teamId))
        .where(
          and(
            gte(playerTournamentStats.gameDate, yesterdayStart),
            lt(playerTournamentStats.gameDate, todayStart)
          )
        );

      const topPerformers = yesterdayStats
        .map((s) => ({
          playerName: s.playerName,
          teamName: s.teamName,
          pts: s.pts,
          reb: s.reb,
          ast: s.ast,
          total: s.pts + s.reb + s.ast,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      // ------------------------------------------------------------------
      // 4. Eliminations yesterday (teams eliminated since yesterday)
      // ------------------------------------------------------------------
      const eliminations = await db
        .select({
          teamName: ncaaTeams.name,
          round: ncaaTeams.eliminatedInRound,
        })
        .from(ncaaTeams)
        .where(eq(ncaaTeams.isEliminated, true));

      // Note: We include all eliminated teams. A more precise filter would
      // require an eliminatedAt timestamp column. For now this serves as a
      // full elimination list; the email template handles empty arrays.
      const eliminationRows = eliminations
        .filter((e) => e.round !== null)
        .map((e) => ({
          teamName: e.teamName,
          round: e.round!,
        }));

      // ------------------------------------------------------------------
      // 5. Today's games — placeholder: in production, pull from a
      //    tournament_games table or SportsRadar API. For now, empty.
      // ------------------------------------------------------------------
      const todayGames: Array<{
        homeTeam: string;
        awayTeam: string;
        time: string;
      }> = [];

      // ------------------------------------------------------------------
      // 6. Send to each member
      // ------------------------------------------------------------------
      const leagueUrl = `${BASE_URL}/leagues/${league.id}`;

      for (const member of members) {
        // Deduplication: check if we already sent today's morning update
        const todayKey = todayStart.toISOString().slice(0, 10);
        const [alreadySent] = await db
          .select({ id: emailLog.id })
          .from(emailLog)
          .where(
            and(
              eq(emailLog.leagueId, league.id),
              eq(emailLog.userId, member.userId),
              eq(emailLog.emailType, 'morning_update'),
              gte(emailLog.sentAt, todayStart)
            )
          )
          .limit(1);

        if (alreadySent) continue;

        const allowed = await canSendEmail(
          member.userId,
          GAME_SLUG,
          'morning_update'
        );
        if (!allowed) continue;

        // Collect names of players on this member's roster (for highlight)
        const memberRoster = await db
          .select({ playerName: players.name })
          .from(rosters)
          .innerJoin(players, eq(players.id, rosters.playerId))
          .where(eq(rosters.memberId, member.memberId));

        const recipientPlayerNames = memberRoster.map((r) => r.playerName);

        const emailHtml = await render(
          MorningUpdateEmail({
            leagueName: league.name,
            date: dateLabel,
            standings: standingsData,
            topPerformers,
            eliminations: eliminationRows,
            todayGames,
            recipientPlayerNames,
            leagueUrl,
          })
        );

        await resend.emails.send({
          from: 'MNSfantasy <updates@mnsfantasy.com>',
          to: member.email,
          subject: `\u2600\uFE0F MNSfantasy Update \u2014 ${league.name} | ${dateLabel}`,
          html: emailHtml,
        });

        // Log the send
        await db.insert(emailLog).values({
          leagueId: league.id,
          userId: member.userId,
          emailType: 'morning_update',
        });

        totalSent++;
      }
    }

    return res.status(200).json({
      success: true,
      emailsSent: totalSent,
    });
  } catch (err) {
    console.error('Morning update email error:', err);
    return res.status(500).json({ error: 'Failed to send morning update emails' });
  }
}
