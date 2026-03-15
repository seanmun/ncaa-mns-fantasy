import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and, sql, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { verifyAuth } from '../_middleware.js';
import { db, schema } from '../_db.js';

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
    const gameSlug = process.env.GAME_SLUG || 'ncaa-mens-2025';

    // Get leagues where user is a member, filtered by game slug
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
      .where(
        and(
          eq(leagues.gameSlug, gameSlug),
          eq(leagueMembers.userId, userId)
        )
      )
      .groupBy(leagues.id);

    return res.status(200).json({ data: userLeagues });
  } catch (err) {
    console.error('Error listing leagues:', err);
    return res.status(500).json({ error: 'Failed to list leagues' });
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse, userId: string) {
  try {
    const {
      name,
      teamName,
      visibility = 'private',
      buyInAmount = '0',
      buyInCurrency = 'USD',
      cryptoWalletAddress,
      cryptoWalletType,
      maxMembers = 50,
    } = req.body || {};

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'League name is required' });
    }
    if (!teamName || typeof teamName !== 'string' || teamName.trim().length === 0) {
      return res.status(400).json({ error: 'Team name is required' });
    }
    if (!['public', 'private'].includes(visibility)) {
      return res.status(400).json({ error: 'Visibility must be "public" or "private"' });
    }

    const gameSlug = process.env.GAME_SLUG || 'ncaa-mens-2025';
    const inviteCode = nanoid(8).toUpperCase();

    // Insert the league
    const [newLeague] = await db
      .insert(leagues)
      .values({
        name: name.trim(),
        adminId: userId,
        visibility,
        buyInAmount: String(buyInAmount),
        buyInCurrency,
        cryptoWalletAddress: cryptoWalletAddress || null,
        cryptoWalletType: cryptoWalletType || null,
        gameSlug,
        inviteCode,
        maxMembers: Number(maxMembers),
      })
      .returning();

    // Add creator as the first member (admin)
    await db.insert(leagueMembers).values({
      leagueId: newLeague.id,
      userId,
      teamName: teamName.trim(),
    });

    return res.status(201).json({ data: newLeague });
  } catch (err) {
    console.error('Error creating league:', err);
    return res.status(500).json({ error: 'Failed to create league' });
  }
}
