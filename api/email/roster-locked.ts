import type { VercelRequest, VercelResponse } from '@vercel/node';
import { render } from '@react-email/components';
import { Resend } from 'resend';
import { eq, and, gte } from 'drizzle-orm';
import { verifyAuth, isAdmin } from '../_middleware.js';
import { db, schema } from '../_db.js';
import RosterLockedEmail from '../../src/components/email/RosterLockedEmail.js';

const {
  leagues,
  leagueMembers,
  users,
  rosters,
  players,
  ncaaTeams,
  emailLog,
  marketingSubscribers,
  marketingGamePrefs,
} = schema;

const resend = new Resend(process.env.RESEND_API_KEY!);
const GAME_SLUG = process.env.GAME_SLUG || 'ncaa-mens-2025';
const BASE_URL = process.env.VITE_APP_URL || 'https://ncaa.mnsfantasy.com';

// Inlined email guard
async function canSendEmail(userId: string, gameSlug: string): Promise<boolean> {
  const [subscriber] = await db
    .select()
    .from(marketingSubscribers)
    .where(eq(marketingSubscribers.userId, userId))
    .limit(1);

  if (!subscriber) return false;
  if (!subscriber.globalOptIn || subscriber.unsubscribedAt) return false;

  const [gamePrefs] = await db
    .select()
    .from(marketingGamePrefs)
    .where(
      and(
        eq(marketingGamePrefs.userId, userId),
        eq(marketingGamePrefs.gameSlug, gameSlug)
      )
    )
    .limit(1);

  if (!gamePrefs) return true;
  if (gamePrefs.optedOutOfGame) return false;
  return gamePrefs.prefRosterReminders;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth: must be admin or cron
  const cronSecret = req.headers['authorization'];
  const isCron = cronSecret === `Bearer ${process.env.CRON_SECRET}`;

  if (!isCron) {
    const userId = await verifyAuth(req);
    if (!userId || !isAdmin(userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  try {
    const allLeagues = await db
      .select()
      .from(leagues)
      .where(eq(leagues.gameSlug, GAME_SLUG));

    let totalSent = 0;

    for (const league of allLeagues) {
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

      for (const member of members) {
        // Dedup check
        const [alreadySent] = await db
          .select({ id: emailLog.id })
          .from(emailLog)
          .where(
            and(
              eq(emailLog.leagueId, league.id),
              eq(emailLog.userId, member.userId),
              eq(emailLog.emailType, 'roster_locked')
            )
          )
          .limit(1);

        if (alreadySent) continue;

        const allowed = await canSendEmail(member.userId, GAME_SLUG);
        if (!allowed) continue;

        // Get member's roster picks
        const rosterPicks = await db
          .select({
            playerName: players.name,
            teamName: ncaaTeams.name,
            seed: ncaaTeams.seed,
            avgPts: players.avgPts,
            avgReb: players.avgReb,
            avgAst: players.avgAst,
          })
          .from(rosters)
          .innerJoin(players, eq(players.id, rosters.playerId))
          .innerJoin(ncaaTeams, eq(ncaaTeams.id, players.teamId))
          .where(eq(rosters.memberId, member.memberId));

        const picks = rosterPicks.map((p) => ({
          playerName: p.playerName,
          teamName: p.teamName,
          seed: p.seed,
          projectedScore:
            Number(p.avgPts) + Number(p.avgReb) + Number(p.avgAst),
        }));

        const projectedTotal = picks.reduce(
          (sum, p) => sum + p.projectedScore,
          0
        );

        const emailHtml = await render(
          RosterLockedEmail({
            leagueName: league.name,
            teamName: member.teamName,
            playerName: member.displayName,
            picks,
            projectedTotal,
            leagueUrl: `${BASE_URL}/leagues/${league.id}`,
          })
        );

        await resend.emails.send({
          from: 'MNSfantasy <updates@mnsfantasy.com>',
          to: member.email,
          subject: `\uD83D\uDD12 Roster Locked \u2014 ${league.name} | MNSfantasy`,
          html: emailHtml,
        });

        await db.insert(emailLog).values({
          leagueId: league.id,
          userId: member.userId,
          emailType: 'roster_locked',
        });

        totalSent++;
      }
    }

    return res.status(200).json({ success: true, emailsSent: totalSent });
  } catch (err) {
    console.error('Roster locked email error:', err);
    return res.status(500).json({ error: 'Failed to send roster locked emails' });
  }
}
