import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and, count } from 'drizzle-orm';
import { verifyAuth } from '../_middleware';
import { db, schema } from '../_db';

const { leagues, leagueMembers } = schema;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const leagueId = req.query.id as string;
  if (!leagueId) {
    return res.status(400).json({ error: 'League ID is required' });
  }

  if (req.method === 'GET') {
    return handleGet(req, res, leagueId);
  }
  if (req.method === 'PUT') {
    return handlePut(req, res, leagueId);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(req: VercelRequest, res: VercelResponse, leagueId: string) {
  try {
    // Fetch the league with member count
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
        gameSlug: leagues.gameSlug,
        inviteCode: leagues.inviteCode,
        isLocked: leagues.isLocked,
        maxMembers: leagues.maxMembers,
        createdAt: leagues.createdAt,
        updatedAt: leagues.updatedAt,
        memberCount: count(leagueMembers.id),
      })
      .from(leagues)
      .leftJoin(leagueMembers, eq(leagueMembers.leagueId, leagues.id))
      .where(eq(leagues.id, leagueId))
      .groupBy(leagues.id);

    if (!leagueData) {
      return res.status(404).json({ error: 'League not found' });
    }

    // Private leagues require membership
    if (leagueData.visibility === 'private') {
      const userId = await verifyAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

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
    }

    return res.status(200).json({ data: leagueData });
  } catch (err) {
    console.error('Error fetching league:', err);
    return res.status(500).json({ error: 'Failed to fetch league' });
  }
}

async function handlePut(req: VercelRequest, res: VercelResponse, leagueId: string) {
  try {
    const userId = await verifyAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user is league admin
    const [league] = await db
      .select()
      .from(leagues)
      .where(eq(leagues.id, leagueId))
      .limit(1);

    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }
    if (league.adminId !== userId) {
      return res.status(403).json({ error: 'Only the league admin can update settings' });
    }

    const {
      name,
      visibility,
      buyInAmount,
      buyInCurrency,
      cryptoWalletAddress,
      cryptoWalletType,
      maxMembers,
      isLocked,
    } = req.body || {};

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (visibility !== undefined) {
      if (!['public', 'private'].includes(visibility)) {
        return res.status(400).json({ error: 'Visibility must be "public" or "private"' });
      }
      updates.visibility = visibility;
    }
    if (buyInAmount !== undefined) updates.buyInAmount = String(buyInAmount);
    if (buyInCurrency !== undefined) updates.buyInCurrency = buyInCurrency;
    if (cryptoWalletAddress !== undefined) updates.cryptoWalletAddress = cryptoWalletAddress;
    if (cryptoWalletType !== undefined) updates.cryptoWalletType = cryptoWalletType;
    if (maxMembers !== undefined) updates.maxMembers = Number(maxMembers);
    if (isLocked !== undefined) updates.isLocked = Boolean(isLocked);
    updates.updatedAt = new Date();

    const [updated] = await db
      .update(leagues)
      .set(updates)
      .where(eq(leagues.id, leagueId))
      .returning();

    return res.status(200).json({ data: updated });
  } catch (err) {
    console.error('Error updating league:', err);
    return res.status(500).json({ error: 'Failed to update league' });
  }
}
