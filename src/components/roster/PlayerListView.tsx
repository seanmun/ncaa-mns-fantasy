import type { SeedTier, PlayerWithTeam } from '@/types';
import { cn, getProjectedScore } from '@/lib/utils';
import { Check, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TIER_TEXT_COLOR, TIER_BG_LOW, TIER_BORDER_LEFT } from './tierStyles';

interface PlayerListViewProps {
  activeTier: number;
  activeTierConfig: SeedTier;
  activeTierFull: boolean;
  activeTierPlayers: PlayerWithTeam[];
  filter: string;
  sortMode: 'projected' | 'team';
  hotThreshold: number;
  isPlayerSelected: (playerId: string) => boolean;
  onFilterChange: (value: string) => void;
  onFilterClear: () => void;
  onSortModeChange: (mode: 'projected' | 'team') => void;
  onPick: (player: PlayerWithTeam, tier: number) => void;
  onPrevTier: () => void;
  onNextTier: () => void;
}

export default function PlayerListView({
  activeTier,
  activeTierConfig,
  activeTierFull,
  activeTierPlayers,
  filter,
  sortMode,
  hotThreshold,
  isPlayerSelected,
  onFilterChange,
  onFilterClear,
  onSortModeChange,
  onPick,
  onPrevTier,
  onNextTier,
}: PlayerListViewProps) {
  const isTeamMode = sortMode === 'team';

  const renderRow = (player: PlayerWithTeam) => {
    const selected = isPlayerSelected(player.id);
    const disabled = activeTierFull && !selected;
    const projScore = getProjectedScore(
      player.avgPts,
      player.avgReb,
      player.avgAst,
    );
    const hot = projScore >= hotThreshold;

    return (
      <button
        key={player.id}
        type="button"
        onClick={() => onPick(player, activeTier)}
        disabled={disabled}
        className={cn(
          'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
          selected
            ? `${TIER_BG_LOW[activeTier]} border-l-4 ${TIER_BORDER_LEFT[activeTier]}`
            : 'border-l-4 border-l-transparent hover:bg-bg-card-hover',
          disabled && !selected && 'opacity-35 cursor-not-allowed',
        )}
      >
        {/* Player info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-primary truncate">
              {player.name}
            </span>
            {!isTeamMode && (
              <span className="shrink-0 text-xs text-text-muted">
                {player.team.shortName}
              </span>
            )}
            <span className="shrink-0 text-[10px] text-text-muted hidden sm:inline">
              {player.team.region}
            </span>
            {hot && (
              <span className="shrink-0 text-xs" aria-label="Hot pick">
                {'🔥'}
              </span>
            )}
            {selected && (
              <Check className={`shrink-0 h-3.5 w-3.5 ${TIER_TEXT_COLOR[activeTier]}`} />
            )}
          </div>
        </div>

        {/* Season averages */}
        <span className="w-10 text-right font-mono text-xs text-text-secondary hidden sm:block">
          {parseFloat(player.avgPts).toFixed(1)}
        </span>
        <span className="w-10 text-right font-mono text-xs text-text-secondary hidden sm:block">
          {parseFloat(player.avgReb).toFixed(1)}
        </span>
        <span className="w-10 text-right font-mono text-xs text-text-secondary hidden sm:block">
          {parseFloat(player.avgAst).toFixed(1)}
        </span>

        {/* Projected */}
        <span className="w-12 text-right font-mono text-sm font-bold text-text-primary">
          {projScore.toFixed(1)}
        </span>
      </button>
    );
  };

  // Build team sections for team sort mode
  const teamSections: {
    teamId: string;
    teamName: string;
    seed: number;
    region: string;
    players: PlayerWithTeam[];
  }[] = [];

  if (isTeamMode) {
    const seen = new Map<string, (typeof teamSections)[0]>();
    for (const p of activeTierPlayers) {
      if (!seen.has(p.team.id)) {
        const section = {
          teamId: p.team.id,
          teamName: p.team.name,
          seed: p.team.seed,
          region: p.team.region,
          players: [] as PlayerWithTeam[],
        };
        seen.set(p.team.id, section);
        teamSections.push(section);
      }
      seen.get(p.team.id)!.players.push(p);
    }
  }

  return (
    <section>
      {/* Tier header */}
      <div className={`mb-4 border-l-4 pl-4 ${TIER_BORDER_LEFT[activeTier]}`}>
        <h2
          className={`font-display text-xl tracking-wide sm:text-2xl ${TIER_TEXT_COLOR[activeTier]}`}
        >
          TIER {activeTier} &mdash; Seeds{' '}
          {activeTierConfig.seeds[0]}&ndash;
          {activeTierConfig.seeds[activeTierConfig.seeds.length - 1]}
        </h2>
        <p className="mt-0.5 text-sm text-text-secondary">
          Pick{' '}
          <span
            className={`font-mono font-bold ${TIER_TEXT_COLOR[activeTier]}`}
          >
            {activeTierConfig.picks}
          </span>{' '}
          player{activeTierConfig.picks > 1 ? 's' : ''}
          {activeTierFull && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-neon-green">
              <Check className="h-3 w-3" /> Complete
            </span>
          )}
        </p>
      </div>

      {/* Search + Sort row */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Filter by team or player..."
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="w-full rounded-lg border border-bg-border bg-bg-card py-2 pl-9 pr-9 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-bg-card-hover focus:ring-1 focus:ring-neon-green/30"
          />
          {filter && (
            <button
              type="button"
              onClick={onFilterClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-primary"
              aria-label="Clear filter"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort toggle */}
        <div className="flex shrink-0 items-center rounded-lg border border-bg-border bg-bg-card">
          <button
            type="button"
            onClick={() => onSortModeChange('projected')}
            className={cn(
              'px-3 py-2 text-xs font-semibold transition-colors rounded-l-lg',
              sortMode === 'projected'
                ? 'bg-neon-green/15 text-neon-green'
                : 'text-text-muted hover:text-text-secondary',
            )}
          >
            Points
          </button>
          <button
            type="button"
            onClick={() => onSortModeChange('team')}
            className={cn(
              'px-3 py-2 text-xs font-semibold transition-colors rounded-r-lg',
              sortMode === 'team'
                ? 'bg-neon-green/15 text-neon-green'
                : 'text-text-muted hover:text-text-secondary',
            )}
          >
            Team
          </button>
        </div>
      </div>

      {/* Player list -- single tier at a time */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTier}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTierPlayers.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-muted">
              No players match your filter.
            </p>
          ) : (
            <div>
              {/* Column headers */}
              <div className="flex items-center gap-3 px-3 pb-1.5 text-[10px] uppercase tracking-wider text-text-muted font-mono">
                <div className="flex-1">Player</div>
                <span className="w-10 text-right hidden sm:block">PTS</span>
                <span className="w-10 text-right hidden sm:block">REB</span>
                <span className="w-10 text-right hidden sm:block">AST</span>
                <span className="w-12 text-right">Proj</span>
              </div>

              {isTeamMode ? (
                <div className="space-y-3">
                  {teamSections.map((section) => (
                    <div key={section.teamId}>
                      <div className="flex items-center gap-2 px-3 py-1.5 text-xs">
                        <span className="font-mono font-bold text-text-muted">
                          ({section.seed})
                        </span>
                        <span className="font-semibold text-text-primary">
                          {section.teamName}
                        </span>
                        <span className="text-text-muted">
                          {section.region}
                        </span>
                      </div>
                      <div className="divide-y divide-bg-border/40 rounded-xl border border-bg-border bg-bg-card overflow-hidden">
                        {section.players.map(renderRow)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-bg-border/40 rounded-xl border border-bg-border bg-bg-card overflow-hidden">
                  {activeTierPlayers.map(renderRow)}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Prev / Next tier navigation */}
      <div className="mt-6 flex items-center justify-between">
        {activeTier > 1 ? (
          <button
            type="button"
            onClick={onPrevTier}
            className="flex items-center gap-2 rounded-xl border border-bg-border bg-bg-card px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-card-hover"
          >
            <ChevronLeft className="h-4 w-4" />
            Tier {activeTier - 1}
          </button>
        ) : (
          <div />
        )}

        {activeTier < 4 ? (
          <button
            type="button"
            onClick={onNextTier}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
              activeTierFull
                ? `${TIER_BG_LOW[activeTier + 1]} ${TIER_TEXT_COLOR[activeTier + 1]} border border-transparent`
                : 'border border-bg-border bg-bg-card text-text-primary hover:bg-bg-card-hover',
            )}
          >
            Tier {activeTier + 1}
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <div />
        )}
      </div>
    </section>
  );
}
