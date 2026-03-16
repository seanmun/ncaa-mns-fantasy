import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  ExternalLink,
} from 'lucide-react';

import { useAppStore } from '@/store';
import { useApi } from '@/hooks/useApi';
import PageTransition from '@/components/layout/PageTransition';
import { getPlatformUrl } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GamePrefs {
  prefMorningUpdates: boolean;
  prefEliminationAlerts: boolean;
  prefScoreAlerts: boolean;
  prefRosterReminders: boolean;
  optedOutOfGame: boolean;
}

/* ------------------------------------------------------------------ */
/*  Section wrapper                                                    */
/* ------------------------------------------------------------------ */

function SectionCard({
  title,
  delay,
  children,
}: {
  title: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl border border-bg-border bg-bg-card p-6"
    >
      <h2 className="mb-4 font-display text-xl tracking-wide text-text-primary">
        {title}
      </h2>
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Toggle Switch                                                      */
/* ------------------------------------------------------------------ */

function ToggleSwitch({
  enabled,
  onToggle,
  danger,
}: {
  enabled: boolean;
  onToggle: () => void;
  danger?: boolean;
}) {
  const bgActive = danger
    ? 'bg-neon-red shadow-[0_0_10px_rgba(255,69,58,0.3)]'
    : 'bg-neon-green shadow-[0_0_10px_rgba(0,255,135,0.3)]';

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${
        enabled ? bgActive : 'bg-bg-border'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function Settings() {
  const { fontSize, soundsMuted, setFontSize, toggleSounds } =
    useAppStore();
  const { apiFetch } = useApi();
  const queryClient = useQueryClient();

  // Fetch notification preferences from API
  const { data: gamePrefs } = useQuery<GamePrefs>({
    queryKey: ['game-prefs'],
    queryFn: () => apiFetch('/api/marketing/game-prefs'),
  });

  // Mutation to persist changes
  const prefsMutation = useMutation({
    mutationFn: (prefs: GamePrefs) =>
      apiFetch('/api/marketing/game-prefs', {
        method: 'PUT',
        body: JSON.stringify(prefs),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-prefs'] });
    },
    onError: () => {
      toast.error('Failed to save notification preferences');
    },
  });

  // Derive local display values from server state
  const prefs: GamePrefs = gamePrefs || {
    prefMorningUpdates: true,
    prefEliminationAlerts: true,
    prefScoreAlerts: true,
    prefRosterReminders: true,
    optedOutOfGame: false,
  };

  const savePrefs = useCallback(
    (updated: GamePrefs) => {
      prefsMutation.mutate(updated);
    },
    [prefsMutation],
  );

  const togglePref = (key: keyof Omit<GamePrefs, 'optedOutOfGame'>) => {
    const updated = { ...prefs, [key]: !prefs[key], optedOutOfGame: false };
    savePrefs(updated);
  };

  const toggleUnsubAll = () => {
    if (prefs.optedOutOfGame) {
      // Re-enable defaults
      savePrefs({
        prefMorningUpdates: true,
        prefEliminationAlerts: true,
        prefScoreAlerts: true,
        prefRosterReminders: true,
        optedOutOfGame: false,
      });
    } else {
      // Unsub from all
      savePrefs({
        prefMorningUpdates: false,
        prefEliminationAlerts: false,
        prefScoreAlerts: false,
        prefRosterReminders: false,
        optedOutOfGame: true,
      });
    }
  };

  const platformUrl = getPlatformUrl();

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        {/* ---- Page Header ---- */}
        <h1 className="font-display text-3xl tracking-wide text-text-primary">
          Settings
        </h1>

        {/* ============================================================== */}
        {/*  Section 1: Appearance                                          */}
        {/* ============================================================== */}
        <SectionCard title="Appearance" delay={0.05}>
          <div className="space-y-6">
            {/* Font Size */}
            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">
                Font Size
              </label>
              <div className="inline-flex rounded-full border border-bg-border bg-bg-primary p-1">
                {(
                  [
                    { value: 'sm', label: 'Small' },
                    { value: 'md', label: 'Medium' },
                    { value: 'lg', label: 'Large' },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFontSize(option.value)}
                    className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-150 ${
                      fontSize === option.value
                        ? 'bg-neon-green text-gray-900 shadow-[0_0_15px_rgba(0,255,135,0.3)]'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ============================================================== */}
        {/*  Section 2: Sounds                                              */}
        {/* ============================================================== */}
        <SectionCard title="Sounds" delay={0.1}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {soundsMuted ? (
                <VolumeX className="h-5 w-5 text-text-muted" />
              ) : (
                <Volume2 className="h-5 w-5 text-neon-green" />
              )}
              <span className="text-sm text-text-primary">
                {soundsMuted ? 'Sounds are off' : 'Sounds are on'}
              </span>
            </div>
            <ToggleSwitch
              enabled={!soundsMuted}
              onToggle={toggleSounds}
            />
          </div>
        </SectionCard>

        {/* ============================================================== */}
        {/*  Section 3: Notifications                                       */}
        {/* ============================================================== */}
        <SectionCard title="Notifications" delay={0.15}>
          <p className="mb-4 text-xs text-text-muted">
            NCAA Tournament email preferences
          </p>

          <div className="space-y-4">
            {/* Morning updates */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-text-secondary" />
                <span className="text-sm text-text-primary">
                  Morning updates
                </span>
              </div>
              <ToggleSwitch
                enabled={prefs.prefMorningUpdates}
                onToggle={() => togglePref('prefMorningUpdates')}
              />
            </div>

            {/* Elimination alerts */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-text-secondary" />
                <span className="text-sm text-text-primary">
                  Elimination alerts
                </span>
              </div>
              <ToggleSwitch
                enabled={prefs.prefEliminationAlerts}
                onToggle={() => togglePref('prefEliminationAlerts')}
              />
            </div>

            {/* Score change alerts */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-text-secondary" />
                <span className="text-sm text-text-primary">
                  Score change alerts
                </span>
              </div>
              <ToggleSwitch
                enabled={prefs.prefScoreAlerts}
                onToggle={() => togglePref('prefScoreAlerts')}
              />
            </div>

            {/* Roster lock reminders */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-text-secondary" />
                <span className="text-sm text-text-primary">
                  Roster lock reminders
                </span>
              </div>
              <ToggleSwitch
                enabled={prefs.prefRosterReminders}
                onToggle={() => togglePref('prefRosterReminders')}
              />
            </div>

            {/* Divider */}
            <div className="border-t border-bg-border" />

            {/* Unsubscribe from all */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BellOff className="h-4 w-4 text-neon-red" />
                <span className="text-sm font-medium text-neon-red">
                  Unsubscribe from all NCAA emails
                </span>
              </div>
              <ToggleSwitch
                enabled={prefs.optedOutOfGame}
                onToggle={toggleUnsubAll}
                danger
              />
            </div>
          </div>

          {/* Footnote */}
          <div className="mt-5 rounded-lg border border-bg-border bg-bg-primary p-4">
            <p className="text-xs text-text-muted">
              Turning off individual alerts here only affects NCAA emails. Visit{' '}
              <a
                href={`${platformUrl}/preferences`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neon-cyan hover:underline"
              >
                mnsfantasy.com/preferences
              </a>{' '}
              to manage all platform communications.
            </p>
            <a
              href={`${platformUrl}/preferences`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-neon-cyan hover:underline"
            >
              Manage all MNSfantasy email preferences
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </SectionCard>

        {/* ============================================================== */}
        {/*  Section 4: Account                                             */}
        {/* ============================================================== */}
        <SectionCard title="Account" delay={0.2}>
          <p className="mb-3 text-sm text-text-secondary">
            Manage your account details, password, and connected accounts.
          </p>
          <a
            href="/account"
            className="inline-flex items-center gap-2 rounded-lg border border-bg-border bg-bg-primary px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-bg-card-hover"
          >
            <ExternalLink className="h-4 w-4 text-neon-green" />
            Manage Account
          </a>
        </SectionCard>

        {/* ============================================================== */}
        {/*  Section 5: About                                               */}
        {/* ============================================================== */}
        <SectionCard title="About" delay={0.25}>
          <p className="text-sm text-text-secondary">
            MNSfantasy is powered by{' '}
            <a
              href="https://moneyneversleeps.app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-neon-cyan hover:underline"
            >
              MoneyNeverSleeps.app
            </a>{' '}
            &mdash; the home of fantasy sports and investment fantasy leagues.
          </p>
          <a
            href="https://moneyneversleeps.app"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-neon-cyan hover:underline"
          >
            Visit MoneyNeverSleeps.app
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </SectionCard>
      </div>
    </PageTransition>
  );
}
