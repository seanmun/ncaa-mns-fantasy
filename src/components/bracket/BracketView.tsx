import { useMemo } from 'react';
import type { PlayerWithStats } from '@/types';

interface BracketViewProps {
  players: PlayerWithStats[];
}

interface BracketNode {
  round: string;
  roundLabel: string;
  teamName: string;
  seed: number;
  isEliminated: boolean;
  eliminatedInRound: string | null;
  playerNames: string[];
  playerScores: number[];
}

const ROUND_ORDER = [
  'round_of_64',
  'round_of_32',
  'sweet_16',
  'elite_8',
  'final_four',
  'championship',
];

const ROUND_LABELS: Record<string, string> = {
  round_of_64: 'R64',
  round_of_32: 'R32',
  sweet_16: 'S16',
  elite_8: 'E8',
  final_four: 'F4',
  championship: 'CHAMP',
};

export default function BracketView({ players }: BracketViewProps) {
  const teamNodes = useMemo(() => {
    const teamMap = new Map<string, BracketNode>();

    for (const player of players) {
      const teamId = player.team.id;
      if (!teamMap.has(teamId)) {
        teamMap.set(teamId, {
          round: player.team.eliminatedInRound || 'active',
          roundLabel: player.team.eliminatedInRound
            ? ROUND_LABELS[player.team.eliminatedInRound] || '?'
            : 'ALIVE',
          teamName: player.team.name,
          seed: player.team.seed,
          isEliminated: player.team.isEliminated,
          eliminatedInRound: player.team.eliminatedInRound,
          playerNames: [],
          playerScores: [],
        });
      }
      const node = teamMap.get(teamId)!;
      node.playerNames.push(player.name);
      node.playerScores.push(player.totalScore);
    }

    return Array.from(teamMap.values()).sort((a, b) => {
      // Active teams first, then by seed
      if (a.isEliminated && !b.isEliminated) return 1;
      if (!a.isEliminated && b.isEliminated) return -1;
      return a.seed - b.seed;
    });
  }, [players]);

  if (players.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-text-muted">
        No roster picks to display
      </div>
    );
  }

  // Total columns: 1 team label + 6 rounds + 1 player info = 8
  return (
    <div className="overflow-x-auto pb-4">
      <div className="min-w-[700px]">
        {/* Column headers */}
        <div
          className="grid gap-1 mb-4 px-2"
          style={{ gridTemplateColumns: '140px repeat(6, 1fr) 160px' }}
        >
          <div className="text-xs font-mono text-text-muted uppercase text-left">
            Team
          </div>
          {ROUND_ORDER.map((round) => (
            <div
              key={round}
              className="text-center text-xs font-mono text-text-muted uppercase"
            >
              {ROUND_LABELS[round]}
            </div>
          ))}
          <div className="text-xs font-mono text-text-muted uppercase text-right">
            Players
          </div>
        </div>

        {/* Team rows */}
        <div className="space-y-2">
          {teamNodes.map((node) => {
            const eliminatedRoundIndex = node.eliminatedInRound
              ? ROUND_ORDER.indexOf(node.eliminatedInRound)
              : ROUND_ORDER.length;

            return (
              <div
                key={node.teamName}
                className="grid gap-1 items-center px-2"
                style={{ gridTemplateColumns: '140px repeat(6, 1fr) 160px' }}
              >
                {/* Team name */}
                <div
                  className={`text-xs font-semibold truncate pr-1 ${
                    node.isEliminated ? 'text-text-muted' : 'text-text-primary'
                  }`}
                >
                  <span className="font-mono text-text-muted">({node.seed})</span>{' '}
                  {node.teamName}
                </div>

                {/* Round cells */}
                {ROUND_ORDER.map((round, roundIndex) => {
                  const isActive = roundIndex < eliminatedRoundIndex;
                  const isEliminationRound = node.eliminatedInRound === round;

                  return (
                    <div
                      key={round}
                      className={`h-9 rounded-md flex items-center justify-center text-xs font-mono ${
                        isEliminationRound
                          ? 'bg-neon-red/20 border border-neon-red/40 text-neon-red'
                          : isActive
                            ? 'bg-neon-green/10 border border-neon-green/30 text-neon-green'
                            : 'bg-bg-card/30 border border-bg-border/20'
                      }`}
                    >
                      {isEliminationRound && '✕'}
                      {isActive && '✓'}
                    </div>
                  );
                })}

                {/* Player info */}
                <div
                  className={`text-xs text-right ${node.isEliminated ? 'text-text-muted' : 'text-text-secondary'}`}
                >
                  {node.playerNames.map((name, i) => (
                    <div key={name} className="flex justify-between gap-2">
                      <span className={`truncate ${node.isEliminated ? 'line-through' : ''}`}>
                        {name}
                      </span>
                      <span className="font-mono text-text-muted shrink-0">
                        {node.playerScores[i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-6 mt-6 px-2 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-neon-green/10 border border-neon-green/30" />
            <span>Advanced</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-neon-red/20 border border-neon-red/40" />
            <span>Eliminated</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-bg-card/30 border border-bg-border/20" />
            <span>Not Reached</span>
          </div>
        </div>
      </div>
    </div>
  );
}
