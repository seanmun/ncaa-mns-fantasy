import { SEED_TIERS, type PlayerWithTeam } from '@/types';
import { getProjectedScore } from '@/lib/utils';
import { Lock } from 'lucide-react';
import { TIER_TEXT_COLOR, TIER_BORDER_LEFT } from './tierStyles';

interface LockedRosterViewProps {
  rosterPlayers: PlayerWithTeam[];
  groupedByTier: Record<number, PlayerWithTeam[]>;
}

export default function LockedRosterView({
  rosterPlayers,
  groupedByTier,
}: LockedRosterViewProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 pb-16 pt-8">
      <div className="flex items-center justify-center gap-2 rounded-xl border border-neon-red/30 bg-neon-red/10 px-6 py-3">
        <Lock className="h-5 w-5 text-neon-red" />
        <span className="font-display text-lg tracking-wide text-neon-red">
          ROSTER LOCKED
        </span>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-3 px-3 pb-1.5 text-[10px] uppercase tracking-wider text-text-muted font-mono">
        <div className="flex-1">Player</div>
        <span className="w-10 text-right hidden sm:block">PTS</span>
        <span className="w-10 text-right hidden sm:block">REB</span>
        <span className="w-10 text-right hidden sm:block">AST</span>
        <span className="w-12 text-right">Proj</span>
      </div>

      {SEED_TIERS.map((tierConfig) => {
        const tierPlayers = groupedByTier[tierConfig.tier];
        if (tierPlayers.length === 0) return null;
        return (
          <section key={tierConfig.tier}>
            <h2
              className={`mb-2 border-l-4 pl-3 font-display text-sm tracking-wide ${TIER_BORDER_LEFT[tierConfig.tier]} ${TIER_TEXT_COLOR[tierConfig.tier]}`}
            >
              {tierConfig.label}
            </h2>
            <div className="divide-y divide-bg-border/40 rounded-xl border border-bg-border bg-bg-card overflow-hidden mb-4">
              {tierPlayers.map((player) => {
                const projScore = getProjectedScore(
                  player.avgPts,
                  player.avgReb,
                  player.avgAst,
                );
                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 px-3 py-2.5 border-l-4 ${TIER_BORDER_LEFT[tierConfig.tier]}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text-primary truncate">
                          {player.name}
                        </span>
                        <span className="shrink-0 text-xs text-text-muted">
                          ({player.team.seed}) {player.team.shortName}
                        </span>
                        <span className="shrink-0 text-[10px] text-text-muted hidden sm:inline">
                          {player.team.region}
                        </span>
                      </div>
                    </div>
                    <span className="w-10 text-right font-mono text-xs text-text-secondary hidden sm:block">
                      {parseFloat(player.avgPts).toFixed(1)}
                    </span>
                    <span className="w-10 text-right font-mono text-xs text-text-secondary hidden sm:block">
                      {parseFloat(player.avgReb).toFixed(1)}
                    </span>
                    <span className="w-10 text-right font-mono text-xs text-text-secondary hidden sm:block">
                      {parseFloat(player.avgAst).toFixed(1)}
                    </span>
                    <span className="w-12 text-right font-mono text-sm font-bold text-text-primary">
                      {projScore.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {rosterPlayers.length > 0 && (
        <div className="rounded-xl border border-neon-green/30 bg-bg-card px-4 py-4 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Projected Total
          </span>
          <span className="font-mono text-3xl font-bold text-neon-green">
            {rosterPlayers
              .reduce(
                (sum, p) =>
                  sum + getProjectedScore(p.avgPts, p.avgReb, p.avgAst),
                0,
              )
              .toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}
