// Helper to verify Clerk session token on protected routes
import { createClerkClient } from '@clerk/backend';
import type { VercelRequest } from '@vercel/node';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

export async function verifyAuth(req: VercelRequest): Promise<string | null> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  try {
    const { sub } = await clerk.verifyToken(token);
    return sub;
  } catch {
    return null;
  }
}

export function isAdmin(userId: string): boolean {
  const adminIds = (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((id) => id.trim());
  return adminIds.includes(userId);
}
