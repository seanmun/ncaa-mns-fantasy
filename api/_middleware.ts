import { createClerkClient } from '@clerk/backend';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

export async function verifyAuth(request: Request): Promise<string | null> {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return null;
    const payload = await clerkClient.verifyToken(token);
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
