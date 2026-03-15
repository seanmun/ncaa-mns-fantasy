import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@clerk/clerk-react';

export function useAdminCheck() {
  const { apiFetch } = useApi();
  const { isSignedIn } = useAuth();

  const { data } = useQuery<{ isAdmin: boolean }>({
    queryKey: ['admin-check'],
    queryFn: () => apiFetch('/api/admin/check'),
    enabled: !!isSignedIn,
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });

  return data?.isAdmin ?? false;
}
