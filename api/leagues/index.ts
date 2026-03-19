import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { verifyAuth } from '../_middleware.js';
import { db, schema } from '../_db.js';
import { createLeagueSchema, parseBody } from '../_validation.js';
import { checkRateLimit } from '../_rateLimit.js';

const { leagues, leagueMembers } = schema;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await verifyAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    return handleGet(req, res, userId);
  }
  if (req.method === 'POST') {
    return handlePost(req, res, userId);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(_req: VercelRequest, res: VercelResponse, userId: string) {
  try {
    // Return ALL leagues the user is in (across all games)
    const userLeagues = await db
      .select({
        id: leagues.id,
        name: leagues.name,
        adminId: leagues.adminId,
        visibility: leagues.visibility,
        buyInAmount: leagues.buyInAmount,
        buyInCurrency: leagues.buyInCurrency,
        cryptoWalletAddress: leagues.cryptoWalletAddress,
        cryptoWalletType: leagues.cryptoWalletType,
        gameSlug: leagues.gameSlug,
        inviteCode: leagues.inviteCode,
        isLocked: leagues.isLocked,
        maxMembers: leagues.maxMembers,
        createdAt: leagues.createdAt,
        updatedAt: leagues.updatedAt,
        memberCount: count(leagueMembers.id),
      })
      .from(leagues)
      .innerJoin(leagueMembers, eq(leagueMembers.leagueId, leagues.id))
      .where(eq(leagueMembers.userId, userId))
      .groupBy(leagues.id);

    return res.status(200).json({ data: userLeagues });
  } catch (err) {
    console.error('Error listing leagues:', err);
    return res.status(500).json({ error: 'Failed to list leagues' });
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse, userId: string) {
  const rl = checkRateLimit(`create-league:${userId}`, { limit: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  const parsed = parseBody(createLeagueSchema, req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    const { name, teamName, gameSlug, visibility, buyInAmount, buyInCurrency, cryptoWalletAddress, cryptoWalletType, maxMembers } = parsed.data;

    const inviteCode = nanoid(8).toUpperCase();

    // Insert the league
    const [newLeague] = await db
      .insert(leagues)
      .values({
        name,
        adminId: userId,
        visibility,
        buyInAmount,
        buyInCurrency,
        cryptoWalletAddress,
        cryptoWalletType,
        gameSlug,
        inviteCode,
        maxMembers,
      })
      .returning();

    // Add creator as the first member (admin)
    await db.insert(leagueMembers).values({
      leagueId: newLeague.id,
      userId,
      teamName,
    });

    return res.status(201).json({ data: newLeague });
  } catch (err) {
    console.error('Error creating league:', err);
    return res.status(500).json({ error: 'Failed to create league' });
  }
}
