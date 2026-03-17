import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn, formatScore } from '@/lib/utils';
import type { StandingsEntry } from '@/types';

type SortKey = 'totalScore' | 'totalPts' | 'totalReb' | 'totalAst';
type SortDir = 'asc' | 'desc';

interface StandingsTableProps {
  standings: StandingsEntry[];
  currentUserId: string;
  leagueId: string;
}

const SORT_COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'totalScore', label: 'SCR' },
  { key: 'totalPts', label: 'PTS' },
  { key: 'totalReb', label: 'REB' },
  { key: 'totalAst', label: 'AST' },
];

export function StandingsTable({
  standings,
  currentUserId,
  leagueId,
}: StandingsTableProps) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>('totalScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'));
      } else {
        setSortKey(key);
        setSortDir('desc');
      }
    },
    [sortKey],
  );

  const sorted = [...standings].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return sortDir === 'desc' ? -diff : diff;
  });

  const ranked = sorted.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));

  return (
    <div
      className="rounded-xl border border-bg-border bg-bg-card"
      role="region"
      aria-label="League standings"
    >
      <div aria-live="polite" className="sr-only">
        Standings sorted by {sortKey.replace('total', '')} in{' '}
        {sortDir === 'desc' ? 'descending' : 'ascending'} order
      </div>

      <table role="table" className="w-full text-sm">
        <thead>
          <tr className="border-b border-bg-border text-left">
            <th
              scope="col"
              className="py-2.5 pl-3 pr-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted"
            >
              #
            </th>
            <th
              scope="col"
              className="px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted"
            >
              Team
            </th>
            <th
              scope="col"
              className="px-1 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-text-muted"
            >
              P
            </th>
            {SORT_COLUMNS.map(({ key, label }) => (
              <th
                key={key}
                scope="col"
                className="px-1 py-2.5 text-right"
              >
                <button
                  type="button"
                  onClick={() => handleSort(key)}
                  aria-sort={
                    sortKey === key
                      ? sortDir === 'desc'
                        ? 'descending'
                        : 'ascending'
                      : 'none'
                  }
                  className={cn(
                    'text-[10px] font-semibold uppercase tracking-wider transition-colors duration-150',
                    'hover:text-neon-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green rounded',
                    sortKey === key ? 'text-neon-green' : 'text-text-muted',
                  )}
                >
                  {label}
                  {sortKey === key && (
                    <span aria-hidden="true" className="ml-0.5">
                      {sortDir === 'desc' ? '\u25BC' : '\u25B2'}
                    </span>
                  )}
                </button>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {ranked.map((entry) => {
            const isCurrentUser = entry.userId === currentUserId;

            return (
              <tr
                key={entry.memberId}
                onClick={() =>
                  navigate(`/leagues/${leagueId}/roster/${entry.memberId}`)
                }
                role="row"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(
                      `/leagues/${leagueId}/roster/${entry.memberId}`,
                    );
                  }
                }}
                className={cn(
                  'cursor-pointer border-b border-bg-border transition-colors duration-100',
                  'hover:bg-bg-card-hover focus-visible:outline-none focus-visible:bg-bg-card-hover',
                  isCurrentUser && 'bg-neon-green/5',
                )}
              >
                {/* Rank */}
                <td className="py-2.5 pl-3 pr-1 font-mono text-xs font-bold text-text-primary">
                  {entry.rank}
                </td>

                {/* Team */}
                <td
                  className={cn(
                    'px-2 py-2.5 text-xs font-semibold truncate max-w-[120px] sm:max-w-none',
                    isCurrentUser ? 'text-neon-green' : 'text-text-primary',
                  )}
                >
                  {entry.teamName}
                  {isCurrentUser && (
                    <span className="ml-1 text-[9px] uppercase text-text-muted">
                      (you)
                    </span>
                  )}
                </td>

                {/* Players */}
                <td className="px-1 py-2.5 text-center font-mono text-xs">
                  <span className={entry.eliminatedCount > 0 ? 'text-neon-orange' : 'text-neon-green'}>
                    {entry.playerCount - entry.eliminatedCount}
                  </span>
                  <span className="text-text-muted">/{entry.playerCount}</span>
                </td>

                {/* Score */}
                <td className="px-1 py-2.5 text-right font-mono text-xs font-bold text-neon-green">
                  {formatScore(entry.totalScore)}
                </td>

                {/* PTS */}
                <td className="px-1 py-2.5 text-right font-mono text-xs text-text-primary">
                  {formatScore(entry.totalPts)}
                </td>

                {/* REB */}
                <td className="px-1 py-2.5 text-right font-mono text-xs text-text-primary">
                  {formatScore(entry.totalReb)}
                </td>

                {/* AST */}
                <td className="px-1 py-2.5 text-right font-mono text-xs text-text-primary">
                  {formatScore(entry.totalAst)}
                </td>
              </tr>
            );
          })}

          {ranked.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="px-3 py-8 text-center text-sm text-text-muted"
              >
                No standings data yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
