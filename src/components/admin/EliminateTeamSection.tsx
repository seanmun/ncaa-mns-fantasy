import { useState } from 'react';
import { Skull, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SectionCard } from './SectionCard';
import { ConfirmModal } from './ConfirmModal';

export interface EliminateTeamSectionProps {
  activeTeams: string[];
  eliminatedTeams: string[];
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
  onRestore: (teamName: string) => void;
  restoreLoading: boolean;
}

export function EliminateTeamSection({
  activeTeams,
  eliminatedTeams,
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
  onRestore,
  restoreLoading,
}: EliminateTeamSectionProps) {
  const [restoreTeam, setRestoreTeam] = useState('');
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  return (
    <SectionCard title="Eliminate / Restore Team" icon={Skull} delay={0.2}>
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

      {/* Restore eliminated team */}
      {eliminatedTeams.length > 0 && (
        <div className="mt-6 pt-4 border-t border-bg-border space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Restore Eliminated Team
          </p>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <select
                value={restoreTeam}
                onChange={(e) => setRestoreTeam(e.target.value)}
                className="w-full rounded-lg border border-bg-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary focus:border-neon-green focus:outline-none focus:ring-1 focus:ring-neon-green transition-colors"
              >
                <option value="">Choose eliminated team...</option>
                {eliminatedTeams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowRestoreModal(true)}
              disabled={!restoreTeam}
            >
              <Undo2 className="h-4 w-4" />
              Restore
            </Button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={showModal}
        title="Eliminate Team"
        message={`Are you sure you want to eliminate ${selectedTeam}? This will affect all rosters.`}
        confirmLabel="Eliminate"
        onConfirm={onConfirm}
        onCancel={onCancel}
        loading={loading}
      />

      <ConfirmModal
        open={showRestoreModal}
        title="Restore Team"
        message={`Are you sure you want to restore ${restoreTeam}? This will mark them as active again.`}
        confirmLabel="Restore"
        onConfirm={() => {
          onRestore(restoreTeam);
          setShowRestoreModal(false);
          setRestoreTeam('');
        }}
        onCancel={() => setShowRestoreModal(false)}
        loading={restoreLoading}
      />
    </SectionCard>
  );
}
