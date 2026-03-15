import { motion } from 'framer-motion';
import { cn, getProjectedScore } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { SeedTierBadge } from '@/components/ui/SeedTierBadge';
import { RegionBadge } from '@/components/ui/RegionBadge';
import type { PlayerWithTeam } from '@/types';

const tierBorderColor: Record<number, string> = {
  1: 'border-l-tier-1',
  2: 'border-l-tier-2',
  3: 'border-l-tier-3',
  4: 'border-l-tier-4',
};

const tierGlowShadow: Record<number, string> = {
  1: 'shadow-[0_0_18px_rgba(0,255,135,0.3)] border-tier-1/60',
  2: 'shadow-[0_0_18px_rgba(0,229,255,0.3)] border-tier-2/60',
  3: 'shadow-[0_0_18px_rgba(191,90,242,0.3)] border-tier-3/60',
  4: 'shadow-[0_0_18px_rgba(255,159,10,0.3)] border-tier-4/60',
};

interface PlayerCardProps {
  player: PlayerWithTeam;
  isSelected: boolean;
  isDisabled: boolean;
  isHot: boolean;
  onPick: (player: PlayerWithTeam) => void;
  tier: 1 | 2 | 3 | 4;
}

export function PlayerCard({
  player,
  isSelected,
  isDisabled,
  isHot,
  onPick,
  tier,
}: PlayerCardProps) {
  const projectedScore = getProjectedScore(
    player.avgPts,
    player.avgReb,
    player.avgAst,
  );

  const disabledNotSelected = isDisabled && !isSelected;

  return (
    <Card
      className={cn(
        'relative border-l-4 transition-all duration-200',
        tierBorderColor[tier],
        isSelected && tierGlowShadow[tier],
        disabledNotSelected && 'opacity-50 pointer-events-none',
      )}
    >
      <motion.div
        whileHover={disabledNotSelected ? undefined : { scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="flex flex-col gap-3"
      >
        {/* Header: Player name + jersey */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-text-primary">
                {player.name}
              </h3>
              {player.jersey && (
                <span className="shrink-0 font-mono text-xs text-text-muted">
                  #{player.jersey}
                </span>
              )}
              {isHot && (
                <span className="shrink-0 text-sm" aria-label="Hot pick">
                  {'🔥'}
                </span>
              )}
            </div>

            {/* Team + badges */}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-text-secondary">
                {player.team.name}
              </span>
              <SeedTierBadge seed={player.team.seed} />
              <RegionBadge region={player.team.region} />
            </div>
          </div>

          {/* Projected score */}
          <div className="shrink-0 text-right">
            <p className="text-[10px] uppercase tracking-wide text-text-muted">
              Projected
            </p>
            <p className="font-mono text-lg font-bold text-text-primary">
              {projectedScore.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Season averages */}
        <div className="flex items-center gap-4">
          <StatCell label="PTS" value={player.avgPts} />
          <StatCell label="REB" value={player.avgReb} />
          <StatCell label="AST" value={player.avgAst} />
        </div>

        {/* Pick button */}
        <button
          type="button"
          onClick={() => onPick(player)}
          disabled={disabledNotSelected}
          aria-pressed={isSelected}
          className={cn(
            'w-full rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
            isSelected
              ? 'bg-neon-green text-gray-900 shadow-[0_0_20px_rgba(0,255,135,0.4)]'
              : 'bg-bg-card-hover text-text-primary hover:bg-bg-border',
            disabledNotSelected && 'cursor-not-allowed opacity-50',
          )}
        >
          {isSelected ? 'Selected' : 'Pick'}
        </button>
      </motion.div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Small internal helper                                             */
/* ------------------------------------------------------------------ */

function StatCell({ label, value }: { label: string; value: string }) {
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
