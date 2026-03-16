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

const SORT_COLUMNS: { key: SortKey; label: string; shortLabel: string }[] = [
  { key: 'totalPts', label: 'PTS', shortLabel: 'PTS' },
  { key: 'totalReb', label: 'REB', shortLabel: 'REB' },
  { key: 'totalAst', label: 'AST', shortLabel: 'AST' },
  { key: 'totalScore', label: 'TOTAL', shortLabel: 'TOT' },
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

  // Assign rank based on sorted order
  const ranked = sorted.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));

  return (
    <div
      className="overflow-x-auto rounded-xl border border-bg-border bg-bg-card"
      role="region"
      aria-label="League standings"
    >
      <div aria-live="polite" className="sr-only">
        Standings sorted by {sortKey.replace('total', '')} in{' '}
        {sortDir === 'desc' ? 'descending' : 'ascending'} order
      </div>

      <table role="table" className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-bg-border text-left">
            <th
              scope="col"
              className="sticky left-0 z-10 bg-bg-card px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted"
            >
              Rank
            </th>
            <th
              scope="col"
              className="sticky left-[72px] z-10 bg-bg-card px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted"
            >
              Team
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted"
            >
              Players
            </th>
            {SORT_COLUMNS.map(({ key, label }) => (
              <th
                key={key}
                scope="col"
                className="px-4 py-3 text-right"
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
                    'inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors duration-150',
                    'hover:text-neon-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green focus-visible:ring-offset-1 focus-visible:ring-offset-bg-card rounded',
                    sortKey === key ? 'text-neon-green' : 'text-text-muted',
                  )}
                >
                  {label}
                  {sortKey === key && (
                    <span aria-hidden="true">
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
            const isCurrentUser = entry.memberId === currentUserId;

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
                <td className="sticky left-0 z-10 bg-inherit px-4 py-3 font-mono text-sm font-bold text-text-primary">
                  <span className="flex items-center gap-1.5">
                    {entry.rank === 1 && (
                      <span aria-label="First place">{'🏆'}</span>
                    )}
                    <span>{entry.rank}</span>
                  </span>
                </td>

                {/* Team name */}
                <td
                  className={cn(
                    'sticky left-[72px] z-10 bg-inherit px-4 py-3 font-semibold',
                    isCurrentUser ? 'text-neon-green' : 'text-text-primary',
                  )}
                >
                  {entry.teamName}
                  {isCurrentUser && (
                    <span className="ml-1.5 text-[10px] uppercase text-text-muted">
                      (you)
                    </span>
                  )}
                </td>

                {/* Active players */}
                <td className="px-4 py-3 text-sm font-mono">
                  <span className={entry.eliminatedCount > 0 ? 'text-neon-orange' : 'text-neon-green'}>
                    {entry.playerCount - entry.eliminatedCount}
                  </span>
                  <span className="text-text-muted">/{entry.playerCount}</span>
                </td>

                {/* PTS */}
                <td className="px-4 py-3 text-right font-mono text-sm text-text-primary">
                  {formatScore(entry.totalPts)}
                </td>

                {/* REB */}
                <td className="px-4 py-3 text-right font-mono text-sm text-text-primary">
                  {formatScore(entry.totalReb)}
                </td>

                {/* AST */}
                <td className="px-4 py-3 text-right font-mono text-sm text-text-primary">
                  {formatScore(entry.totalAst)}
                </td>

                {/* TOTAL */}
                <td className="px-4 py-3 text-right font-mono text-sm font-bold text-neon-green">
                  {formatScore(entry.totalScore)}
                </td>
              </tr>
            );
          })}

          {ranked.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-8 text-center text-sm text-text-muted"
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
