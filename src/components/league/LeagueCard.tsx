import { useNavigate } from 'react-router-dom';
import { Users, Lock, Unlock } from 'lucide-react';
import { cn, formatScore } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { GAME_CONFIGS } from '@/lib/gameConfig';

interface LeagueCardLeague {
  id: string;
  name: string;
  memberCount: number;
  userRank?: number;
  userScore?: number;
  isLocked: boolean;
  gameSlug?: string;
}

interface LeagueCardProps {
  league: LeagueCardLeague;
}

export function LeagueCard({ league }: LeagueCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => navigate(`/leagues/${league.id}`)}
      className="group hover:shadow-[0_0_20px_rgba(0,255,135,0.12)] transition-shadow duration-200"
    >
      <div className="flex flex-col gap-3">
        {/* Top row: League name + badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-display text-xl tracking-wide text-text-primary group-hover:text-neon-green transition-colors duration-150 truncate">
              {league.name}
            </h3>
            {league.gameSlug && GAME_CONFIGS[league.gameSlug] && (
              <span className="inline-flex shrink-0 items-center rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-2 py-0.5 text-[10px] font-semibold text-neon-cyan">
                {GAME_CONFIGS[league.gameSlug].shortLabel}
              </span>
            )}
          </div>

          {league.isLocked ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-neon-red/30 bg-neon-red/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-neon-red">
              <Lock className="h-3 w-3" />
              Locked
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-neon-green/30 bg-neon-green/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-neon-green">
              <Unlock className="h-3 w-3" />
              Active
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6">
          {/* Members */}
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Users className="h-4 w-4" />
            <span className="text-sm">
              {league.memberCount}{' '}
              <span className="hidden sm:inline">members</span>
            </span>
          </div>

          {/* Rank */}
          {league.userRank != null && (
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wider text-text-muted">
                Rank
              </span>
              <span
                className={cn(
                  'font-mono text-sm font-bold',
                  league.userRank === 1 ? 'text-neon-green' : 'text-text-primary',
                )}
              >
                #{league.userRank}
              </span>
            </div>
          )}

          {/* Score */}
          {league.userScore != null && (
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wider text-text-muted">
                Score
              </span>
              <span className="font-mono text-sm font-bold text-text-primary">
                {formatScore(league.userScore)}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
