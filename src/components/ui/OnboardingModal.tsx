import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '@/hooks/useApi';
import { getGameSlug, getPlatformUrl } from '@/lib/utils';

export default function OnboardingModal() {
  const { user } = useUser();
  const { apiFetch } = useApi();
  const [show, setShow] = useState(false);
  const [globalOptIn, setGlobalOptIn] = useState(true);
  const [mnsInsights, setMnsInsights] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      await apiFetch('/api/marketing/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          globalOptIn,
          mnsInsights,
          source: getGameSlug(),
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
            className="w-full max-w-md rounded-xl bg-bg-card border border-bg-border p-8"
          >
            <h2 className="font-display text-3xl text-text-primary mb-2">
              Before you play...
            </h2>
            <p className="text-text-secondary mb-6">
              MNSfantasy is free. We keep you in the game with email updates.
            </p>

            <div className="space-y-4 mb-8">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={globalOptIn}
                  onChange={(e) => setGlobalOptIn(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-bg-border bg-bg-secondary accent-neon-green"
                />
                <span className="text-sm text-text-primary">
                  Yes, keep me posted on new MNSfantasy games, league activity,
                  and platform updates.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mnsInsights}
                  onChange={(e) => setMnsInsights(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-bg-border bg-bg-secondary accent-neon-green"
                />
                <span className="text-sm text-text-secondary">
                  Also send me fantasy insights from MoneyNeverSleeps.app
                </span>
              </label>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 px-6 rounded-lg bg-neon-green text-bg-primary font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {submitting ? 'Setting up...' : "Let's Play"}
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
