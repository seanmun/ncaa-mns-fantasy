import { SEED_TIERS, type PlayerWithTeam, type RosterPickState } from '@/types';
import { cn, getProjectedScore } from '@/lib/utils';
import { X } from 'lucide-react';
import { TIER_TEXT_COLOR, TIER_BG_LOW } from './tierStyles';

interface MobileRosterViewProps {
  picks: RosterPickState;
  totalPicks: number;
  projectedTotal: number;
  onTierSelect: (tier: number) => void;
  onRemovePlayer: (player: PlayerWithTeam, tier: number) => void;
}

const tierKey = (tier: number): keyof RosterPickState =>
  `tier${tier}` as keyof RosterPickState;

export default function MobileRosterView({
  picks,
  totalPicks,
  projectedTotal,
  onTierSelect,
  onRemovePlayer,
}: MobileRosterViewProps) {
  return (
    <div className="space-y-4 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg uppercase tracking-wider text-text-primary">
          Your Picks
          <span className="ml-2 font-mono text-sm text-text-muted">
            {totalPicks}/10
          </span>
        </h3>
        {totalPicks > 0 && (
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">
              Projected
            </p>
            <p className="font-mono text-lg font-bold text-neon-green">
              {projectedTotal.toFixed(1)}
            </p>
          </div>
        )}
      </div>

      {/* Picks by tier */}
      {SEED_TIERS.map((tierConfig) => {
        const tierPicks = picks[tierKey(tierConfig.tier)];
        const slots = tierConfig.picks;

        return (
          <div key={tierConfig.tier}>
            <button
              type="button"
              onClick={() => onTierSelect(tierConfig.tier)}
              className={cn(
                'mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-colors',
                TIER_TEXT_COLOR[tierConfig.tier],
              )}
            >
              <span>{tierConfig.label}</span>
              <span className="font-mono opacity-70">
                {tierPicks.length}/{slots}
              </span>
              {tierPicks.length < slots && (
                <span className="text-[10px] normal-case text-text-muted">
                  — tap to pick
                </span>
              )}
            </button>

            <div className="space-y-1.5">
              {tierPicks.map((p) => {
                const projScore = getProjectedScore(
                  p.avgPts,
                  p.avgReb,
                  p.avgAst,
                );
                return (
                  <div
                    key={p.id}
                    className={cn(
                      'flex items-center justify-between rounded-xl px-3 py-2.5',
                      TIER_BG_LOW[tierConfig.tier],
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-semibold text-text-primary truncate">
                        {p.name}
                      </span>
                      <span className="shrink-0 text-xs text-text-muted">
                        {p.team.shortName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-xs text-text-secondary">
                        {projScore.toFixed(1)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemovePlayer(p, tierConfig.tier)}
                        className="rounded-full p-1 opacity-60 transition-opacity hover:opacity-100 hover:bg-bg-card-hover"
                        aria-label={`Remove ${p.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Empty slot indicators */}
              {Array.from({ length: slots - tierPicks.length }).map((_, i) => (
                <button
                  key={`empty-${tierConfig.tier}-${i}`}
                  type="button"
                  onClick={() => onTierSelect(tierConfig.tier)}
                  className="flex w-full items-center rounded-xl border border-dashed border-bg-border px-3 py-2.5 text-sm text-text-muted transition-colors hover:border-text-muted hover:text-text-secondary"
                >
                  + Pick a player
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
