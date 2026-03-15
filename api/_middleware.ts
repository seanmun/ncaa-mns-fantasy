import { verifyToken } from '@clerk/backend';
import type { VercelRequest } from '@vercel/node';

export async function verifyAuth(req: VercelRequest): Promise<string | null> {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return null;
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    return payload.sub;
  } catch (e) {
    console.log('verify error:', e);
    return null;
  }
}

export function isAdmin(userId: string): boolean {
  const adminIds = (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((id) => id.trim());
  return adminIds.includes(userId);
}
