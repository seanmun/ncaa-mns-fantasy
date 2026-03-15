import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { PlayerCard } from '@/components/player/PlayerCard';
import PageTransition from '@/components/layout/PageTransition';
import {
  SEED_TIERS,
  getTierForSeed,
  type PlayerWithTeam,
  type RosterPickState,
} from '@/types';
import {
  isRosterLocked,
  getProjectedScore,
  getRosterLockDate,
} from '@/lib/utils';
import { playClick, playSuccess, playDing } from '@/lib/sounds';
import { format } from 'date-fns';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Lock, Search, X } from 'lucide-react';
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

  // ---- Derived state -----------------------------------------------------
  const locked = isRosterLocked();
  const hasExistingRoster =
    existingRoster && existingRoster.players && existingRoster.players.length > 0;

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
    // Sort each tier by projected score descending
    for (const tier of [1, 2, 3, 4]) {
      map[tier].sort(
        (a, b) =>
          getProjectedScore(b.avgPts, b.avgReb, b.avgAst) -
          getProjectedScore(a.avgPts, a.avgReb, a.avgAst),
      );
    }
    return map;
  }, [allPlayers]);

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
      toast.success('Roster confirmed! Good luck in the tournament.');
      setShowConfirmModal(false);

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
        <div className="mx-auto max-w-5xl space-y-8 px-4 pb-32 pt-8">
          {/* Sticky bar skeleton */}
          <div className="h-12 rounded-lg bg-bg-card animate-pulse" />
          {[1, 2, 3, 4].map((t) => (
            <div key={t} className="space-y-4">
              <div className="h-8 w-64 rounded bg-bg-card animate-pulse" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: t === 1 ? 6 : t === 4 ? 3 : 4 }).map(
                  (_, i) => (
                    <CardSkeleton key={i} lines={3} />
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </PageTransition>
    );
  }

  // ---- Locked / read-only state ------------------------------------------
  if (locked || hasExistingRoster) {
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
          {/* Locked badge */}
          <div className="flex items-center justify-center gap-2 rounded-xl border border-neon-red/30 bg-neon-red/10 px-6 py-3">
            <Lock className="h-5 w-5 text-neon-red" />
            <span className="font-display text-lg tracking-wide text-neon-red">
              ROSTER LOCKED
            </span>
          </div>

          {/* Show existing picks by tier */}
          {SEED_TIERS.map((tierConfig) => {
            const tierPlayers = groupedByTier[tierConfig.tier];
            if (tierPlayers.length === 0) return null;
            return (
              <section key={tierConfig.tier}>
                <h2
                  className={`mb-4 border-l-4 pl-3 font-display text-xl tracking-wide ${TIER_BORDER_LEFT[tierConfig.tier]} ${TIER_TEXT_COLOR[tierConfig.tier]}`}
                >
                  {tierConfig.label} &mdash; Seeds{' '}
                  {tierConfig.seeds[0]}&ndash;
                  {tierConfig.seeds[tierConfig.seeds.length - 1]}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tierPlayers.map((player) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      isSelected={true}
                      isDisabled={true}
                      isHot={false}
                      onPick={() => {}}
                      tier={tierConfig.tier as 1 | 2 | 3 | 4}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          {/* Projected total */}
          {rosterPlayers.length > 0 && (
            <div className="text-center">
              <p className="text-sm text-text-muted">Projected Total</p>
              <p className="font-mono text-3xl font-bold text-neon-green">
                {rosterPlayers
                  .reduce(
                    (sum, p) =>
                      sum + getProjectedScore(p.avgPts, p.avgReb, p.avgAst),
                    0,
                  )
                  .toFixed(1)}
              </p>
            </div>
          )}
        </div>
      </PageTransition>
    );
  }

  // ---- Main pick interface -----------------------------------------------
  return (
    <PageTransition>
      <div className="relative mx-auto max-w-5xl pb-44">
        {/* ============================================================= */}
        {/*  TOP STICKY BAR — Pick progress                               */}
        {/* ============================================================= */}
        <div className="sticky top-16 z-40 border-b border-bg-border bg-bg-secondary/95 backdrop-blur-sm">
          <div className="mx-auto flex items-center justify-between gap-2 px-4 py-3">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {SEED_TIERS.map((tierConfig) => {
                const count = pickCount(tierConfig.tier);
                const complete = count === tierConfig.picks;
                return (
                  <div key={tierConfig.tier} className="flex items-center gap-1">
                    {complete ? (
                      <Check
                        className={`h-4 w-4 ${TIER_TEXT_COLOR[tierConfig.tier]}`}
                      />
                    ) : null}
                    <span
                      className={`font-mono ${TIER_TEXT_COLOR[tierConfig.tier]} ${complete ? 'opacity-100' : 'opacity-70'}`}
                    >
                      T{tierConfig.tier}:{' '}
                      <span className="font-bold">{count}</span>/
                      {tierConfig.picks}
                    </span>
                  </div>
                );
              })}
            </div>
            <span className="shrink-0 font-mono text-sm text-text-secondary">
              {totalPicks}/10
            </span>
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

        {/* ============================================================= */}
        {/*  TIER SECTIONS                                                 */}
        {/* ============================================================= */}
        <div className="space-y-10 px-4 pt-6">
          {SEED_TIERS.map((tierConfig) => {
            const count = pickCount(tierConfig.tier);
            const isTierFull = count >= tierConfig.picks;
            const tierPlayers = filteredPlayersByTier[tierConfig.tier];

            return (
              <section key={tierConfig.tier}>
                {/* Tier header */}
                <div
                  className={`mb-4 border-l-4 pl-4 ${TIER_BORDER_LEFT[tierConfig.tier]}`}
                >
                  <h2
                    className={`font-display text-xl tracking-wide sm:text-2xl ${TIER_TEXT_COLOR[tierConfig.tier]}`}
                  >
                    TIER {tierConfig.tier} &mdash; Seeds{' '}
                    {tierConfig.seeds[0]}&ndash;
                    {tierConfig.seeds[tierConfig.seeds.length - 1]}
                  </h2>
                  <p className="mt-0.5 text-sm text-text-secondary">
                    Pick{' '}
                    <span
                      className={`font-mono font-bold ${TIER_TEXT_COLOR[tierConfig.tier]}`}
                    >
                      {tierConfig.picks}
                    </span>{' '}
                    player{tierConfig.picks > 1 ? 's' : ''}
                    {isTierFull && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-neon-green">
                        <Check className="h-3 w-3" /> Complete
                      </span>
                    )}
                  </p>
                </div>

                {/* Search filter */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Filter by team or player..."
                    value={filters[tierConfig.tier]}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        [tierConfig.tier]: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-bg-border bg-bg-card py-2 pl-9 pr-9 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-bg-card-hover focus:ring-1 focus:ring-neon-green/30"
                  />
                  {filters[tierConfig.tier] && (
                    <button
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          [tierConfig.tier]: '',
                        }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-primary"
                      aria-label="Clear filter"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Player grid */}
                {tierPlayers.length === 0 ? (
                  <p className="py-6 text-center text-sm text-text-muted">
                    No players match your filter.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                      {tierPlayers.map((player) => {
                        const selected = isPlayerSelected(player.id);
                        const disabled = isTierFull && !selected;
                        const projScore = getProjectedScore(
                          player.avgPts,
                          player.avgReb,
                          player.avgAst,
                        );
                        const hot = projScore >= hotThreshold;

                        return (
                          <motion.div
                            key={player.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{
                              type: 'spring',
                              stiffness: 400,
                              damping: 25,
                            }}
                          >
                            <PlayerCard
                              player={player}
                              isSelected={selected}
                              isDisabled={disabled}
                              isHot={hot}
                              onPick={(p) =>
                                handlePick(p, tierConfig.tier)
                              }
                              tier={tierConfig.tier as 1 | 2 | 3 | 4}
                            />
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* ============================================================= */}
        {/*  BOTTOM STICKY BAR                                             */}
        {/* ============================================================= */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-bg-border bg-bg-secondary/95 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl px-4 py-3">
            {/* Pick chips row */}
            {totalPicks > 0 && (
              <div className="mb-2.5 flex flex-wrap gap-1.5">
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
                        onClick={() =>
                          handlePick(p, tierConfig.tier)
                        }
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
                className={`rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  allPicked
                    ? 'animate-pulse-neon bg-neon-green text-gray-900 shadow-[0_0_20px_rgba(0,255,135,0.4)]'
                    : 'cursor-not-allowed bg-bg-card text-text-muted opacity-50'
                }`}
              >
                Confirm Roster
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
                  Confirm Your Roster
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

                {/* Lock warning */}
                <p className="mt-4 text-center text-xs text-neon-orange">
                  Once confirmed, your roster cannot be changed after{' '}
                  {format(getRosterLockDate(), 'MMM d, yyyy h:mm a')}.
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
                    {submitMutation.isPending ? 'Confirming...' : 'Confirm'}
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
