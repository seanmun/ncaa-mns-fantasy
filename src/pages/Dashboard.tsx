import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Link as LinkIcon, Trophy } from 'lucide-react';

import PageTransition from '@/components/layout/PageTransition';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { Button } from '@/components/ui/Button';
import { LeagueCard } from '@/components/league/LeagueCard';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { useApi } from '@/hooks/useApi';
import type { LeagueWithDetails } from '@/types';

export default function Dashboard() {
  const { apiFetch } = useApi();
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');

  // ---------- Fetch user's leagues ----------
  const {
    data: leagues,
    isLoading,
    isError,
  } = useQuery<LeagueWithDetails[]>({
    queryKey: ['leagues'],
    queryFn: () => apiFetch('/api/leagues'),
  });

  // ---------- Join league handler ----------
  const handleJoin = () => {
    const trimmed = inviteCode.trim();
    if (!trimmed) return;

    // Accept either a raw code or a full URL containing the code
    const code = trimmed.includes('/')
      ? trimmed.split('/').filter(Boolean).pop() ?? trimmed
      : trimmed;

    navigate(`/join/${code}`);
  };

  // ---------- Render ----------
  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-6">
        {/* ---- Header row ---- */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-3xl tracking-wide text-text-primary">
            My Leagues
          </h1>
          <CountdownTimer />
        </div>

        {/* ---- Create & Join actions ---- */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <Link to="/leagues/create">
            <Button variant="primary" size="lg" className="w-full sm:w-auto">
              <Plus className="h-5 w-5" />
              Create League
            </Button>
          </Link>

          <div className="flex flex-1 items-end gap-2">
            <div className="flex-1">
              <label
                htmlFor="invite-code"
                className="mb-1 block text-xs text-text-muted"
              >
                Paste an invite code or link
              </label>
              <input
                id="invite-code"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                placeholder="e.g. ABC123 or https://..."
                className="w-full rounded-lg border border-bg-border bg-bg-card px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-neon-green focus:outline-none focus:ring-1 focus:ring-neon-green"
              />
            </div>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleJoin}
              disabled={!inviteCode.trim()}
            >
              <LinkIcon className="h-4 w-4" />
              Join
            </Button>
          </div>
        </div>

        {/* ---- League list ---- */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} lines={2} />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-neon-red/30 bg-neon-red/5 px-6 py-4 text-sm text-neon-red">
            Something went wrong loading your leagues. Please try again.
          </div>
        )}

        {!isLoading && !isError && leagues && leagues.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.07 } },
            }}
            className="space-y-4"
          >
            {leagues.map((league) => (
              <motion.div
                key={league.id}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <Link to={`/leagues/${league.id}`}>
                  <LeagueCard league={league} />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ---- Empty state ---- */}
        {!isLoading && !isError && leagues && leagues.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col items-center rounded-xl border border-bg-border bg-bg-card px-6 py-16 text-center"
          >
            <Trophy className="mb-4 h-12 w-12 text-text-muted" />
            <p className="max-w-md font-body text-text-secondary">
              You haven&apos;t joined any leagues yet. Create one or join with an
              invite code!
            </p>
            <Link to="/leagues/create" className="mt-6">
              <Button variant="primary" size="lg">
                <Plus className="h-5 w-5" />
                Create Your First League
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
