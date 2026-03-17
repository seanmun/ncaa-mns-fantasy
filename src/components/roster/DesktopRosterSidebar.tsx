import { SEED_TIERS, type PlayerWithTeam, type RosterPickState } from '@/types';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { TIER_TEXT_COLOR, TIER_BG_LOW } from './tierStyles';

interface DesktopRosterSidebarProps {
  picks: RosterPickState;
  activeTier: number;
  totalPicks: number;
  projectedTotal: number;
  onTierClick: (tier: number) => void;
  onRemovePlayer: (player: PlayerWithTeam, tier: number) => void;
}

const tierKey = (tier: number): keyof RosterPickState =>
  `tier${tier}` as keyof RosterPickState;

export default function DesktopRosterSidebar({
  picks,
  activeTier,
  totalPicks,
  projectedTotal,
  onTierClick,
  onRemovePlayer,
}: DesktopRosterSidebarProps) {
  return (
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
                  onClick={() => onTierClick(tierConfig.tier)}
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
                        onClick={() => onRemovePlayer(p, tierConfig.tier)}
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
  );
}
