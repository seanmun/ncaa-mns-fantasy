import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { Pencil } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { PlayerStatsCard } from '@/components/player/PlayerStatsCard';
import PageTransition from '@/components/layout/PageTransition';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { SEED_TIERS } from '@/types';
import type { PlayerWithStats } from '@/types';
import { cn, formatScore, isRosterLocked } from '@/lib/utils';
import BracketView from '@/components/bracket/BracketView';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MemberRosterData {
  memberId: string;
  teamName: string;
  displayName: string;
  players: PlayerWithStats[];
  totalScore: number;
}

type Tab = 'roster' | 'bracket';

/* ------------------------------------------------------------------ */
/*  Tier labels                                                        */
/* ------------------------------------------------------------------ */

const TIER_LABELS: Record<number, string> = {
  1: 'TIER 1 \u2014 Seeds 1-4',
  2: 'TIER 2 \u2014 Seeds 5-8',
  3: 'TIER 3 \u2014 Seeds 9-12',
  4: 'TIER 4 \u2014 Seeds 13-16',
};

const TIER_ACCENT: Record<number, string> = {
  1: 'text-tier-1 border-tier-1/30',
  2: 'text-tier-2 border-tier-2/30',
  3: 'text-tier-3 border-tier-3/30',
  4: 'text-tier-4 border-tier-4/30',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function groupPlayersByTier(
  players: PlayerWithStats[],
): Record<number, PlayerWithStats[]> {
  const groups: Record<number, PlayerWithStats[]> = { 1: [], 2: [], 3: [], 4: [] };

  for (const player of players) {
    const tier = SEED_TIERS.find((t) =>
      (t.seeds as readonly number[]).includes(player.team.seed),
    );
    if (tier) {
      groups[tier.tier].push(player);
    }
  }

  return groups;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function MemberRoster() {
  const { id, memberId } = useParams<{ id: string; memberId: string }>();
  const { apiFetch } = useApi();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>('roster');
  const isOwnRoster = user?.id === memberId;
  const locked = isRosterLocked();

  /* ---------- Fetch roster ---------- */
  const { data: roster, isLoading } = useQuery<MemberRosterData>({
    queryKey: ['roster', id, memberId],
    queryFn: () => apiFetch(`/api/leagues/${id}/roster/${memberId}`),
    enabled: !!id && !!memberId,
  });

  const grouped = roster ? groupPlayersByTier(roster.players) : null;

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
        {/* ========== Header ========== */}
        {isLoading ? (
          <div className="mb-6 space-y-2">
            <Skeleton
              height={28}
              width="40%"
              baseColor="#1f2937"
              highlightColor="#374151"
            />
            <Skeleton
              height={16}
              width="25%"
              baseColor="#1f2937"
              highlightColor="#374151"
            />
          </div>
        ) : roster ? (
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="font-display text-3xl tracking-wide text-text-primary">
                {roster.teamName}
              </h1>
              <p className="mt-1 text-sm text-text-secondary">
                {roster.displayName}
              </p>
            </div>
            {isOwnRoster && !locked && (
              <Link
                to={`/leagues/${id}/pick`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-neon-green px-4 py-2 text-sm font-semibold text-gray-900 transition-all hover:shadow-[0_0_15px_rgba(0,255,135,0.3)]"
              >
                <Pencil className="h-4 w-4" />
                Edit Roster
              </Link>
            )}
          </div>
        ) : null}

        {/* ========== Tabs ========== */}
        <div className="mb-6 flex gap-1 rounded-lg bg-bg-card border border-bg-border p-1">
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={cn(
              'flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-all duration-150',
              activeTab === 'roster'
                ? 'bg-neon-green text-gray-900 shadow-[0_0_15px_rgba(0,255,135,0.2)]'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-card-hover',
            )}
          >
            Roster View
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bracket')}
            className={cn(
              'flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-all duration-150',
              activeTab === 'bracket'
                ? 'bg-neon-green text-gray-900 shadow-[0_0_15px_rgba(0,255,135,0.2)]'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-card-hover',
            )}
          >
            Bracket View
          </button>
        </div>

        {/* ========== Roster View ========== */}
        {activeTab === 'roster' && (
          <div className="space-y-8">
            {isLoading ? (
              <>
                {[1, 2, 3, 4].map((tier) => (
                  <div key={tier} className="space-y-3">
                    <Skeleton
                      height={20}
                      width="30%"
                      baseColor="#1f2937"
                      highlightColor="#374151"
                    />
                    {Array.from({ length: tier === 1 ? 4 : tier === 2 ? 3 : tier === 3 ? 2 : 1 }).map((_, i) => (
                      <Skeleton
                        key={i}
                        height={120}
                        baseColor="#1f2937"
                        highlightColor="#374151"
                        className="rounded-xl"
                      />
                    ))}
                  </div>
                ))}
              </>
            ) : grouped ? (
              <>
                {SEED_TIERS.map((tier) => {
                  const tierPlayers = grouped[tier.tier];
                  if (!tierPlayers || tierPlayers.length === 0) return null;

                  return (
                    <section key={tier.tier}>
                      {/* Tier header */}
                      <h2
                        className={cn(
                          'mb-3 border-b pb-2 font-display text-lg tracking-wide',
                          TIER_ACCENT[tier.tier],
                        )}
                      >
                        {TIER_LABELS[tier.tier]}
                      </h2>

                      {/* Player cards */}
                      <div className="space-y-3">
                        {tierPlayers.map((player) => (
                          <PlayerStatsCard
                            key={player.id}
                            player={player}
                            showTournamentStats
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}

                {/* ---- Running total ---- */}
                {roster && (
                  <div className="mt-4 rounded-xl border border-neon-green/30 bg-bg-card p-6 text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                      Total Score
                    </p>
                    <p className="font-display text-5xl tracking-wide text-neon-green">
                      {formatScore(roster.totalScore)}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-bg-border bg-bg-card p-8 text-center text-sm text-text-muted">
                No roster data available.
              </div>
            )}
          </div>
        )}

        {/* ========== Bracket View ========== */}
        {activeTab === 'bracket' && (
          <div className="rounded-xl border border-bg-border bg-bg-card p-4">
            {roster ? (
              <BracketView players={roster.players} />
            ) : (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-text-muted">No roster data available.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
