// Helper to verify Clerk session token on protected routes
import { createClerkClient } from '@clerk/backend';

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function verifyAuth(req: { headers: Record<string, any> }): Promise<string | null> {
  try {
    // Support both VercelRequest (.headers.authorization) and Web Request (.headers.get())
    const authHeader =
      typeof req.headers.get === 'function'
        ? req.headers.get('authorization')
        : req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return null;
    const payload = await clerk.verifyToken(token);
    return payload.sub;
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
