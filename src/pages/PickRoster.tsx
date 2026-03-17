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
  getRosterLockDate,
} from '@/lib/utils';
import { playClick, playSuccess, playDing } from '@/lib/sounds';
import { format } from 'date-fns';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Lock, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';

/* ------------------------------------------------------------------ */
/*  Tier metadata for styling                                         */
/* ------------------------------------------------------------------ */

const TIER_TEXT_COLOR: Record<number, string> = {
  1: 'text-tier-1',
  2: 'text-tier-2',
  3: 'text-tier-3',
  4: 'text-tier-4',
};

const TIER_BG_LOW: Record<number, string> = {
  1: 'bg-tier-1/15',
  2: 'bg-tier-2/15',
  3: 'bg-tier-3/15',
  4: 'bg-tier-4/15',
};

const TIER_BORDER_LEFT: Record<number, string> = {
  1: 'border-l-tier-1',
  2: 'border-l-tier-2',
  3: 'border-l-tier-3',
  4: 'border-l-tier-4',
};

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

  // Compute the "hot" threshold: top 10% projected score across ALL players
  const hotThreshold = useMemo(() => {
    if (allPlayers.length === 0) return Infinity;
    const scores = allPlayers
      .map((p) => getProjectedScore(p.avgPts, p.avgReb, p.avgAst))
      .sort((a, b) => b - a);
    const idx = Math.max(0, Math.floor(scores.length * 0.1) - 1);
    return scores[idx] ?? Infinity;
  }, [allPlayers]);

  // Players grouped by tier, filtered & sorted
  const playersByTier = useMemo(() => {
    const map: Record<number, PlayerWithTeam[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (const player of allPlayers) {
      const tier = getTierForSeed(player.team.seed);
      map[tier.tier]?.push(player);
    }
    // Sort each tier based on current sort mode
    for (const tier of [1, 2, 3, 4]) {
      if (sortMode[tier] === 'team') {
        // Sort by seed (best first), then by projected score within same team
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

  // Filtered players per tier
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

  const pickCount = (tier: number) => picks[tierKey(tier)].length;

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
        // Deselect
        playClick();
        setPicks((prev) => ({
          ...prev,
          [key]: prev[key].filter((p) => p.id !== player.id),
        }));
        return;
      }

      // Don't exceed tier limit
      if (current.length >= tierConfig.picks) return;

      playClick();
      const newPicks = [...current, player];
      setPicks((prev) => ({ ...prev, [key]: newPicks }));

      // Check if this tier is now complete
      if (newPicks.length === tierConfig.picks) {
        playDing();
        // Auto-advance to next incomplete tier
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
      // Fire confetti
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

      // Navigate after a brief pause so the user sees the confetti
      setTimeout(() => {
        navigate(`/leagues/${leagueId}`);
      }, 1800);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save roster. Please try again.');
    },
  });

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
    const groupedByTier: Record<number, PlayerWithTeam[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
    };
    for (const p of rosterPlayers) {
      const tier = getTierForSeed(p.team.seed);
      groupedByTier[tier.tier].push(p);
    }

    return (
      <PageTransition>
        <div className="mx-auto max-w-5xl space-y-8 px-4 pb-16 pt-8">
          <div className="flex items-center justify-center gap-2 rounded-xl border border-neon-red/30 bg-neon-red/10 px-6 py-3">
            <Lock className="h-5 w-5 text-neon-red" />
            <span className="font-display text-lg tracking-wide text-neon-red">
              ROSTER LOCKED
            </span>
          </div>

          {/* Column headers */}
          <div className="flex items-center gap-3 px-3 pb-1.5 text-[10px] uppercase tracking-wider text-text-muted font-mono">
            <div className="flex-1">Player</div>
            <span className="w-10 text-right hidden sm:block">PTS</span>
            <span className="w-10 text-right hidden sm:block">REB</span>
            <span className="w-10 text-right hidden sm:block">AST</span>
            <span className="w-12 text-right">Proj</span>
          </div>

          {SEED_TIERS.map((tierConfig) => {
            const tierPlayers = groupedByTier[tierConfig.tier];
            if (tierPlayers.length === 0) return null;
            return (
              <section key={tierConfig.tier}>
                <h2
                  className={`mb-2 border-l-4 pl-3 font-display text-sm tracking-wide ${TIER_BORDER_LEFT[tierConfig.tier]} ${TIER_TEXT_COLOR[tierConfig.tier]}`}
                >
                  {tierConfig.label}
                </h2>
                <div className="divide-y divide-bg-border/40 rounded-xl border border-bg-border bg-bg-card overflow-hidden mb-4">
                  {tierPlayers.map((player) => {
                    const projScore = getProjectedScore(
                      player.avgPts,
                      player.avgReb,
                      player.avgAst,
                    );
                    return (
                      <div
                        key={player.id}
                        className={`flex items-center gap-3 px-3 py-2.5 border-l-4 ${TIER_BORDER_LEFT[tierConfig.tier]}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-text-primary truncate">
                              {player.name}
                            </span>
                            {player.jersey && (
                              <span className="shrink-0 font-mono text-[10px] text-text-muted">
                                #{player.jersey}
                              </span>
                            )}
                            <span className="shrink-0 text-xs text-text-muted">
                              ({player.team.seed}) {player.team.shortName}
                            </span>
                            <span className="shrink-0 text-[10px] text-text-muted hidden sm:inline">
                              {player.team.region}
                            </span>
                          </div>
                        </div>
                        <span className="w-10 text-right font-mono text-xs text-text-secondary hidden sm:block">
                          {parseFloat(player.avgPts).toFixed(1)}
                        </span>
                        <span className="w-10 text-right font-mono text-xs text-text-secondary hidden sm:block">
                          {parseFloat(player.avgReb).toFixed(1)}
                        </span>
                        <span className="w-10 text-right font-mono text-xs text-text-secondary hidden sm:block">
                          {parseFloat(player.avgAst).toFixed(1)}
                        </span>
                        <span className="w-12 text-right font-mono text-sm font-bold text-text-primary">
                          {projScore.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {rosterPlayers.length > 0 && (
            <div className="rounded-xl border border-neon-green/30 bg-bg-card px-4 py-4 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Projected Total
              </span>
              <span className="font-mono text-3xl font-bold text-neon-green">
                {rosterPlayers
                  .reduce(
                    (sum, p) =>
                      sum + getProjectedScore(p.avgPts, p.avgReb, p.avgAst),
                    0,
                  )
                  .toFixed(1)}
              </span>
            </div>
          )}
        </div>
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
        {/* ============================================================= */}
        {/*  TOP STICKY BAR — Tier Navigation Tabs                        */}
        {/* ============================================================= */}
        <div className="sticky top-[96px] z-40 border-b border-bg-border bg-bg-secondary/95 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl px-4">
            <div className="flex items-center gap-1">
              {SEED_TIERS.map((tierConfig) => {
                const count = pickCount(tierConfig.tier);
                const complete = count === tierConfig.picks;
                const isActive = activeTier === tierConfig.tier;

                return (
                  <button
                    key={tierConfig.tier}
                    type="button"
                    onClick={() => {
                      playClick();
                      setActiveTier(tierConfig.tier);
                    }}
                    className={cn(
                      'flex-1 py-3 text-center text-sm font-semibold transition-all duration-200 border-b-2',
                      isActive
                        ? `${TIER_TEXT_COLOR[tierConfig.tier]} border-current`
                        : 'text-text-muted border-transparent hover:text-text-secondary',
                      complete && !isActive && 'text-text-secondary',
                    )}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      {complete && <Check className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline">{tierConfig.label}</span>
                      <span className="sm:hidden">T{tierConfig.tier}</span>
                      <span className="font-mono text-xs opacity-70">
                        {count}/{tierConfig.picks}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Overall progress bar */}
            <div className="h-0.5 w-full bg-bg-border">
              <motion.div
                className="h-full bg-neon-green"
                initial={{ width: 0 }}
                animate={{ width: `${(totalPicks / 10) * 100}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/*  MAIN CONTENT: Active tier + Desktop sidebar                   */}
        {/* ============================================================= */}
        <div className="flex gap-6 px-4 pt-6">
          {/* ---------- LEFT: Active tier content ---------- */}
          <div className="flex-1 min-w-0">
            <section>
              {/* Tier header */}
              <div className={`mb-4 border-l-4 pl-4 ${TIER_BORDER_LEFT[activeTier]}`}>
                <h2
                  className={`font-display text-xl tracking-wide sm:text-2xl ${TIER_TEXT_COLOR[activeTier]}`}
                >
                  TIER {activeTier} &mdash; Seeds{' '}
                  {activeTierConfig.seeds[0]}&ndash;
                  {activeTierConfig.seeds[activeTierConfig.seeds.length - 1]}
                </h2>
                <p className="mt-0.5 text-sm text-text-secondary">
                  Pick{' '}
                  <span
                    className={`font-mono font-bold ${TIER_TEXT_COLOR[activeTier]}`}
                  >
                    {activeTierConfig.picks}
                  </span>{' '}
                  player{activeTierConfig.picks > 1 ? 's' : ''}
                  {activeTierFull && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs text-neon-green">
                      <Check className="h-3 w-3" /> Complete
                    </span>
                  )}
                </p>
              </div>

              {/* Search + Sort row */}
              <div className="mb-4 flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Filter by team or player..."
                    value={filters[activeTier]}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        [activeTier]: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-bg-border bg-bg-card py-2 pl-9 pr-9 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-bg-card-hover focus:ring-1 focus:ring-neon-green/30"
                  />
                  {filters[activeTier] && (
                    <button
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          [activeTier]: '',
                        }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-primary"
                      aria-label="Clear filter"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Sort toggle */}
                <div className="flex shrink-0 items-center rounded-lg border border-bg-border bg-bg-card">
                  <button
                    type="button"
                    onClick={() =>
                      setSortMode((prev) => ({ ...prev, [activeTier]: 'projected' }))
                    }
                    className={cn(
                      'px-3 py-2 text-xs font-semibold transition-colors rounded-l-lg',
                      sortMode[activeTier] === 'projected'
                        ? 'bg-neon-green/15 text-neon-green'
                        : 'text-text-muted hover:text-text-secondary',
                    )}
                  >
                    Points
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSortMode((prev) => ({ ...prev, [activeTier]: 'team' }))
                    }
                    className={cn(
                      'px-3 py-2 text-xs font-semibold transition-colors rounded-r-lg',
                      sortMode[activeTier] === 'team'
                        ? 'bg-neon-green/15 text-neon-green'
                        : 'text-text-muted hover:text-text-secondary',
                    )}
                  >
                    Team
                  </button>
                </div>
              </div>

              {/* Player list — single tier at a time */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTier}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTierPlayers.length === 0 ? (
                    <p className="py-6 text-center text-sm text-text-muted">
                      No players match your filter.
                    </p>
                  ) : (
                    <div>
                      {/* Column headers */}
                      <div className="flex items-center gap-3 px-3 pb-1.5 text-[10px] uppercase tracking-wider text-text-muted font-mono">
                        <div className="flex-1">Player</div>
                        <span className="w-10 text-right hidden sm:block">PTS</span>
                        <span className="w-10 text-right hidden sm:block">REB</span>
                        <span className="w-10 text-right hidden sm:block">AST</span>
                        <span className="w-12 text-right">Proj</span>
                      </div>

                      {(() => {
                        // Group by team when in team sort mode
                        const isTeamMode = sortMode[activeTier] === 'team';
                        const teamSections: { teamId: string; teamName: string; seed: number; region: string; players: typeof activeTierPlayers }[] = [];

                        if (isTeamMode) {
                          const seen = new Map<string, typeof teamSections[0]>();
                          for (const p of activeTierPlayers) {
                            if (!seen.has(p.team.id)) {
                              const section = { teamId: p.team.id, teamName: p.team.name, seed: p.team.seed, region: p.team.region, players: [] as typeof activeTierPlayers };
                              seen.set(p.team.id, section);
                              teamSections.push(section);
                            }
                            seen.get(p.team.id)!.players.push(p);
                          }
                        }

                        const renderRow = (player: PlayerWithTeam) => {
                          const selected = isPlayerSelected(player.id);
                          const disabled = activeTierFull && !selected;
                          const projScore = getProjectedScore(
                            player.avgPts,
                            player.avgReb,
                            player.avgAst,
                          );
                          const hot = projScore >= hotThreshold;

                          return (
                            <button
                              key={player.id}
                              type="button"
                              onClick={() => handlePick(player, activeTier)}
                              disabled={disabled}
                              className={cn(
                                'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                                selected
                                  ? `${TIER_BG_LOW[activeTier]} border-l-4 ${TIER_BORDER_LEFT[activeTier]}`
                                  : 'border-l-4 border-l-transparent hover:bg-bg-card-hover',
                                disabled && !selected && 'opacity-35 cursor-not-allowed',
                              )}
                            >
                              {/* Player info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-text-primary truncate">
                                    {player.name}
                                  </span>
                                  {player.jersey && (
                                    <span className="shrink-0 font-mono text-[10px] text-text-muted">
                                      #{player.jersey}
                                    </span>
                                  )}
                                  {!isTeamMode && (
                                    <span className="shrink-0 text-xs text-text-muted">
                                      {player.team.shortName}
                                    </span>
                                  )}
                                  <span className="shrink-0 text-[10px] text-text-muted hidden sm:inline">
                                    {player.team.region}
                                  </span>
                                  {hot && (
                                    <span className="shrink-0 text-xs" aria-label="Hot pick">
                                      {'🔥'}
                                    </span>
                                  )}
                                  {selected && (
                                    <Check className={`shrink-0 h-3.5 w-3.5 ${TIER_TEXT_COLOR[activeTier]}`} />
                                  )}
                                </div>
                              </div>

                              {/* Season averages */}
                              <span className="w-10 text-right font-mono text-xs text-text-secondary hidden sm:block">
                                {parseFloat(player.avgPts).toFixed(1)}
                              </span>
                              <span className="w-10 text-right font-mono text-xs text-text-secondary hidden sm:block">
                                {parseFloat(player.avgReb).toFixed(1)}
                              </span>
                              <span className="w-10 text-right font-mono text-xs text-text-secondary hidden sm:block">
                                {parseFloat(player.avgAst).toFixed(1)}
                              </span>

                              {/* Projected */}
                              <span className="w-12 text-right font-mono text-sm font-bold text-text-primary">
                                {projScore.toFixed(1)}
                              </span>
                            </button>
                          );
                        };

                        if (isTeamMode) {
                          return (
                            <div className="space-y-3">
                              {teamSections.map((section) => (
                                <div key={section.teamId}>
                                  <div className="flex items-center gap-2 px-3 py-1.5 text-xs">
                                    <span className="font-mono font-bold text-text-muted">({section.seed})</span>
                                    <span className="font-semibold text-text-primary">{section.teamName}</span>
                                    <span className="text-text-muted">{section.region}</span>
                                  </div>
                                  <div className="divide-y divide-bg-border/40 rounded-xl border border-bg-border bg-bg-card overflow-hidden">
                                    {section.players.map(renderRow)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        }

                        return (
                          <div className="divide-y divide-bg-border/40 rounded-xl border border-bg-border bg-bg-card overflow-hidden">
                            {activeTierPlayers.map(renderRow)}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Prev / Next tier navigation */}
              <div className="mt-6 flex items-center justify-between">
                {activeTier > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setActiveTier((prev) => prev - 1);
                    }}
                    className="flex items-center gap-2 rounded-xl border border-bg-border bg-bg-card px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-card-hover"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Tier {activeTier - 1}
                  </button>
                ) : (
                  <div />
                )}

                {activeTier < 4 ? (
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setActiveTier((prev) => prev + 1);
                    }}
                    className={cn(
                      'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
                      activeTierFull
                        ? `${TIER_BG_LOW[activeTier + 1]} ${TIER_TEXT_COLOR[activeTier + 1]} border border-transparent`
                        : 'border border-bg-border bg-bg-card text-text-primary hover:bg-bg-card-hover',
                    )}
                  >
                    Tier {activeTier + 1}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <div />
                )}
              </div>
            </section>
          </div>

          {/* ---------- RIGHT: Desktop sidebar — Selected picks ---------- */}
          <div className="hidden lg:block lg:w-72 shrink-0">
            <div className="sticky top-[160px]">
              <div className="rounded-xl border border-bg-border bg-bg-card p-4 space-y-4">
                <h3 className="font-display text-sm uppercase tracking-wider text-text-primary">
                  Your Picks
                  <span className="ml-2 font-mono text-xs text-text-muted">
                    {totalPicks}/10
                  </span>
                </h3>

                {SEED_TIERS.map((tierConfig) => {
                  const tierPicks = picks[tierKey(tierConfig.tier)];
                  const slots = tierConfig.picks;

                  return (
                    <div key={tierConfig.tier}>
                      <button
                        type="button"
                        onClick={() => setActiveTier(tierConfig.tier)}
                        className={cn(
                          'mb-1.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:opacity-100',
                          TIER_TEXT_COLOR[tierConfig.tier],
                          activeTier === tierConfig.tier
                            ? 'opacity-100'
                            : 'opacity-60',
                        )}
                      >
                        {tierConfig.label} ({tierPicks.length}/{slots})
                      </button>

                      <div className="space-y-1">
                        {tierPicks.map((p) => (
                          <div
                            key={p.id}
                            className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-xs ${TIER_BG_LOW[tierConfig.tier]}`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="truncate text-text-primary">
                                {p.name}
                              </span>
                              <span className="shrink-0 text-text-muted">
                                {p.team.shortName}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handlePick(p, tierConfig.tier)}
                              className="shrink-0 ml-1 opacity-50 hover:opacity-100 transition-opacity"
                              aria-label={`Remove ${p.name}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}

                        {/* Empty slot indicators */}
                        {Array.from({ length: slots - tierPicks.length }).map(
                          (_, i) => (
                            <div
                              key={`empty-${i}`}
                              className="flex items-center rounded-lg border border-dashed border-bg-border px-2 py-1.5 text-xs text-text-muted"
                            >
                              Empty slot
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Projected total */}
                {totalPicks > 0 && (
                  <div className="border-t border-bg-border pt-3 text-center">
                    <p className="text-xs text-text-muted">Projected Total</p>
                    <p className="font-mono text-xl font-bold text-neon-green">
                      {projectedTotal.toFixed(1)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/*  BOTTOM STICKY BAR                                             */}
        {/* ============================================================= */}
        <div className="fixed inset-x-0 bottom-[60px] md:bottom-0 z-40 border-t border-bg-border bg-bg-secondary/95 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl px-4 py-3">
            {/* Pick chips row — mobile only */}
            {totalPicks > 0 && (
              <div className="mb-2.5 flex flex-wrap gap-1.5 lg:hidden">
                {SEED_TIERS.map((tierConfig) =>
                  picks[tierKey(tierConfig.tier)].map((p) => (
                    <motion.span
                      key={p.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${TIER_BG_LOW[tierConfig.tier]} ${TIER_TEXT_COLOR[tierConfig.tier]}`}
                    >
                      {p.name.split(' ').slice(-1)[0]}
                      <button
                        type="button"
                        onClick={() => handlePick(p, tierConfig.tier)}
                        className="ml-0.5 opacity-60 transition-opacity hover:opacity-100"
                        aria-label={`Remove ${p.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.span>
                  )),
                )}
              </div>
            )}

            {/* Action row */}
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-sm text-text-secondary">
                My Picks:{' '}
                <span
                  className={`font-bold ${allPicked ? 'text-neon-green' : 'text-text-primary'}`}
                >
                  {totalPicks}
                </span>
                /10
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

        {/* ============================================================= */}
        {/*  CONFIRMATION MODAL                                            */}
        {/* ============================================================= */}
        <AnimatePresence>
          {showConfirmModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
              onClick={() => setShowConfirmModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-2xl border border-bg-border bg-bg-secondary p-6 shadow-2xl"
              >
                <h2 className="mb-6 text-center font-display text-2xl tracking-wide text-text-primary">
                  {isEditMode ? 'Update Your Roster' : 'Confirm Your Roster'}
                </h2>

                {/* Picks organized by tier */}
                <div className="space-y-4">
                  {SEED_TIERS.map((tierConfig) => {
                    const tierPicks = picks[tierKey(tierConfig.tier)];
                    if (tierPicks.length === 0) return null;
                    return (
                      <div key={tierConfig.tier}>
                        <h3
                          className={`mb-1.5 text-xs font-semibold uppercase tracking-wider ${TIER_TEXT_COLOR[tierConfig.tier]}`}
                        >
                          {tierConfig.label} &mdash; Seeds{' '}
                          {tierConfig.seeds[0]}&ndash;
                          {tierConfig.seeds[tierConfig.seeds.length - 1]}
                        </h3>
                        <ul className="space-y-1">
                          {tierPicks.map((p) => (
                            <li
                              key={p.id}
                              className="flex items-center justify-between rounded-lg bg-bg-card px-3 py-2 text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-text-primary">
                                  {p.name}
                                </span>
                                <span className="text-xs text-text-muted">
                                  {p.team.shortName}
                                </span>
                              </div>
                              <span className="font-mono text-xs text-text-secondary">
                                {getProjectedScore(
                                  p.avgPts,
                                  p.avgReb,
                                  p.avgAst,
                                ).toFixed(1)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                {/* Projected total */}
                <div className="mt-6 text-center">
                  <p className="text-xs uppercase tracking-wider text-text-muted">
                    Projected Total Score
                  </p>
                  <p className="mt-1 font-mono text-3xl font-bold text-neon-green">
                    {projectedTotal.toFixed(1)}
                  </p>
                </div>

                {/* Lock info */}
                <p className="mt-4 text-center text-xs text-text-secondary">
                  You can edit your roster anytime before{' '}
                  <span className="font-semibold text-neon-orange">
                    {format(getRosterLockDate(), 'MMM d, yyyy h:mm a')}
                  </span>
                  .
                </p>

                {/* Buttons */}
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="rounded-xl border border-bg-border bg-bg-card px-5 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-card-hover"
                  >
                    Go Back
                  </button>
                  <button
                    type="button"
                    disabled={submitMutation.isPending}
                    onClick={() => submitMutation.mutate()}
                    className="rounded-xl bg-neon-green px-5 py-2.5 text-sm font-semibold text-gray-900 transition-shadow hover:shadow-[0_0_20px_rgba(0,255,135,0.4)] disabled:opacity-50"
                  >
                    {submitMutation.isPending
                      ? isEditMode
                        ? 'Updating...'
                        : 'Confirming...'
                      : isEditMode
                        ? 'Update'
                        : 'Confirm'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
