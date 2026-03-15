import { cn } from '@/lib/utils';
import { getTierForSeed } from '@/types';

const tierColorMap: Record<number, string> = {
  1: 'bg-tier-1/20 text-tier-1 border-tier-1/30',
  2: 'bg-tier-2/20 text-tier-2 border-tier-2/30',
  3: 'bg-tier-3/20 text-tier-3 border-tier-3/30',
  4: 'bg-tier-4/20 text-tier-4 border-tier-4/30',
};

interface SeedTierBadgeProps {
  seed: number;
  className?: string;
}

export function SeedTierBadge({ seed, className }: SeedTierBadgeProps) {
  const tier = getTierForSeed(seed);
  const colors = tierColorMap[tier.tier] ?? tierColorMap[4];

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums',
        colors,
        className,
      )}
    >
      {seed}
    </span>
  );
}
