import { SEED_TIERS } from '@/types';
import { cn } from '@/lib/utils';
import { Check, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { TIER_TEXT_COLOR } from './tierStyles';

interface TierNavigationTabsProps {
  activeTier: number;
  totalPicks: number;
  mobileView: 'players' | 'team';
  pickCount: (tier: number) => number;
  onTierClick: (tier: number) => void;
  onMobileViewChange: (view: 'players' | 'team') => void;
}

export default function TierNavigationTabs({
  activeTier,
  totalPicks,
  mobileView,
  pickCount,
  onTierClick,
  onMobileViewChange,
}: TierNavigationTabsProps) {
  return (
    <div className="sticky top-[96px] z-40 border-b border-bg-border bg-bg-secondary backdrop-blur-md">
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
                onClick={() => onTierClick(tierConfig.tier)}
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

        {/* Mobile view toggle -- Players vs My Team */}
        <div className="flex lg:hidden border-t border-bg-border">
          <button
            type="button"
            onClick={() => onMobileViewChange('players')}
            className={cn(
              'flex-1 py-2.5 text-center text-xs font-semibold uppercase tracking-wider transition-colors border-b-2',
              mobileView === 'players'
                ? 'text-neon-green border-neon-green'
                : 'text-text-muted border-transparent hover:text-text-secondary',
            )}
          >
            Players
          </button>
          <button
            type="button"
            onClick={() => onMobileViewChange('team')}
            className={cn(
              'flex-1 py-2.5 text-center text-xs font-semibold uppercase tracking-wider transition-colors border-b-2',
              mobileView === 'team'
                ? 'text-neon-green border-neon-green'
                : 'text-text-muted border-transparent hover:text-text-secondary',
            )}
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              My Team
              {totalPicks > 0 && (
                <span className="font-mono text-[10px] opacity-70">
                  {totalPicks}/10
                </span>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
