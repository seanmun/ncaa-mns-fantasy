import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCountdown } from '@/hooks/useCountdown';

interface CountdownTimerProps {
  className?: string;
  gameSlug?: string;
}

export function CountdownTimer({ className, gameSlug }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, isLocked, isUrgent, isCritical } =
    useCountdown(gameSlug);

  if (isLocked) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full bg-neon-red/15 border border-neon-red/30 px-4 py-1.5',
          className,
        )}
      >
        <Lock className="h-4 w-4 text-neon-red" />
        <span className="text-sm font-semibold text-neon-red">
          ROSTER LOCKED
        </span>
      </div>
    );
  }

  const timeColor = isCritical
    ? 'text-neon-red'
    : isUrgent
      ? 'text-neon-orange'
      : 'text-text-primary';

  const segments = isUrgent
    ? [
        { value: hours, label: 'h' },
        { value: minutes, label: 'm' },
        { value: seconds, label: 's' },
      ]
    : [
        { value: days, label: 'd' },
        { value: hours, label: 'h' },
        { value: minutes, label: 'm' },
        { value: seconds, label: 's' },
      ];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1',
        isCritical && 'animate-pulse-neon rounded-lg px-3 py-1',
        className,
      )}
    >
      {segments.map(({ value, label }) => (
        <span key={label} className={cn('inline-flex items-baseline', timeColor)}>
          <span className="font-mono text-lg font-bold tabular-nums">
            {String(value).padStart(2, '0')}
          </span>
          <span className="text-xs text-text-muted">{label}</span>
        </span>
      ))}
    </div>
  );
}
