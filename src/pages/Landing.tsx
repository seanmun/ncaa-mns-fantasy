import { motion } from 'framer-motion';
import { Users, UserPlus, Trophy, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPlatformUrl } from '@/lib/utils';

const steps = [
  {
    number: 1,
    title: 'Join a League',
    description:
      'Create your own league or join one with an invite code. Compete against friends, family, or the world.',
    Icon: Users,
  },
  {
    number: 2,
    title: 'Pick Your 10',
    description:
      'Draft 10 players across four seed tiers. Balance star power with sleeper picks to maximize your score.',
    Icon: UserPlus,
  },
  {
    number: 3,
    title: 'Watch the Madness',
    description:
      'Earn points from real tournament stats. Track your roster live and climb the leaderboard as March heats up.',
    Icon: Trophy,
  },
] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.4,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-bg-primary overflow-hidden">
      {/* ---------- Top nav bar ---------- */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-bg-secondary/80 backdrop-blur-sm border-b border-bg-border">
        <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl text-neon-green tracking-wide">
              MNSfantasy
            </span>
            <a
              href={getPlatformUrl()}
              className="flex items-center gap-1 text-text-muted text-xs hover:text-text-secondary transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
              All Games
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/sign-up"
              className="rounded-lg bg-neon-green px-4 py-2 text-sm font-semibold text-gray-900 transition-shadow hover:shadow-[0_0_15px_rgba(0,255,135,0.3)]"
            >
              Sign Up
            </Link>
            <Link
              to="/sign-in"
              className="rounded-lg border border-bg-border bg-bg-card px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-bg-card-hover"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* ---------- Gradient overlay ---------- */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-neon-green/[0.03] via-transparent to-bg-primary"
      />

      {/* ========== HERO ========== */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-28 pb-20 sm:pt-36 sm:pb-28 text-center">
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="font-display text-4xl sm:text-6xl tracking-wide text-neon-green animate-glow select-none"
        >
          MNSfantasy
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
          className="mt-4 max-w-lg font-body text-lg sm:text-xl text-text-secondary"
        >
          Pick Smart. Win Big. March Never Sleeps.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link
            to="/leagues/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-neon-green px-6 py-3 font-semibold text-gray-900 transition-shadow hover:shadow-[0_0_20px_rgba(0,255,135,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
          >
            Create a League
          </Link>

          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-bg-border bg-bg-card px-6 py-3 font-semibold text-text-primary transition-colors hover:bg-bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bg-border focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
          >
            Join a League
          </Link>
        </motion.div>

        {/* Subtle tagline */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.45 }}
          className="mt-8 font-body text-sm italic text-text-muted select-none"
        >
          Underdogs Welcome.
        </motion.p>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="relative mx-auto max-w-5xl px-4 pb-24">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-6 sm:grid-cols-3"
        >
          {steps.map(({ number, title, description, Icon }) => (
            <motion.div
              key={number}
              variants={staggerItem}
              className="relative rounded-xl border border-bg-border bg-bg-card p-6 text-center"
            >
              {/* Numbered badge */}
              <span className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-neon-green/10 font-display text-lg text-neon-green">
                {number}
              </span>

              <Icon className="mx-auto mb-3 h-8 w-8 text-neon-green" />

              <h3 className="font-display text-xl tracking-wide text-text-primary">
                {title}
              </h3>

              <p className="mt-2 font-body text-sm leading-relaxed text-text-secondary">
                {description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-bg-border bg-bg-secondary py-6 text-center">
        <p className="font-body text-sm text-text-muted">
          MNSfantasy is powered by{' '}
          <a
            href="https://moneyneversleeps.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary underline underline-offset-2 transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-neon-cyan focus-visible:outline-offset-2"
          >
            MoneyNeverSleeps.app
          </a>
        </p>
      </footer>
    </div>
  );
}
