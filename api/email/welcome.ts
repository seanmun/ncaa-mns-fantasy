import type { VercelRequest, VercelResponse } from '@vercel/node';
import { render } from '@react-email/components';
import { Resend } from 'resend';
import { eq, and } from 'drizzle-orm';
import { verifyAuth } from '../_middleware.js';
import { db, schema } from '../_db.js';
import WelcomeEmail from '../../src/components/email/WelcomeEmail.js';

const {
  leagues,
  leagueMembers,
  users,
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

  // Authenticate caller
  const callerUserId = await verifyAuth(req);
  if (!callerUserId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { userId, leagueId } = req.body || {};

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId is required' });
  }
  if (!leagueId || typeof leagueId !== 'string') {
    return res.status(400).json({ error: 'leagueId is required' });
  }

  try {
    // Fetch user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch league
    const [league] = await db
      .select()
      .from(leagues)
      .where(eq(leagues.id, leagueId))
      .limit(1);

    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    // Fetch membership (to get team name)
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
      return res.status(404).json({ error: 'User is not a member of this league' });
    }

    // Check email preferences
    const allowed = await canSendEmail(userId, GAME_SLUG, 'league_invite');
    if (!allowed) {
      return res.status(200).json({
        success: true,
        sent: false,
        reason: 'User has opted out of this email type',
      });
    }

    // Build the roster URL (pre-lock: pick roster; post-lock: standings)
    const pickRosterUrl = league.isLocked
      ? `${BASE_URL}/leagues/${leagueId}`
      : `${BASE_URL}/leagues/${leagueId}/pick`;

    // Render and send
    const emailHtml = await render(
      WelcomeEmail({
        leagueName: league.name,
        teamName: membership.teamName,
        pickRosterUrl,
        playerName: user.displayName,
      })
    );

    await resend.emails.send({
      from: 'MNSfantasy <updates@mnsfantasy.com>',
      to: user.email,
      subject: `Welcome to ${league.name} \u2014 MNSfantasy`,
      html: emailHtml,
    });

    // Log the send
    await db.insert(emailLog).values({
      leagueId: league.id,
      userId: user.id,
      emailType: 'welcome',
    });

    return res.status(200).json({ success: true, sent: true });
  } catch (err) {
    console.error('Welcome email error:', err);
    return res.status(500).json({ error: 'Failed to send welcome email' });
  }
}
