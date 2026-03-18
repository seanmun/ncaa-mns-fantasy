import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '@/hooks/useApi';
import { getGameSlug, getPlatformUrl } from '@/lib/utils';

export default function OnboardingModal() {
  const { user } = useUser();
  const { apiFetch } = useApi();
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Global prefs — all prechecked
  const [globalOptIn, setGlobalOptIn] = useState(true);
  const [prefNewGames, setPrefNewGames] = useState(true);
  const [prefLeagueInvites, setPrefLeagueInvites] = useState(true);
  const [prefPlatformNews, setPrefPlatformNews] = useState(true);
  const [prefMnsInsights, setPrefMnsInsights] = useState(true);

  // Game-specific prefs — all prechecked
  const [prefMorningUpdates, setPrefMorningUpdates] = useState(true);
  const [prefEliminationAlerts, setPrefEliminationAlerts] = useState(true);
  const [prefScoreAlerts, setPrefScoreAlerts] = useState(true);
  const [prefRosterReminders, setPrefRosterReminders] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Check localStorage first for instant check
    const onboardingComplete = localStorage.getItem('mns_onboarding_complete');
    if (onboardingComplete) return;

    // Check DB for existing marketing subscriber record
    apiFetch('/api/marketing/check')
      .then((data: { exists: boolean }) => {
        if (!data.exists) {
          setShow(true);
        } else {
          localStorage.setItem('mns_onboarding_complete', 'true');
        }
      })
      .catch(() => {
        // If check fails, don't show modal — fail safe
      });
  }, [user, apiFetch]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Save global platform prefs
      await apiFetch('/api/marketing/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          globalOptIn,
          mnsInsights: prefMnsInsights,
          prefNewGames,
          prefLeagueInvites,
          prefPlatformNews,
          source: getGameSlug(),
        }),
      });

      // Save game-specific prefs
      await apiFetch('/api/marketing/game-prefs', {
        method: 'PUT',
        body: JSON.stringify({
          prefMorningUpdates,
          prefEliminationAlerts,
          prefScoreAlerts,
          prefRosterReminders,
        }),
      });

      localStorage.setItem('mns_onboarding_complete', 'true');
      setShow(false);
    } catch {
      // Set localStorage anyway so modal doesn't re-fire
      localStorage.setItem('mns_onboarding_complete', 'true');
      setShow(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md rounded-xl bg-bg-card border border-bg-border p-8 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="font-display text-3xl text-text-primary mb-2">
              Before you play...
            </h2>
            <p className="text-text-secondary mb-6">
              MNSfantasy is free. We keep you in the game with email updates.
            </p>

            {/* Master opt-in */}
            <label className="flex items-start gap-3 cursor-pointer mb-6">
              <input
                type="checkbox"
                checked={globalOptIn}
                onChange={(e) => setGlobalOptIn(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-bg-border bg-bg-secondary accent-neon-green"
              />
              <span className="text-sm font-semibold text-text-primary">
                Yes, send me email updates from MNSfantasy
              </span>
            </label>

            {/* Game Updates */}
            <p className="text-xs font-semibold text-neon-green uppercase tracking-widest mb-3">
              Game Updates
            </p>
            <div className="space-y-3 mb-6">
              <Checkbox checked={prefMorningUpdates} onChange={setPrefMorningUpdates} label="Morning recap emails" />
              <Checkbox checked={prefScoreAlerts} onChange={setPrefScoreAlerts} label="Live score alerts" />
              <Checkbox checked={prefEliminationAlerts} onChange={setPrefEliminationAlerts} label="Team elimination alerts" />
              <Checkbox checked={prefRosterReminders} onChange={setPrefRosterReminders} label="Roster lock reminders" />
            </div>

            {/* Platform */}
            <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
              Platform
            </p>
            <div className="space-y-3 mb-8">
              <Checkbox checked={prefNewGames} onChange={setPrefNewGames} label="New game announcements" />
              <Checkbox checked={prefLeagueInvites} onChange={setPrefLeagueInvites} label="League invite notifications" />
              <Checkbox checked={prefPlatformNews} onChange={setPrefPlatformNews} label="Platform news & updates" />
              <Checkbox checked={prefMnsInsights} onChange={setPrefMnsInsights} label="Fantasy insights from MoneyNeverSleeps.app" />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 px-6 rounded-lg bg-neon-green text-bg-primary font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {submitting ? 'Setting up...' : "Confirm & Play"}
            </button>

            <p className="text-xs text-text-muted mt-4 text-center">
              You can update these preferences anytime at{' '}
              <a
                href={`${getPlatformUrl()}/preferences`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-text-secondary"
              >
                mnsfantasy.com/preferences
              </a>
              . We never sell your data.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-bg-border bg-bg-secondary accent-neon-green"
      />
      <span className="text-sm text-text-secondary">{label}</span>
    </label>
  );
}
