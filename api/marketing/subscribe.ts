import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../_middleware.js';
import { db } from '../_db.js';
import { users, marketingSubscribers } from '../../src/lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { marketingSubscribeSchema, parseBody } from '../_validation.js';
import { checkRateLimit } from '../_rateLimit.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await verifyAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const rl = checkRateLimit(`subscribe:${userId}`, { limit: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  const parsed = parseBody(marketingSubscribeSchema, req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }

  const { globalOptIn, mnsInsights, source } = parsed.data;

  // Get user email from users table
  const userRecord = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!userRecord[0]) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Upsert marketing subscriber record
  await db
    .insert(marketingSubscribers)
    .values({
      userId,
      email: userRecord[0].email,
      globalOptIn: globalOptIn ?? false,
      prefMnsInsights: mnsInsights ?? false,
      source: source || 'ncaa-mens-2025',
      optedInAt: globalOptIn ? new Date() : null,
    })
    .onConflictDoUpdate({
      target: marketingSubscribers.userId,
      set: {
        globalOptIn: globalOptIn ?? false,
        prefMnsInsights: mnsInsights ?? false,
        updatedAt: new Date(),
      },
    });

  return res.status(200).json({ success: true });
}
