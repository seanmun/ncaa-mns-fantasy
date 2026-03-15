// PLATFORM PATTERN — copy this to every game app
// Email send guard: enforces global + per-game opt-in/out before every send

import { db } from './db';
import { marketingSubscribers, marketingGamePrefs } from './db/schema';
import { eq, and } from 'drizzle-orm';

export type EmailType =
  | 'morning_update'
  | 'elimination_alert'
  | 'score_alert'
  | 'roster_reminder'
  | 'new_game'
  | 'league_invite';

export async function canSendEmail(
  userId: string,
  gameSlug: string,
  emailType: EmailType
): Promise<boolean> {
  const subscriber = await db
    .select()
    .from(marketingSubscribers)
    .where(eq(marketingSubscribers.userId, userId))
    .limit(1);

  // No record = never opted in = no send
  if (!subscriber[0]) return false;

  // Master unsub or global opt-out = no send
  if (!subscriber[0].globalOptIn || subscriber[0].unsubscribedAt) return false;

  // Platform-level email types check global prefs
  if (emailType === 'new_game') return subscriber[0].prefNewGames;
  if (emailType === 'league_invite') return subscriber[0].prefLeagueInvites;

  // Game-level email types check per-game prefs
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

  // No game prefs row = all defaults = send allowed
  if (!gamePrefs[0]) return true;

  // Full game unsub
  if (gamePrefs[0].optedOutOfGame) return false;

  // Per-type checks
  if (emailType === 'morning_update') return gamePrefs[0].prefMorningUpdates;
  if (emailType === 'elimination_alert') return gamePrefs[0].prefEliminationAlerts;
  if (emailType === 'score_alert') return gamePrefs[0].prefScoreAlerts;
  if (emailType === 'roster_reminder') return gamePrefs[0].prefRosterReminders;

  return true;
}
