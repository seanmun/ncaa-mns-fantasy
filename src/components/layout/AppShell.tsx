import { Outlet } from 'react-router-dom';
import { Clock, Lock } from 'lucide-react';
import Header from './Header';
import BottomNav from './BottomNav';
import { useCountdown } from '@/hooks/useCountdown';
import { cn } from '@/lib/utils';

function RosterBanner() {
  const { days, hours, minutes, seconds, isLocked, isUrgent, isCritical } =
    useCountdown();

  if (isLocked) {
    return (
      <div className="fixed top-16 left-0 right-0 z-40 flex items-center justify-center gap-2 bg-bg-secondary/80 backdrop-blur-sm border-b border-bg-border py-1.5">
        <Lock className="h-3 w-3 text-text-muted" />
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Rosters Locked
        </span>
      </div>
    );
  }

  const timeColor = isCritical
    ? 'text-neon-red'
    : isUrgent
      ? 'text-neon-orange'
      : 'text-neon-green';

  return (
    <div
      className={cn(
        'fixed top-16 left-0 right-0 z-40 flex items-center justify-center gap-2 border-b py-1.5 backdrop-blur-sm',
        isCritical
          ? 'bg-neon-red/5 border-neon-red/20'
          : isUrgent
            ? 'bg-neon-orange/5 border-neon-orange/20'
            : 'bg-bg-secondary/80 border-bg-border',
      )}
    >
      <Clock className={cn('h-3 w-3', timeColor)} />
      <span className="text-xs font-medium text-text-muted">Lock in</span>
      <span className={cn('font-mono text-xs font-bold tabular-nums', timeColor)}>
        {days > 0 && `${days}d `}
        {String(hours).padStart(2, '0')}h {String(minutes).padStart(2, '0')}m{' '}
        {String(seconds).padStart(2, '0')}s
      </span>
    </div>
  );
}

export default function AppShell() {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <Header />
      <RosterBanner />

      {/* Main content area — pt accounts for header (64px) + banner (~32px) */}
      <main className="flex-1 pt-[96px] pb-[60px] md:pb-0">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}
