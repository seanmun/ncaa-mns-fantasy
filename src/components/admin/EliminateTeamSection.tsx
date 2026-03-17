import { Skull } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SectionCard } from './SectionCard';
import { ConfirmModal } from './ConfirmModal';

export interface EliminateTeamSectionProps {
  activeTeams: string[];
  tournamentRounds: string[];
  selectedTeam: string;
  selectedRound: string;
  onTeamChange: (team: string) => void;
  onRoundChange: (round: string) => void;
  showModal: boolean;
  onShowModal: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export function EliminateTeamSection({
  activeTeams,
  tournamentRounds,
  selectedTeam,
  selectedRound,
  onTeamChange,
  onRoundChange,
  showModal,
  onShowModal,
  onConfirm,
  onCancel,
  loading,
}: EliminateTeamSectionProps) {
  return (
    <SectionCard title="Eliminate Team" icon={Skull} delay={0.2}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Team select */}
          <div>
            <label
              htmlFor="team-select"
              className="mb-1 block text-xs text-text-muted"
            >
              Select Team
            </label>
            <select
              id="team-select"
              value={selectedTeam}
              onChange={(e) => onTeamChange(e.target.value)}
              className="w-full rounded-lg border border-bg-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary focus:border-neon-green focus:outline-none focus:ring-1 focus:ring-neon-green transition-colors"
            >
              <option value="">Choose a team...</option>
              {activeTeams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>

          {/* Round select */}
          <div>
            <label
              htmlFor="round-select"
              className="mb-1 block text-xs text-text-muted"
            >
              Elimination Round
            </label>
            <select
              id="round-select"
              value={selectedRound}
              onChange={(e) => onRoundChange(e.target.value)}
              className="w-full rounded-lg border border-bg-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary focus:border-neon-green focus:outline-none focus:ring-1 focus:ring-neon-green transition-colors"
            >
              {tournamentRounds.map((round) => (
                <option key={round} value={round}>
                  {round}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          variant="danger"
          size="md"
          onClick={onShowModal}
          disabled={!selectedTeam}
        >
          <Skull className="h-4 w-4" />
          Eliminate
        </Button>
      </div>

      <ConfirmModal
        open={showModal}
        title="Eliminate Team"
        message={`Are you sure you want to eliminate ${selectedTeam}? This will affect all rosters.`}
        confirmLabel="Eliminate"
        onConfirm={onConfirm}
        onCancel={onCancel}
        loading={loading}
      />
    </SectionCard>
  );
}
