import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import PageTransition from '@/components/layout/PageTransition';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { SEED_TIERS } from '@/types';
import type { PlayerWithStats, PlayerTournamentStat } from '@/types';
import { cn, formatScore, isRosterLocked } from '@/lib/utils';
import BracketView from '@/components/bracket/BracketView';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MemberRosterData {
  memberId: string;
  userId: string;
  teamName: string;
  displayName: string;
  players: PlayerWithStats[];
  totalScore: number;
}

type Tab = 'roster' | 'bracket';

const ROUND_LABELS: Record<string, string> = {
  play_in: 'Play-In',
  round_of_64: 'R64',
  round_of_32: 'R32',
  sweet_16: 'Sweet 16',
  elite_8: 'Elite 8',
  final_four: 'Final Four',
  championship: 'Championship',
};

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
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const locked = isRosterLocked();

  /* ---------- Fetch roster ---------- */
  const { data: roster, isLoading } = useQuery<MemberRosterData>({
    queryKey: ['roster', id, memberId],
    queryFn: () => apiFetch(`/api/leagues/${id}/roster/${memberId}`),
    enabled: !!id && !!memberId,
  });

  const isOwnRoster = roster ? user?.id === roster.userId : false;
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
          <div className="space-y-6">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    height={40}
                    baseColor="#1f2937"
                    highlightColor="#374151"
                    className="rounded-lg"
                  />
                ))}
              </div>
            ) : grouped ? (
              <>
                {/* Stat column headers */}
                <div className="flex justify-end px-2 pb-1">
                  <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                    <span>PTS</span>
                    <span>REB</span>
                    <span>AST</span>
                    <span>TOT</span>
                  </div>
                </div>

                {SEED_TIERS.map((tier) => {
                  const tierPlayers = grouped[tier.tier];
                  if (!tierPlayers || tierPlayers.length === 0) return null;

                  return (
                    <section key={tier.tier}>
                      {/* Tier header */}
                      <h2
                        className={cn(
                          'mb-2 border-b pb-1.5 font-display text-sm tracking-wide',
                          TIER_ACCENT[tier.tier],
                        )}
                      >
                        {TIER_LABELS[tier.tier]}
                      </h2>

                      {/* Player list */}
                      <div className="divide-y divide-bg-border/50">
                        {tierPlayers.map((player) => {
                          const eliminated = player.team.isEliminated;
                          const injured = !player.isActive;
                          const isExpanded = expandedPlayer === player.id;
                          const stats = (player.tournamentStats || [])
                            .slice()
                            .sort((a: PlayerTournamentStat, b: PlayerTournamentStat) =>
                              new Date(a.gameDate || 0).getTime() - new Date(b.gameDate || 0).getTime()
                            );

                          return (
                            <div
                              key={player.id}
                              className={cn(
                                (eliminated || injured) && 'opacity-40',
                              )}
                            >
                              {/* Clickable row */}
                              <button
                                type="button"
                                onClick={() => setExpandedPlayer(isExpanded ? null : player.id)}
                                className="w-full text-left py-2.5 px-2 hover:bg-bg-card/50 transition-colors rounded"
                              >
                                {/* Row 1: Name + badges */}
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={cn(
                                      'text-sm font-semibold text-text-primary',
                                      (eliminated || injured) && 'line-through',
                                    )}
                                  >
                                    {player.name}
                                  </span>
                                  {eliminated && (
                                    <span className="shrink-0 rounded-full bg-neon-red/15 px-1.5 py-0.5 text-[10px] font-semibold text-neon-red">
                                      OUT
                                    </span>
                                  )}
                                  {injured && (
                                    <span className="shrink-0 rounded-full bg-neon-orange/15 px-1.5 py-0.5 text-[10px] font-semibold text-neon-orange">
                                      INJ
                                    </span>
                                  )}
                                  {isExpanded ? (
                                    <ChevronUp className="h-3.5 w-3.5 text-text-muted ml-auto" />
                                  ) : (
                                    <ChevronDown className="h-3.5 w-3.5 text-text-muted ml-auto" />
                                  )}
                                </div>

                                {/* Row 2: Team info + stats */}
                                <div className="flex items-center justify-between mt-1">
                                  <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                                    <span>({player.team.seed}) {player.team.shortName}</span>
                                    {player.jersey && (
                                      <span className="font-mono">#{player.jersey}</span>
                                    )}
                                    <span className="hidden sm:inline">{player.team.region}</span>
                                  </div>
                                  <div className="flex items-center gap-3 font-mono text-xs">
                                    <span className="text-text-secondary">{player.totalPts}</span>
                                    <span className="text-text-secondary">{player.totalReb}</span>
                                    <span className="text-text-secondary">{player.totalAst}</span>
                                    <span className="font-bold text-neon-green">{player.totalScore}</span>
                                  </div>
                                </div>
                              </button>

                              {/* Expanded game stats */}
                              {isExpanded && stats.length > 0 && (
                                <div className="px-2 pb-3 pt-1">
                                  <div className="rounded-lg bg-bg-secondary border border-bg-border overflow-hidden">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="border-b border-bg-border">
                                          <th className="text-left px-3 py-1.5 font-normal text-text-muted">Round</th>
                                          <th className="text-center px-2 py-1.5 font-normal text-text-muted">PTS</th>
                                          <th className="text-center px-2 py-1.5 font-normal text-text-muted">REB</th>
                                          <th className="text-center px-2 py-1.5 font-normal text-text-muted">AST</th>
                                          <th className="text-center px-2 py-1.5 font-normal text-text-muted">TOT</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {stats.map((s: PlayerTournamentStat) => (
                                          <tr key={s.id} className="border-b border-bg-border/50 last:border-0">
                                            <td className="px-3 py-1.5 text-text-secondary">
                                              {ROUND_LABELS[s.round] || s.round}
                                            </td>
                                            <td className="text-center px-2 py-1.5 font-mono text-text-secondary">{s.pts}</td>
                                            <td className="text-center px-2 py-1.5 font-mono text-text-secondary">{s.reb}</td>
                                            <td className="text-center px-2 py-1.5 font-mono text-text-secondary">{s.ast}</td>
                                            <td className="text-center px-2 py-1.5 font-mono font-bold text-neon-green">
                                              {(s.pts || 0) + (s.reb || 0) + (s.ast || 0)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                              {isExpanded && stats.length === 0 && (
                                <div className="px-2 pb-3 pt-1">
                                  <p className="text-xs text-text-muted px-3 py-2 rounded-lg bg-bg-secondary border border-bg-border">
                                    No game stats recorded yet.
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}

                {/* ---- Running total ---- */}
                {roster && (
                  <div className="rounded-xl border border-neon-green/30 bg-bg-card px-4 py-4 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Total Score
                    </span>
                    <span className="font-display text-3xl tracking-wide text-neon-green">
                      {formatScore(roster.totalScore)}
                    </span>
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
