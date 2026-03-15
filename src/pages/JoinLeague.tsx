import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { CryptoWalletDisplay } from '@/components/league/CryptoWalletDisplay';
import PageTransition from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Users, DollarSign, ShieldAlert } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LeaguePreview {
  id: string;
  name: string;
  adminName: string;
  memberCount: number;
  maxMembers: number;
  buyInAmount: string;
  buyInCurrency: string;
  cryptoWalletAddress: string | null;
  cryptoWalletType: string | null;
  visibility: 'public' | 'private';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function JoinLeague() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const { apiFetch } = useApi();

  const [teamName, setTeamName] = useState('');

  /* ---------- Fetch league info by invite code (public) ---------- */
  const {
    data: league,
    isLoading,
    isError,
  } = useQuery<LeaguePreview>({
    queryKey: ['league-preview', inviteCode],
    queryFn: () => apiFetch(`/api/leagues/join/${inviteCode}`),
    enabled: !!inviteCode,
    retry: false,
  });

  /* ---------- Join mutation ---------- */
  const joinMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/api/leagues/join/${inviteCode}`, {
        method: 'POST',
        body: JSON.stringify({ teamName }),
      });
    },
    onSuccess: (data) => {
      toast.success('Welcome to the league! Time to pick your roster.');
      navigate(`/leagues/${data.leagueId}/pick`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to join league');
    },
  });

  const handleJoin = () => {
    if (!isSignedIn) {
      // Redirect to Clerk sign-in, then come back
      const returnUrl = `/join/${inviteCode}`;
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`;
      return;
    }

    if (teamName.trim().length < 2) {
      toast.error('Team name must be at least 2 characters');
      return;
    }

    joinMutation.mutate();
  };

  const buyIn = league ? parseFloat(league.buyInAmount) : 0;
  const isCrypto =
    league?.buyInCurrency === 'ETH' || league?.buyInCurrency === 'BTC';

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <PageTransition>
      <div className="mx-auto max-w-lg px-4 py-12 sm:py-20">
        {/* ---------- Loading ---------- */}
        {isLoading && (
          <div className="space-y-4 rounded-xl border border-bg-border bg-bg-card p-6">
            <Skeleton
              height={28}
              width="60%"
              baseColor="#1f2937"
              highlightColor="#374151"
            />
            <Skeleton
              height={16}
              width="40%"
              baseColor="#1f2937"
              highlightColor="#374151"
            />
            <Skeleton
              count={3}
              height={14}
              baseColor="#1f2937"
              highlightColor="#374151"
            />
            <Skeleton
              height={44}
              baseColor="#1f2937"
              highlightColor="#374151"
            />
          </div>
        )}

        {/* ---------- Error ---------- */}
        {isError && (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-neon-red/30 bg-neon-red/5 p-8 text-center">
            <ShieldAlert className="h-10 w-10 text-neon-red" />
            <h2 className="font-display text-2xl text-text-primary">
              Invalid Invite
            </h2>
            <p className="text-sm text-text-secondary">
              This invite code is invalid or has expired. Double-check the link
              and try again.
            </p>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
          </div>
        )}

        {/* ---------- League preview ---------- */}
        {league && !isLoading && !isError && (
          <div className="space-y-6">
            {/* Card: league info */}
            <div className="rounded-xl border border-bg-border bg-bg-card p-6 space-y-5">
              <h1 className="font-display text-3xl tracking-wide text-text-primary">
                {league.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-neon-green" />
                  {league.memberCount}/{league.maxMembers} members
                </span>
                <span>
                  Created by{' '}
                  <span className="font-semibold text-text-primary">
                    {league.adminName}
                  </span>
                </span>
              </div>

              {/* Buy-in info */}
              {buyIn > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <DollarSign className="h-4 w-4 text-neon-orange" />
                    <span>
                      Buy-in:{' '}
                      <span className="font-semibold text-text-primary">
                        {isCrypto
                          ? `${buyIn} ${league.buyInCurrency}`
                          : `$${buyIn} USD`}
                      </span>
                    </span>
                  </div>

                  {isCrypto &&
                    league.cryptoWalletAddress &&
                    league.cryptoWalletType && (
                      <CryptoWalletDisplay
                        walletType={
                          league.cryptoWalletType.toLowerCase() as
                            | 'eth'
                            | 'btc'
                        }
                        address={league.cryptoWalletAddress}
                      />
                    )}
                </div>
              )}
            </div>

            {/* Card: Team name input + join */}
            <div className="rounded-xl border border-bg-border bg-bg-card p-6 space-y-4">
              <label
                htmlFor="teamName"
                className="block text-sm font-semibold text-text-primary"
              >
                Your Team Name
              </label>
              <input
                id="teamName"
                type="text"
                placeholder="Bracket Busters"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                maxLength={30}
                className="w-full rounded-lg border border-bg-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-neon-green focus:outline-none focus:ring-1 focus:ring-neon-green transition-colors"
              />

              <Button
                type="button"
                variant="primary"
                size="lg"
                loading={joinMutation.isPending}
                onClick={handleJoin}
                className="w-full"
              >
                {isSignedIn ? 'Join League' : 'Sign in to Join'}
              </Button>

              {!isSignedIn && (
                <p className="text-center text-xs text-text-muted">
                  You'll be redirected to sign in, then brought back here.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
