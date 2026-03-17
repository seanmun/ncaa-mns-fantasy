import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../_middleware.js';
import { db } from '../_db.js';
import { users } from '../../src/lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { userSyncSchema, parseBody } from '../_validation.js';
import { checkRateLimit } from '../_rateLimit.js';

// PLATFORM PATTERN — reuse in every game app
// Called after Clerk sign-in to upsert the user into the local users table
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await verifyAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const rl = checkRateLimit(`user-sync:${userId}`, { limit: 20, windowMs: 60_000 });
  if (!rl.allowed) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  const parsed = parseBody(userSyncSchema, req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }

  const { email, displayName, avatarUrl } = parsed.data;

  // Upsert: create if new, update if existing
  await db
    .insert(users)
    .values({
      id: userId,
      email,
      displayName,
      avatarUrl,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email,
        displayName,
        avatarUrl,
      },
    });

  return res.status(200).json({ success: true });
}
