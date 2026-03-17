import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import PageTransition from '@/components/layout/PageTransition';
import {
  SEED_TIERS,
  getTierForSeed,
  type PlayerWithTeam,
  type RosterPickState,
} from '@/types';
import {
  cn,
  isRosterLocked,
  getProjectedScore,
} from '@/lib/utils';
import { playClick, playSuccess, playDing } from '@/lib/sounds';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';

import LockedRosterView from '@/components/roster/LockedRosterView';
import RosterConfirmationView from '@/components/roster/RosterConfirmationView';
import TierNavigationTabs from '@/components/roster/TierNavigationTabs';
import PlayerListView from '@/components/roster/PlayerListView';
import DesktopRosterSidebar from '@/components/roster/DesktopRosterSidebar';
import MobileRosterView from '@/components/roster/MobileRosterView';

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function PickRoster() {
  const { id: leagueId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { apiFetch } = useApi();

  // ---- Local pick state --------------------------------------------------
  const [picks, setPicks] = useState<RosterPickState>({
    tier1: [],
    tier2: [],
    tier3: [],
    tier4: [],
  });
  const [filters, setFilters] = useState<Record<number, string>>({
    1: '',
    2: '',
    3: '',
    4: '',
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activeTier, setActiveTier] = useState(1);
  const [sortMode, setSortMode] = useState<Record<number, 'projected' | 'team'>>({
    1: 'projected',
    2: 'projected',
    3: 'projected',
    4: 'projected',
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [mobileView, setMobileView] = useState<'players' | 'team'>('players');
  const hasPrePopulated = useRef(false);
  const queryClient = useQueryClient();

  // ---- Data fetching -----------------------------------------------------
  const {
    data: allPlayers = [],
    isLoading: playersLoading,
  } = useQuery<PlayerWithTeam[]>({
    queryKey: ['players'],
    queryFn: () => apiFetch('/api/players'),
    staleTime: 300_000,
  });

  const {
    data: existingRoster,
    isLoading: rosterLoading,
  } = useQuery<{ players: PlayerWithTeam[]; memberId: string } | null>({
    queryKey: ['roster', leagueId, user?.id],
    queryFn: () =>
      apiFetch(`/api/leagues/${leagueId}/roster/${user?.id}`).catch(
        () => null,
      ),
    enabled: !!leagueId && !!user?.id,
  });

  // ---- Pre-populate picks from existing roster ----------------------------
  useEffect(() => {
    if (
      existingRoster?.players?.length &&
      !hasPrePopulated.current &&
      !isRosterLocked()
    ) {
      hasPrePopulated.current = true;
      setIsEditMode(true);

      const newPicks: RosterPickState = { tier1: [], tier2: [], tier3: [], tier4: [] };
      for (const player of existingRoster.players) {
        const tierInfo = getTierForSeed(player.team.seed);
        const key = `tier${tierInfo.tier}` as keyof RosterPickState;
        newPicks[key].push(player);
      }
      setPicks(newPicks);
    }
  }, [existingRoster]);

  // ---- Derived state -----------------------------------------------------
  const locked = isRosterLocked();

  const hotThreshold = useMemo(() => {
    if (allPlayers.length === 0) return Infinity;
    const scores = allPlayers
      .map((p) => getProjectedScore(p.avgPts, p.avgReb, p.avgAst))
      .sort((a, b) => b - a);
    const idx = Math.max(0, Math.floor(scores.length * 0.1) - 1);
    return scores[idx] ?? Infinity;
  }, [allPlayers]);

  const playersByTier = useMemo(() => {
    const map: Record<number, PlayerWithTeam[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (const player of allPlayers) {
      const tier = getTierForSeed(player.team.seed);
      map[tier.tier]?.push(player);
    }
    for (const tier of [1, 2, 3, 4]) {
      if (sortMode[tier] === 'team') {
        map[tier].sort((a, b) => {
          if (a.team.seed !== b.team.seed) return a.team.seed - b.team.seed;
          return (
            getProjectedScore(b.avgPts, b.avgReb, b.avgAst) -
            getProjectedScore(a.avgPts, a.avgReb, a.avgAst)
          );
        });
      } else {
        map[tier].sort(
          (a, b) =>
            getProjectedScore(b.avgPts, b.avgReb, b.avgAst) -
            getProjectedScore(a.avgPts, a.avgReb, a.avgAst),
        );
      }
    }
    return map;
  }, [allPlayers, sortMode]);

  const filteredPlayersByTier = useMemo(() => {
    const map: Record<number, PlayerWithTeam[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (const tier of [1, 2, 3, 4]) {
      const query = filters[tier].toLowerCase().trim();
      map[tier] = query
        ? playersByTier[tier].filter(
            (p) =>
              p.name.toLowerCase().includes(query) ||
              p.team.name.toLowerCase().includes(query) ||
              p.team.region.toLowerCase().includes(query),
          )
        : playersByTier[tier];
    }
    return map;
  }, [playersByTier, filters]);

  // Pick helpers
  const tierKey = (tier: number): keyof RosterPickState =>
    `tier${tier}` as keyof RosterPickState;

  const pickCount = useCallback(
    (tier: number) => picks[tierKey(tier)].length,
    [picks],
  );

  const totalPicks =
    picks.tier1.length +
    picks.tier2.length +
    picks.tier3.length +
    picks.tier4.length;

  const allPicked = totalPicks === 10;

  const isPlayerSelected = useCallback(
    (playerId: string) => {
      return (
        picks.tier1.some((p) => p.id === playerId) ||
        picks.tier2.some((p) => p.id === playerId) ||
        picks.tier3.some((p) => p.id === playerId) ||
        picks.tier4.some((p) => p.id === playerId)
      );
    },
    [picks],
  );

  const projectedTotal = useMemo(() => {
    const all = [
      ...picks.tier1,
      ...picks.tier2,
      ...picks.tier3,
      ...picks.tier4,
    ];
    return all.reduce(
      (sum, p) => sum + getProjectedScore(p.avgPts, p.avgReb, p.avgAst),
      0,
    );
  }, [picks]);

  // ---- Pick / unpick handler ---------------------------------------------
  const handlePick = useCallback(
    (player: PlayerWithTeam, tier: number) => {
      const key = tierKey(tier);
      const tierConfig = SEED_TIERS.find((t) => t.tier === tier)!;
      const current = picks[key];
      const alreadySelected = current.some((p) => p.id === player.id);

      if (alreadySelected) {
        playClick();
        setPicks((prev) => ({
          ...prev,
          [key]: prev[key].filter((p) => p.id !== player.id),
        }));
        return;
      }

      if (current.length >= tierConfig.picks) return;

      playClick();
      const newPicks = [...current, player];
      setPicks((prev) => ({ ...prev, [key]: newPicks }));

      if (newPicks.length === tierConfig.picks) {
        playDing();
        const nextTier = SEED_TIERS.find(
          (t) => t.tier > tier && picks[tierKey(t.tier)].length < t.picks
        );
        if (nextTier) {
          setTimeout(() => setActiveTier(nextTier.tier), 300);
        }
      }
    },
    [picks],
  );

  // ---- Submit mutation ---------------------------------------------------
  const submitMutation = useMutation({
    mutationFn: async () => {
      const playerIds = [
        ...picks.tier1,
        ...picks.tier2,
        ...picks.tier3,
        ...picks.tier4,
      ].map((p) => p.id);
      return apiFetch(`/api/leagues/${leagueId}/roster`, {
        method: 'POST',
        body: JSON.stringify({ playerIds }),
      });
    },
    onSuccess: () => {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00ff87', '#00e5ff', '#bf5af2', '#ff9f0a'],
      });

      playSuccess();
      toast.success(isEditMode ? 'Roster updated! Good luck in the tournament.' : 'Roster confirmed! Good luck in the tournament.');
      setShowConfirmModal(false);
      queryClient.invalidateQueries({ queryKey: ['roster', leagueId] });
      queryClient.invalidateQueries({ queryKey: ['standings', leagueId] });

      setTimeout(() => {
        navigate(`/leagues/${leagueId}`);
      }, 1800);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save roster. Please try again.');
    },
  });

  // ---- Event handlers for sub-components ---------------------------------
  const handleTierClick = useCallback((tier: number) => {
    playClick();
    setActiveTier(tier);
  }, []);

  const handleMobileViewChange = useCallback((view: 'players' | 'team') => {
    playClick();
    setMobileView(view);
  }, []);

  const handleFilterChange = useCallback(
    (value: string) => {
      setFilters((prev) => ({ ...prev, [activeTier]: value }));
    },
    [activeTier],
  );

  const handleFilterClear = useCallback(() => {
    setFilters((prev) => ({ ...prev, [activeTier]: '' }));
  }, [activeTier]);

  const handleSortModeChange = useCallback(
    (mode: 'projected' | 'team') => {
      setSortMode((prev) => ({ ...prev, [activeTier]: mode }));
    },
    [activeTier],
  );

  const handlePrevTier = useCallback(() => {
    playClick();
    setActiveTier((prev) => prev - 1);
  }, []);

  const handleNextTier = useCallback(() => {
    playClick();
    setActiveTier((prev) => prev + 1);
  }, []);

  const handleMobileTierSelect = useCallback((tier: number) => {
    setActiveTier(tier);
    setMobileView('players');
    playClick();
  }, []);

  // ---- Loading state -----------------------------------------------------
  if (playersLoading || rosterLoading) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-5xl space-y-6 px-4 pb-32 pt-8">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((t) => (
              <div key={t} className="h-10 flex-1 rounded-lg bg-bg-card animate-pulse" />
            ))}
          </div>
          <div className="flex gap-6">
            <div className="flex-1 space-y-4">
              <div className="h-8 w-64 rounded bg-bg-card animate-pulse" />
              <div className="h-10 rounded-lg bg-bg-card animate-pulse" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={i} lines={3} />
                ))}
              </div>
            </div>
            <div className="hidden lg:block lg:w-72 shrink-0">
              <div className="h-64 rounded-xl bg-bg-card animate-pulse" />
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  // ---- Locked / read-only state ------------------------------------------
  if (locked) {
    const rosterPlayers = existingRoster?.players ?? [];
    const groupedByTier: Record<number, PlayerWithTeam[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (const p of rosterPlayers) {
      const tier = getTierForSeed(p.team.seed);
      groupedByTier[tier.tier].push(p);
    }

    return (
      <PageTransition>
        <LockedRosterView
          rosterPlayers={rosterPlayers}
          groupedByTier={groupedByTier}
        />
      </PageTransition>
    );
  }

  // ---- Full-page confirmation view ---------------------------------------
  if (showConfirmModal) {
    return (
      <PageTransition>
        <RosterConfirmationView
          picks={picks}
          projectedTotal={projectedTotal}
          isEditMode={isEditMode}
          isPending={submitMutation.isPending}
          onGoBack={() => setShowConfirmModal(false)}
          onConfirm={() => submitMutation.mutate()}
        />
      </PageTransition>
    );
  }

  // ---- Active tier data ---------------------------------------------------
  const activeTierConfig = SEED_TIERS.find((t) => t.tier === activeTier)!;
  const activeTierCount = pickCount(activeTier);
  const activeTierFull = activeTierCount >= activeTierConfig.picks;
  const activeTierPlayers = filteredPlayersByTier[activeTier];

  // ---- Main pick interface -----------------------------------------------
  return (
    <PageTransition>
      <div className="relative mx-auto max-w-5xl pb-40 md:pb-28">
        {/* Top sticky bar -- Tier Navigation Tabs */}
        <TierNavigationTabs
          activeTier={activeTier}
          totalPicks={totalPicks}
          mobileView={mobileView}
          pickCount={pickCount}
          onTierClick={handleTierClick}
          onMobileViewChange={handleMobileViewChange}
        />

        {/* Main content: Active tier + Desktop sidebar */}
        <div className="flex gap-6 px-4 pt-6">
          {/* Left: Active tier content */}
          <div className="flex-1 min-w-0">
            {/* Players view -- always visible on lg+, conditionally on mobile */}
            <div className={cn(mobileView === 'team' && 'hidden lg:block')}>
              <PlayerListView
                activeTier={activeTier}
                activeTierConfig={activeTierConfig}
                activeTierFull={activeTierFull}
                activeTierPlayers={activeTierPlayers}
                filter={filters[activeTier]}
                sortMode={sortMode[activeTier]}
                hotThreshold={hotThreshold}
                isPlayerSelected={isPlayerSelected}
                onFilterChange={handleFilterChange}
                onFilterClear={handleFilterClear}
                onSortModeChange={handleSortModeChange}
                onPick={handlePick}
                onPrevTier={handlePrevTier}
                onNextTier={handleNextTier}
              />
            </div>

            {/* My Team view -- mobile only */}
            <div className={cn(mobileView === 'players' ? 'hidden' : 'block lg:hidden')}>
              <MobileRosterView
                picks={picks}
                totalPicks={totalPicks}
                projectedTotal={projectedTotal}
                onTierSelect={handleMobileTierSelect}
                onRemovePlayer={handlePick}
              />
            </div>
          </div>

          {/* Right: Desktop sidebar -- Selected picks */}
          <DesktopRosterSidebar
            picks={picks}
            activeTier={activeTier}
            totalPicks={totalPicks}
            projectedTotal={projectedTotal}
            onTierClick={setActiveTier}
            onRemovePlayer={handlePick}
          />
        </div>

        {/* Bottom sticky bar */}
        <div
          className="fixed inset-x-0 md:bottom-0 z-40 border-t border-bg-border bg-bg-secondary/95 backdrop-blur-sm"
          style={{ bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="mx-auto max-w-5xl px-4 py-2">
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-sm text-text-secondary">
                <span
                  className={`font-bold ${allPicked ? 'text-neon-green' : 'text-text-primary'}`}
                >
                  {totalPicks}
                </span>
                /10 picks
              </p>

              <button
                type="button"
                disabled={!allPicked}
                onClick={() => {
                  playClick();
                  setShowConfirmModal(true);
                }}
                className={cn(
                  'rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-200',
                  allPicked
                    ? 'animate-pulse-neon bg-neon-green text-gray-900 shadow-[0_0_20px_rgba(0,255,135,0.4)]'
                    : 'cursor-not-allowed bg-bg-card text-text-muted opacity-50',
                )}
              >
                {isEditMode ? 'Update Roster' : 'Confirm Roster'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
