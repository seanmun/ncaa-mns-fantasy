// Helper to verify Clerk session token on protected routes
import { createClerkClient } from '@clerk/backend';
import type { VercelRequest } from '@vercel/node';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

export async function verifyAuth(req: VercelRequest): Promise<string | null> {
  const authHeader = req.headers.authorization;
  console.log('AUTH HEADER:', authHeader?.substring(0, 50));
  console.log('CLERK_SECRET_KEY exists:', !!process.env.CLERK_SECRET_KEY);

  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    console.log('AUTH: No token found');
    return null;
  }
  try {
    const { sub } = await clerk.verifyToken(token);
    console.log('AUTH: Token verified, userId:', sub);
    return sub;
  } catch (err) {
    console.error('AUTH: Token verification failed:', err);
    return null;
  }
}

export function isAdmin(userId: string): boolean {
  const adminIds = (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((id) => id.trim());
  return adminIds.includes(userId);
}
