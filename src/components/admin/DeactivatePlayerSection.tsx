import { UserX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SectionCard } from './SectionCard';
import { ConfirmModal } from './ConfirmModal';

export interface DeactivatePlayerSectionProps {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  showModal: boolean;
  onShowModal: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onCancel: () => void;
  loading: boolean;
}

export function DeactivatePlayerSection({
  playerName,
  onPlayerNameChange,
  showModal,
  onShowModal,
  onDeactivate,
  onReactivate,
  onCancel,
  loading,
}: DeactivatePlayerSectionProps) {
  return (
    <SectionCard title="Deactivate Player" icon={UserX} delay={0.22}>
      <div className="space-y-4">
        <p className="text-xs text-text-muted">
          Remove an injured or ineligible player from the pool. They will no
          longer appear in the draft but will stay on existing rosters with an
          injury badge.
        </p>
        <div>
          <label
            htmlFor="player-name-input"
            className="mb-1 block text-xs text-text-muted"
          >
            Player Name
          </label>
          <input
            id="player-name-input"
            type="text"
            placeholder="e.g. Caleb Wilson"
            value={playerName}
            onChange={(e) => onPlayerNameChange(e.target.value)}
            className="w-full rounded-lg border border-bg-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-neon-green focus:outline-none focus:ring-1 focus:ring-neon-green transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="danger"
            size="md"
            onClick={onShowModal}
            disabled={!playerName.trim()}
          >
            <UserX className="h-4 w-4" />
            Deactivate
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={onReactivate}
            disabled={!playerName.trim() || loading}
          >
            Reactivate
          </Button>
        </div>
      </div>

      <ConfirmModal
        open={showModal}
        title="Deactivate Player"
        message={`Are you sure you want to deactivate "${playerName}"? They will be removed from the player pool.`}
        confirmLabel="Deactivate"
        onConfirm={onDeactivate}
        onCancel={onCancel}
        loading={loading}
      />
    </SectionCard>
  );
}
