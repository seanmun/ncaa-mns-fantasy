import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, count } from 'drizzle-orm';
import { verifyAuth, isAdmin } from '../_middleware.js';
import { db, schema } from '../_db.js';

const { leagues, leagueMembers, users } = schema;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await verifyAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!isAdmin(userId)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const allLeagues = await db
      .select({
        id: leagues.id,
        name: leagues.name,
        adminId: leagues.adminId,
        adminName: users.displayName,
        visibility: leagues.visibility,
        buyInAmount: leagues.buyInAmount,
        buyInCurrency: leagues.buyInCurrency,
        gameSlug: leagues.gameSlug,
        inviteCode: leagues.inviteCode,
        isLocked: leagues.isLocked,
        maxMembers: leagues.maxMembers,
        createdAt: leagues.createdAt,
        memberCount: count(leagueMembers.id),
      })
      .from(leagues)
      .leftJoin(leagueMembers, eq(leagueMembers.leagueId, leagues.id))
      .leftJoin(users, eq(users.id, leagues.adminId))
      .groupBy(
        leagues.id,
        users.displayName
      )
      .orderBy(leagues.createdAt);

    return res.status(200).json({ data: allLeagues });
  } catch (err) {
    console.error('Error fetching admin leagues:', err);
    return res.status(500).json({ error: 'Failed to fetch leagues' });
  }
}
