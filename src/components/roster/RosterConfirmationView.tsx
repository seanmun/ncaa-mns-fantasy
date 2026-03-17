import {
  SEED_TIERS,
  type RosterPickState,
} from '@/types';
import { getProjectedScore, getRosterLockDate } from '@/lib/utils';
import { format } from 'date-fns';
import { TIER_TEXT_COLOR } from './tierStyles';

interface RosterConfirmationViewProps {
  picks: RosterPickState;
  projectedTotal: number;
  isEditMode: boolean;
  isPending: boolean;
  onGoBack: () => void;
  onConfirm: () => void;
}

const tierKey = (tier: number): keyof RosterPickState =>
  `tier${tier}` as keyof RosterPickState;

export default function RosterConfirmationView({
  picks,
  projectedTotal,
  isEditMode,
  isPending,
  onGoBack,
  onConfirm,
}: RosterConfirmationViewProps) {
  return (
    <div className="mx-auto max-w-lg px-4 py-8 pb-32">
      <h1 className="text-center font-display text-2xl tracking-wide text-text-primary">
        {isEditMode ? 'Update Your Roster' : 'Confirm Your Roster'}
      </h1>

      {/* Picks organized by tier */}
      <div className="mt-8 space-y-6">
        {SEED_TIERS.map((tierConfig) => {
          const tierPicks = picks[tierKey(tierConfig.tier)];
          if (tierPicks.length === 0) return null;
          return (
            <div key={tierConfig.tier}>
              <h3
                className={`mb-2 text-xs font-semibold uppercase tracking-wider ${TIER_TEXT_COLOR[tierConfig.tier]}`}
              >
                {tierConfig.label} &mdash; Seeds{' '}
                {tierConfig.seeds[0]}&ndash;
                {tierConfig.seeds[tierConfig.seeds.length - 1]}
              </h3>
              <ul className="space-y-1.5">
                {tierPicks.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-lg bg-bg-card px-4 py-3 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-text-primary font-medium">
                        {p.name}
                      </span>
                      <span className="text-xs text-text-muted">
                        {p.team.shortName}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-text-secondary">
                      {getProjectedScore(
                        p.avgPts,
                        p.avgReb,
                        p.avgAst,
                      ).toFixed(1)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Projected total */}
      <div className="mt-8 text-center">
        <p className="text-xs uppercase tracking-wider text-text-muted">
          Projected Total Score
        </p>
        <p className="mt-1 font-mono text-4xl font-bold text-neon-green">
          {projectedTotal.toFixed(1)}
        </p>
      </div>

      {/* Lock info */}
      <p className="mt-4 text-center text-xs text-text-secondary">
        You can edit your roster anytime before{' '}
        <span className="font-semibold text-neon-orange">
          {format(getRosterLockDate(), 'MMM d, yyyy h:mm a')}
        </span>
        .
      </p>

      {/* Buttons */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onGoBack}
          className="rounded-xl border border-bg-border bg-bg-card px-6 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-card-hover"
        >
          Go Back
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={onConfirm}
          className="rounded-xl bg-neon-green px-6 py-3 text-sm font-semibold text-gray-900 transition-shadow hover:shadow-[0_0_20px_rgba(0,255,135,0.4)] disabled:opacity-50"
        >
          {isPending
            ? isEditMode
              ? 'Updating...'
              : 'Confirming...'
            : isEditMode
              ? 'Update Roster'
              : 'Confirm Roster'}
        </button>
      </div>
    </div>
  );
}
