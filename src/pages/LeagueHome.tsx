import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { StandingsTable } from '@/components/league/StandingsTable';
import { CryptoWalletDisplay } from '@/components/league/CryptoWalletDisplay';
import { CopyButton } from '@/components/ui/CopyButton';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { Button } from '@/components/ui/Button';
import PageTransition from '@/components/layout/PageTransition';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  Users,
  Lock,
  Unlock,
  Share2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { StandingsEntry, LeagueWithDetails } from '@/types';
import { isRosterLocked } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LeagueDetail extends LeagueWithDetails {
  inviteCode: string;
  isLocked: boolean;
  buyInAmount: string;
  buyInCurrency: string;
  cryptoWalletAddress: string | null;
  cryptoWalletType: string | null;
  adminId: string;
  maxMembers: number;
  currentMemberRosterLocked: boolean;
}

interface TodayGame {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  scheduledTime: string | null;
}

interface TodayGamesResponse {
  data: {
    games: TodayGame[];
    lastSyncTime: string | null;
    hasLiveGames: boolean;
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function LeagueHome() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const { apiFetch } = useApi();

  const [infoOpen, setInfoOpen] = useState(false);

  const currentUserId = user?.id ?? '';

  /* ---------- Fetch league details ---------- */
  const { data: league, isLoading: leagueLoading } = useQuery<LeagueDetail>({
    queryKey: ['league', id],
    queryFn: () => apiFetch(`/api/leagues/${id}`),
    enabled: !!id,
  });

  /* ---------- Fetch standings (auto-refresh every 30s) ---------- */
  const { data: standings, isLoading: standingsLoading } = useQuery<
    StandingsEntry[]
  >({
    queryKey: ['standings', id],
    queryFn: () => apiFetch(`/api/leagues/${id}/standings`),
    enabled: !!id,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  /* ---------- Fetch today's games ---------- */
  const { data: todayData } = useQuery<TodayGamesResponse>({
    queryKey: ['todayGames'],
    queryFn: () => apiFetch('/api/stats/today'),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const todayGames = todayData?.data?.games ?? [];
  const lastSyncTime = todayData?.data?.lastSyncTime;
  const hasLiveGames = todayData?.data?.hasLiveGames ?? false;

  const isAdmin = league?.adminId === currentUserId;
  const buyIn = league ? parseFloat(league.buyInAmount) : 0;
  const isCrypto =
    league?.buyInCurrency === 'ETH' || league?.buyInCurrency === 'BTC';
  const inviteUrl = league
    ? `${window.location.origin}/join/${league.inviteCode}`
    : '';

  /* ---------- Admin lock toggle ---------- */
  const handleLockToggle = async () => {
    if (!league || !id) return;
    try {
      await apiFetch(`/api/leagues/${id}/lock`, {
        method: 'POST',
        body: JSON.stringify({ isLocked: !league.isLocked }),
      });
    } catch {
      // Error handled by useApi
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        {/* ========== Header ========== */}
        {leagueLoading ? (
          <div className="mb-6 space-y-2">
            <Skeleton
              height={32}
              width="50%"
              baseColor="#1f2937"
              highlightColor="#374151"
            />
            <Skeleton
              height={16}
              width="30%"
              baseColor="#1f2937"
              highlightColor="#374151"
            />
          </div>
        ) : league ? (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-3xl tracking-wide text-text-primary">
                {league.name}
              </h1>
              <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
                <Users className="h-4 w-4" />
                {league.memberCount}
              </span>
              {/* Lock status badge */}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  league.isLocked
                    ? 'bg-neon-red/15 border border-neon-red/30 text-neon-red'
                    : 'bg-neon-green/15 border border-neon-green/30 text-neon-green'
                }`}
              >
                {league.isLocked ? (
                  <>
                    <Lock className="h-3 w-3" /> Locked
                  </>
                ) : (
                  <>
                    <Unlock className="h-3 w-3" /> Open
                  </>
                )}
              </span>
            </div>

            <CountdownTimer />
          </div>
        ) : null}

        {/* ========== Main layout ========== */}
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* ---------- Left: Standings ---------- */}
          <div className="flex-1 min-w-0">
            {standingsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    height={48}
                    baseColor="#1f2937"
                    highlightColor="#374151"
                    className="rounded-lg"
                  />
                ))}
              </div>
            ) : standings && league ? (
              <div aria-live="polite">
                <StandingsTable
                  standings={standings}
                  currentUserId={currentUserId}
                  leagueId={id!}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-bg-border bg-bg-card p-8 text-center text-sm text-text-muted">
                No standings data available yet.
              </div>
            )}

            {/* ---------- Last updated indicator ---------- */}
            {lastSyncTime && (
              <div className="mt-3 text-xs text-text-muted text-right">
                Stats updated{' '}
                {formatDistanceToNow(new Date(lastSyncTime), { addSuffix: true })}
                {hasLiveGames && (
                  <span className="ml-2 inline-flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green" />
                    </span>
                    LIVE
                  </span>
                )}
              </div>
            )}

            {/* ---------- Today's Games ---------- */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 rounded-xl border border-bg-border bg-bg-card p-6"
            >
              <h2 className="font-display text-xl tracking-wide text-text-primary mb-4">
                Today's Games
              </h2>
              {todayGames.length === 0 ? (
                <p className="text-sm text-text-muted">
                  No games scheduled today.
                </p>
              ) : (
                <div className="space-y-3">
                  {todayGames.map((game) => (
                    <div
                      key={game.gameId}
                      className="flex items-center justify-between rounded-lg border border-bg-border bg-bg-primary px-4 py-3"
                    >
                      {/* Away team */}
                      <div className="flex-1 text-right">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {game.awayTeam}
                        </p>
                      </div>

                      {/* Score / status */}
                      <div className="mx-4 flex flex-col items-center min-w-[80px]">
                        {game.status === 'scheduled' ? (
                          <p className="text-xs text-text-muted">
                            {game.scheduledTime
                              ? new Date(game.scheduledTime).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  timeZone: 'America/New_York',
                                })
                              : 'TBD'}
                          </p>
                        ) : (
                          <p className="text-lg font-bold text-text-primary tabular-nums">
                            {game.awayScore} - {game.homeScore}
                          </p>
                        )}
                        <span
                          className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            game.status === 'inprogress'
                              ? 'bg-neon-green/15 text-neon-green border border-neon-green/30'
                              : game.status === 'closed' || game.status === 'complete'
                              ? 'bg-white/10 text-text-secondary border border-bg-border'
                              : 'bg-white/5 text-text-muted border border-bg-border'
                          }`}
                        >
                          {game.status === 'inprogress' && (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-neon-green" />
                            </span>
                          )}
                          {game.status === 'inprogress'
                            ? 'Live'
                            : game.status === 'closed' || game.status === 'complete'
                            ? 'Final'
                            : 'Scheduled'}
                        </span>
                      </div>

                      {/* Home team */}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {game.homeTeam}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* ---------- Right: League Info (sidebar on desktop, drawer on mobile) ---------- */}
          <div className="lg:w-80 shrink-0">
            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => setInfoOpen((o) => !o)}
              className="flex w-full items-center justify-between rounded-xl border border-bg-border bg-bg-card px-4 py-3 text-sm font-semibold text-text-primary lg:hidden"
              aria-expanded={infoOpen}
            >
              <span className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-neon-green" />
                League Info
              </span>
              {infoOpen ? (
                <ChevronUp className="h-4 w-4 text-text-muted" />
              ) : (
                <ChevronDown className="h-4 w-4 text-text-muted" />
              )}
            </button>

            {/* Info content — always visible on desktop, toggled on mobile */}
            <div
              className={`mt-3 space-y-4 lg:mt-0 lg:block ${
                infoOpen ? 'block' : 'hidden lg:block'
              }`}
            >
              {/* Invite link */}
              {league && (
                <div className="rounded-xl border border-bg-border bg-bg-card p-4 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Invite Link
                  </h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteUrl}
                      className="flex-1 rounded-lg border border-bg-border bg-bg-primary px-3 py-2 text-xs text-text-secondary font-mono truncate"
                    />
                    <CopyButton text={inviteUrl} />
                  </div>
                  <a
                    href={inviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-neon-cyan hover:underline"
                  >
                    Open link
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {/* Buy-in info */}
              {league && buyIn > 0 && (
                <div className="rounded-xl border border-bg-border bg-bg-card p-4 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Buy-In
                  </h3>
                  <p className="text-sm text-text-primary font-semibold">
                    {isCrypto
                      ? `${buyIn} ${league.buyInCurrency}`
                      : `$${buyIn} USD`}
                  </p>
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

              {/* Admin controls */}
              {isAdmin && league && (
                <div className="rounded-xl border border-bg-border bg-bg-card p-4 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Admin Controls
                  </h3>
                  <Button
                    variant={league.isLocked ? 'danger' : 'secondary'}
                    size="sm"
                    onClick={handleLockToggle}
                    className="w-full"
                  >
                    {league.isLocked ? (
                      <>
                        <Unlock className="h-4 w-4" />
                        Unlock Rosters
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Lock Rosters
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========== Sticky "Your Roster" button ========== */}
        {league && !isRosterLocked() && !league.currentMemberRosterLocked && (
          <div className="fixed bottom-[76px] left-0 right-0 z-30 flex justify-center px-4 md:bottom-6">
            <Link to={`/leagues/${id}/pick`}>
              <Button variant="primary" size="lg" className="shadow-xl">
                Your Roster
              </Button>
            </Link>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
