import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Resend } from 'resend';
import { eq, and, gte, sql } from 'drizzle-orm';
import { verifyAuth, isAdmin } from '../_middleware.js';
import { db, schema } from '../_db.js';

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
// Helpers
// ---------------------------------------------------------------------------
function seedToTier(seed: number): number {
  if (seed >= 1 && seed <= 4) return 1;
  if (seed >= 5 && seed <= 8) return 2;
  if (seed >= 9 && seed <= 12) return 3;
  return 4;
}

const TIER_PICK_COUNT: Record<number, number> = { 1: 4, 2: 3, 3: 2, 4: 1 };

interface PlayerData {
  playerName: string;
  teamName: string;
  seed: number;
  isEliminated: boolean;
  totalScore: number;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth: must be admin or cron
  const cronSecret = req.headers['authorization'];
  const isCron = cronSecret === `Bearer ${process.env.CRON_SECRET}`;

  let authUserId: string | null = null;
  if (!isCron) {
    authUserId = await verifyAuth(req);
    if (!authUserId || !isAdmin(authUserId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  const testMode = req.query.test === 'true';

  try {
    // Read HTML template (inside handler so errors are caught)
    let templateHtml: string;
    const templatePath = join(process.cwd(), 'email-templates', 'results.html');
    try {
      templateHtml = readFileSync(templatePath, 'utf-8');
    } catch (fsErr: any) {
      console.error('Failed to read template:', fsErr.message, 'path:', templatePath, 'cwd:', process.cwd());
      return res.status(500).json({
        error: 'Template file not found',
        debug: { path: templatePath, cwd: process.cwd(), fsError: fsErr.message },
      });
    }

    const now = new Date();
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
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
      // 2. Build roster + stats data for each member
      // ------------------------------------------------------------------
      const memberData: Array<{
        memberId: string;
        userId: string;
        teamName: string;
        email: string;
        players: PlayerData[];
        totalScore: number;
        remaining: number;
      }> = [];

      for (const member of members) {
        const rosterRows = await db
          .select({
            playerId: rosters.playerId,
            playerName: players.name,
            teamName: ncaaTeams.name,
            seed: ncaaTeams.seed,
            isEliminated: ncaaTeams.isEliminated,
          })
          .from(rosters)
          .innerJoin(players, eq(players.id, rosters.playerId))
          .innerJoin(ncaaTeams, eq(ncaaTeams.id, players.teamId))
          .where(eq(rosters.memberId, member.memberId));

        const playerDataList: PlayerData[] = [];
        let memberTotalScore = 0;
        let remainingCount = 0;

        for (const r of rosterRows) {
          const stats = await db
            .select({
              totalPts: sql<number>`COALESCE(SUM(${playerTournamentStats.pts}), 0)`,
              totalReb: sql<number>`COALESCE(SUM(${playerTournamentStats.reb}), 0)`,
              totalAst: sql<number>`COALESCE(SUM(${playerTournamentStats.ast}), 0)`,
            })
            .from(playerTournamentStats)
            .where(eq(playerTournamentStats.playerId, r.playerId));

          const s = stats[0];
          const totalScore = s
            ? Number(s.totalPts) + Number(s.totalReb) + Number(s.totalAst)
            : 0;

          playerDataList.push({
            playerName: r.playerName,
            teamName: r.teamName,
            seed: r.seed,
            isEliminated: r.isEliminated,
            totalScore,
          });

          memberTotalScore += totalScore;
          if (!r.isEliminated) remainingCount++;
        }

        memberData.push({
          memberId: member.memberId,
          userId: member.userId,
          teamName: member.teamName,
          email: member.email,
          players: playerDataList,
          totalScore: memberTotalScore,
          remaining: remainingCount,
        });
      }

      // ------------------------------------------------------------------
      // 3. Compute standings (sorted by totalScore desc)
      // ------------------------------------------------------------------
      const standings = [...memberData]
        .sort((a, b) => b.totalScore - a.totalScore)
        .map((entry, idx) => ({
          ...entry,
          rank: idx + 1,
        }));

      // ------------------------------------------------------------------
      // 4. Send to each member
      // ------------------------------------------------------------------
      const leagueUrl = `${BASE_URL}/leagues/${league.id}`;

      for (const member of memberData) {
        // Test mode: only send to the admin who triggered it
        if (testMode && member.userId !== authUserId) continue;

        if (!testMode) {
          // Deduplication check
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
        }

        // Group players by tier, sorted by score desc within each tier
        const tiers: Record<number, PlayerData[]> = { 1: [], 2: [], 3: [], 4: [] };
        for (const p of member.players) {
          tiers[seedToTier(p.seed)].push(p);
        }
        for (const t of [1, 2, 3, 4]) {
          tiers[t].sort((a, b) => b.totalScore - a.totalScore);
        }

        // Build template replacements
        const replacements: Record<string, string> = {
          league_name: league.name,
          team_name: member.teamName,
          team_total_points: String(member.totalScore),
          dashboard_url: leagueUrl,
          unsubscribe_url: `${BASE_URL}/preferences?unsubscribe=all`,
          mailing_address: 'MNS Fantasy',
          current_year: String(now.getFullYear()),
        };

        // Tier player data
        for (const tier of [1, 2, 3, 4]) {
          const maxPicks = TIER_PICK_COUNT[tier];
          let tierTotal = 0;

          for (let i = 0; i < maxPicks; i++) {
            const p = tiers[tier][i];
            const prefix = `t${tier}_p${i + 1}`;

            if (p) {
              replacements[`${prefix}_name`] = p.playerName;
              replacements[`${prefix}_team`] = p.teamName;
              replacements[`${prefix}_seed`] = String(p.seed);
              replacements[`${prefix}_pts`] = String(p.totalScore);
              tierTotal += p.totalScore;
            } else {
              replacements[`${prefix}_name`] = '\u2014';
              replacements[`${prefix}_team`] = '\u2014';
              replacements[`${prefix}_seed`] = '\u2014';
              replacements[`${prefix}_pts`] = '0';
            }
          }

          replacements[`t${tier}_total`] = String(tierTotal);
        }

        // Scoreboard (top 10 from standings)
        for (let i = 0; i < 10; i++) {
          const prefix = `sb_r${i + 1}`;
          const s = standings[i];

          if (s) {
            replacements[`${prefix}_rank`] = String(s.rank);
            replacements[`${prefix}_team`] = s.teamName;
            replacements[`${prefix}_pts`] = String(s.totalScore);
            replacements[`${prefix}_remaining`] = String(s.remaining);
          } else {
            replacements[`${prefix}_rank`] = '\u2014';
            replacements[`${prefix}_team`] = '\u2014';
            replacements[`${prefix}_pts`] = '0';
            replacements[`${prefix}_remaining`] = '0';
          }
        }

        // Replace all {{...}} placeholders in template
        let emailHtml = templateHtml;
        for (const [key, value] of Object.entries(replacements)) {
          emailHtml = emailHtml.replace(
            new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
            value
          );
        }

        // Clear kinetic tracking pixel placeholders
        emailHtml = emailHtml.replace(/\{\{UUID\}\}/g, '');
        emailHtml = emailHtml.replace(/\{\{SEND_ID\}\}/g, '');
        emailHtml = emailHtml.replace(/\{\{TIMESTAMP\}\}/g, '');

        await resend.emails.send({
          from: 'MNSfantasy <updates@e.mnsfantasy.com>',
          to: member.email,
          subject: `\uD83C\uDFC0 MNSfantasy Results \u2014 ${league.name} | ${dateLabel}`,
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
      debug: { authUserId, testMode, leaguesFound: allLeagues.length },
    });
  } catch (err: any) {
    console.error('Morning update email error:', err);
    return res.status(500).json({ error: 'Failed to send morning update emails', debug: err.message });
  }
}
