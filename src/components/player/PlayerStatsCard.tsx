import { cn, getProjectedScore } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { SeedTierBadge } from '@/components/ui/SeedTierBadge';
import { RegionBadge } from '@/components/ui/RegionBadge';
import type { PlayerWithStats } from '@/types';

const ROUND_LABELS: Record<string, string> = {
  round_of_64: 'Round of 64',
  round_of_32: 'Round of 32',
  sweet_16: 'Sweet 16',
  elite_8: 'Elite 8',
  final_four: 'Final Four',
  championship: 'Championship',
};

interface PlayerStatsCardProps {
  player: PlayerWithStats;
  showTournamentStats: boolean;
}

export function PlayerStatsCard({
  player,
  showTournamentStats,
}: PlayerStatsCardProps) {
  const isEliminated = player.team.isEliminated;
  const eliminatedRound = player.team.eliminatedInRound;

  const projectedScore = getProjectedScore(
    player.avgPts,
    player.avgReb,
    player.avgAst,
  );

  return (
    <Card
      className={cn(
        'relative transition-opacity duration-300',
        isEliminated && 'opacity-40',
      )}
    >
      <div className="flex flex-col gap-3">
        {/* Header: Player name + jersey */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3
              className={cn(
                'truncate text-sm font-semibold text-text-primary',
                isEliminated && 'line-through',
              )}
            >
              {player.name}
              {player.jersey && (
                <span className="ml-2 font-mono text-xs font-normal text-text-muted">
                  #{player.jersey}
                </span>
              )}
            </h3>

            {/* Team + badges */}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-text-secondary">
                {player.team.name}
              </span>
              <SeedTierBadge seed={player.team.seed} />
              <RegionBadge region={player.team.region} />
            </div>
          </div>

          {/* Eliminated badge or projected score */}
          {isEliminated && eliminatedRound ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-neon-red/30 bg-neon-red/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-neon-red">
              {'💀'} ELIMINATED &mdash;{' '}
              {ROUND_LABELS[eliminatedRound] ?? eliminatedRound}
            </span>
          ) : (
            <div className="shrink-0 text-right">
              <p className="text-[10px] uppercase tracking-wide text-text-muted">
                Projected
              </p>
              <p className="font-mono text-lg font-bold text-text-primary">
                {projectedScore.toFixed(1)}
              </p>
            </div>
          )}
        </div>

        {/* Stats display */}
        {showTournamentStats ? (
          <div className="grid grid-cols-4 gap-2 rounded-lg bg-bg-primary/50 p-3">
            <RunningStatCell label="PTS" value={player.totalPts} />
            <RunningStatCell label="REB" value={player.totalReb} />
            <RunningStatCell label="AST" value={player.totalAst} />
            <RunningStatCell
              label="TOTAL"
              value={player.totalScore}
              highlight
            />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <SeasonStatCell label="PTS" value={player.avgPts} />
            <SeasonStatCell label="REB" value={player.avgReb} />
            <SeasonStatCell label="AST" value={player.avgAst} />
          </div>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                  */
/* ------------------------------------------------------------------ */

function RunningStatCell({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <span
        className={cn(
          'font-mono text-sm font-bold',
          highlight ? 'text-neon-green' : 'text-text-primary',
        )}
      >
        {value}
      </span>
    </div>
  );
}

function SeasonStatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <span className="font-mono text-sm font-medium text-text-secondary">
        {parseFloat(value).toFixed(1)}
      </span>
    </div>
  );
}
