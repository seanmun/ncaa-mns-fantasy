import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../_middleware.js';
import { db } from '../_db.js';
import { users } from '../../src/lib/db/schema.js';
import { eq } from 'drizzle-orm';

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

  const { email, displayName, avatarUrl } = req.body;

  if (!email || !displayName) {
    return res.status(400).json({ error: 'email and displayName are required' });
  }

  // Upsert: create if new, update if existing
  await db
    .insert(users)
    .values({
      id: userId,
      email,
      displayName,
      avatarUrl: avatarUrl || null,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email,
        displayName,
        avatarUrl: avatarUrl || null,
      },
    });

  return res.status(200).json({ success: true });
}
