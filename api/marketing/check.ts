import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../_middleware.js';
import { db } from '../_db.js';
import { marketingSubscribers } from '../../src/lib/db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await verifyAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const existing = await db
    .select({ id: marketingSubscribers.id })
    .from(marketingSubscribers)
    .where(eq(marketingSubscribers.userId, userId))
    .limit(1);

  return res.status(200).json({ exists: existing.length > 0 });
}
