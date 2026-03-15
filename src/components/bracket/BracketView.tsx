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

  return (
    <div className="overflow-x-auto pb-4">
      <div className="min-w-[600px]">
        {/* Round headers */}
        <div className="flex gap-1 mb-4 px-2">
          {ROUND_ORDER.map((round) => (
            <div
              key={round}
              className="flex-1 text-center text-xs font-mono text-text-muted uppercase"
            >
              {ROUND_LABELS[round]}
            </div>
          ))}
        </div>

        {/* Team paths */}
        <div className="space-y-3">
          {teamNodes.map((node) => {
            const eliminatedRoundIndex = node.eliminatedInRound
              ? ROUND_ORDER.indexOf(node.eliminatedInRound)
              : ROUND_ORDER.length;

            return (
              <div key={node.teamName} className="flex gap-1 items-center px-2">
                {ROUND_ORDER.map((round, roundIndex) => {
                  const isActive = roundIndex < eliminatedRoundIndex;
                  const isEliminationRound =
                    node.eliminatedInRound === round;

                  return (
                    <div
                      key={round}
                      className={`flex-1 h-10 rounded-md flex items-center justify-center text-xs font-mono transition-all ${
                        isEliminationRound
                          ? 'bg-neon-red/20 border border-neon-red/40 text-neon-red'
                          : isActive
                            ? 'bg-neon-green/10 border border-neon-green/30 text-neon-green'
                            : 'bg-bg-card/30 border border-bg-border/30 text-text-muted/30'
                      }`}
                    >
                      {roundIndex === 0 && (
                        <span className="truncate px-1">
                          ({node.seed}) {node.teamName}
                        </span>
                      )}
                      {isEliminationRound && '✕'}
                      {isActive && roundIndex > 0 && '→'}
                    </div>
                  );
                })}

                {/* Player info */}
                <div
                  className={`w-48 pl-3 text-xs ${node.isEliminated ? 'text-text-muted' : 'text-text-secondary'}`}
                >
                  {node.playerNames.map((name, i) => (
                    <div key={name} className="flex justify-between">
                      <span className={node.isEliminated ? 'line-through' : ''}>
                        {name}
                      </span>
                      <span className="font-mono text-text-muted">
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
            <div className="w-3 h-3 rounded-sm bg-neon-green/20 border border-neon-green/40" />
            <span>Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-neon-red/20 border border-neon-red/40" />
            <span>Eliminated</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-bg-card/30 border border-bg-border/30" />
            <span>Future</span>
          </div>
        </div>
      </div>
    </div>
  );
}
