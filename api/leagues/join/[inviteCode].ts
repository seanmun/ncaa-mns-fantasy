import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and, count } from 'drizzle-orm';
import { verifyAuth } from '../../_middleware.js';
import { db, schema } from '../../_db.js';
import { joinLeagueSchema, parseBody } from '../../_validation.js';
import { checkRateLimit } from '../../_rateLimit.js';

const { leagues, leagueMembers, users } = schema;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const inviteCode = req.query.inviteCode as string;
  if (!inviteCode) {
    return res.status(400).json({ error: 'Invite code is required' });
  }

  if (req.method === 'GET') {
    return handleGet(res, inviteCode);
  }
  if (req.method === 'POST') {
    return handlePost(req, res, inviteCode);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(res: VercelResponse, inviteCode: string) {
  try {
    // Public endpoint: get league info by invite code
    const [leagueData] = await db
      .select({
        id: leagues.id,
        name: leagues.name,
        adminId: leagues.adminId,
        visibility: leagues.visibility,
        buyInAmount: leagues.buyInAmount,
        buyInCurrency: leagues.buyInCurrency,
        cryptoWalletAddress: leagues.cryptoWalletAddress,
        cryptoWalletType: leagues.cryptoWalletType,
        maxMembers: leagues.maxMembers,
        memberCount: count(leagueMembers.id),
      })
      .from(leagues)
      .leftJoin(leagueMembers, eq(leagueMembers.leagueId, leagues.id))
      .where(eq(leagues.inviteCode, inviteCode))
      .groupBy(leagues.id);

    if (!leagueData) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    // Get admin display name
    const [admin] = await db
      .select({ displayName: users.displayName })
      .from(users)
      .where(eq(users.id, leagueData.adminId))
      .limit(1);

    return res.status(200).json({
      data: {
        id: leagueData.id,
        name: leagueData.name,
        adminName: admin?.displayName || 'Unknown',
        memberCount: leagueData.memberCount,
        maxMembers: leagueData.maxMembers,
        buyInAmount: leagueData.buyInAmount,
        buyInCurrency: leagueData.buyInCurrency,
        cryptoWalletAddress: leagueData.cryptoWalletAddress,
        cryptoWalletType: leagueData.cryptoWalletType,
      },
    });
  } catch (err) {
    console.error('Error fetching league by invite code:', err);
    return res.status(500).json({ error: 'Failed to fetch league info' });
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse, inviteCode: string) {
  try {
    const userId = await verifyAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const rl = checkRateLimit(`join-league:${userId}`, { limit: 10, windowMs: 60_000 });
    if (!rl.allowed) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
    }

    const parsed = parseBody(joinLeagueSchema, req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error });
    }

    const { teamName } = parsed.data;

    // Find the league
    const [league] = await db
      .select()
      .from(leagues)
      .where(eq(leagues.inviteCode, inviteCode))
      .limit(1);

    if (!league) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    // Check if user is already a member
    const [existingMember] = await db
      .select()
      .from(leagueMembers)
      .where(
        and(
          eq(leagueMembers.leagueId, league.id),
          eq(leagueMembers.userId, userId)
        )
      )
      .limit(1);

    if (existingMember) {
      return res.status(400).json({ error: 'You are already a member of this league' });
    }

    // Check if league is full
    const [{ memberCount }] = await db
      .select({ memberCount: count(leagueMembers.id) })
      .from(leagueMembers)
      .where(eq(leagueMembers.leagueId, league.id));

    if (league.maxMembers && memberCount >= league.maxMembers) {
      return res.status(400).json({ error: 'This league is full' });
    }

    // Create membership
    await db.insert(leagueMembers).values({
      leagueId: league.id,
      userId,
      teamName,
    });

    return res.status(201).json({ data: { leagueId: league.id } });
  } catch (err) {
    console.error('Error joining league:', err);
    return res.status(500).json({ error: 'Failed to join league' });
  }
}
