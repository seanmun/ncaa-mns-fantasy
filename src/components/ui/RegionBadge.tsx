import { cn } from '@/lib/utils';

interface RegionBadgeProps {
  region: string;
  className?: string;
}

export function RegionBadge({ region, className }: RegionBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-bg-card-hover px-2.5 py-0.5 text-xs font-medium text-text-secondary',
        className,
      )}
    >
      {region}
    </span>
  );
}
