import { useEffect, useRef } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';

// PLATFORM PATTERN — reuse in every game app
// Syncs Clerk user data to the local users table on sign-in
export function useUserSync() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!isLoaded || !user || hasSynced.current) return;

    const syncUser = async () => {
      try {
        const token = await getToken();
        await fetch('/api/users/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: user.primaryEmailAddress?.emailAddress || '',
            displayName:
              user.fullName ||
              user.username ||
              user.primaryEmailAddress?.emailAddress ||
              'Player',
            avatarUrl: user.imageUrl || null,
          }),
        });
        hasSynced.current = true;
      } catch (err) {
        console.error('User sync failed:', err);
      }
    };

    syncUser();
  }, [isLoaded, user, getToken]);
}
