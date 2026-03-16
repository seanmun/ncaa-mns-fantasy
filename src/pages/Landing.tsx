import { motion } from 'framer-motion';
import { Users, UserPlus, Trophy, ChevronLeft, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { getPlatformUrl } from '@/lib/utils';

const tiers = [
  { tier: 1, seeds: '1–4', picks: 4, color: 'var(--tier-1)', label: 'Tier 1' },
  { tier: 2, seeds: '5–8', picks: 3, color: 'var(--tier-2)', label: 'Tier 2' },
  { tier: 3, seeds: '9–12', picks: 2, color: 'var(--tier-3)', label: 'Tier 3' },
  { tier: 4, seeds: '13–16', picks: 1, color: 'var(--tier-4)', label: 'Tier 4' },
];

const steps = [
  {
    number: 1,
    title: 'Join a League',
    description:
      'Create your own league or join one with an invite code. Play with friends, coworkers, or the world.',
    Icon: Users,
  },
  {
    number: 2,
    title: 'Draft Your 10',
    description:
      'Pick 10 real NCAA tournament players across four seed tiers. Balance star power with Cinderella sleepers.',
    Icon: UserPlus,
  },
  {
    number: 3,
    title: 'Earn Real Stats',
    description:
      'Your players score points, rebounds, and assists in every tournament game. The more they play, the more you earn.',
    Icon: TrendingUp,
  },
  {
    number: 4,
    title: 'Win the Madness',
    description:
      'Track your roster live, climb the leaderboard, and outlast your league as March Madness unfolds.',
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
      staggerChildren: 0.12,
      delayChildren: 0.3,
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
            <span className="font-display text-2xl tracking-wide">
              <span className="text-white">MNS</span><span className="text-neon-green">fantasy</span>
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
            <SignedIn>
              <Link
                to="/dashboard"
                className="rounded-lg bg-neon-green px-4 py-2 text-sm font-semibold text-gray-900 transition-shadow hover:shadow-[0_0_15px_rgba(0,255,135,0.3)]"
              >
                Dashboard
              </Link>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8',
                  },
                }}
              />
            </SignedIn>
            <SignedOut>
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
            </SignedOut>
          </div>
        </div>
      </header>

      {/* ========== HERO ========== */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-24 pb-10 sm:pt-28 sm:pb-14 text-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#080b10] via-[#0a1628] to-[#080b10]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,255,135,0.08)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,229,255,0.05)_0%,transparent_50%)]" />
        {/* Bottom fade into page background */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#080b10] to-transparent" />
        {/* Hero content — above video */}
        <div className="relative z-10 flex flex-col items-center">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mb-3 text-xs font-mono uppercase tracking-widest text-neon-green/70"
          >
            NCAA March Madness
          </motion.p>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            className="font-display text-4xl sm:text-6xl tracking-wide text-text-primary"
          >
            Tournament <span className="text-neon-green animate-glow">Player Pool</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
            className="mt-4 max-w-xl font-body text-base sm:text-lg text-text-secondary leading-relaxed"
          >
            Draft 10 real NCAA tournament players across four seed tiers.
            Earn points from their actual stats — points, rebounds, and assists —
            as March Madness unfolds. The best roster wins.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.35 }}
            className="mt-8 flex flex-col sm:flex-row items-center gap-4"
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
        </div>
      </section>

      {/* ========== TIER BREAKDOWN ========== */}
      <section className="relative mx-auto max-w-3xl px-4 pb-14">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <h2 className="font-display text-2xl sm:text-3xl tracking-wide text-text-primary">
            Pick 10 Players. Four Tiers.
          </h2>
          <p className="mt-2 text-sm text-text-muted max-w-md mx-auto">
            Every roster has the same structure — how you fill it is up to you.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {tiers.map(({ tier, seeds, picks, color, label }) => (
            <motion.div
              key={tier}
              variants={staggerItem}
              className="rounded-xl border border-bg-border bg-bg-card p-4 text-center"
            >
              <div
                className="mx-auto mb-2 h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
              >
                T{tier}
              </div>
              <p className="font-display text-sm text-text-primary">{label}</p>
              <p className="text-xs text-text-muted mt-1">Seeds {seeds}</p>
              <p className="mt-2 text-2xl font-bold" style={{ color }}>
                {picks}
              </p>
              <p className="text-xs text-text-muted">
                {picks === 1 ? 'player' : 'players'}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-6 text-center text-sm text-text-muted"
        >
          Higher seeds are safer — lower seeds are wildcards. Build the best mix and ride it through the bracket.
        </motion.p>
      </section>

      {/* ========== SCORING ========== */}
      <section className="relative mx-auto max-w-3xl px-4 pb-20">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="rounded-xl border border-bg-border bg-bg-card p-6 sm:p-8"
        >
          <h2 className="font-display text-xl sm:text-2xl tracking-wide text-text-primary text-center mb-2">
            Real Stats. Real Scoring.
          </h2>
          <p className="text-sm text-text-muted text-center mb-6">
            Every game your players play in the tournament, their stats count toward your total.
          </p>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-neon-green">PTS</p>
              <p className="text-xs text-text-muted mt-1">Points scored</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-neon-cyan">REB</p>
              <p className="text-xs text-text-muted mt-1">Rebounds</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-neon-purple">AST</p>
              <p className="text-xs text-text-muted mt-1">Assists</p>
            </div>
          </div>

          <p className="mt-4 text-xs text-text-muted text-center">
            Total Score = PTS + REB + AST across every tournament game.
          </p>

          <p className="mt-6 text-xs text-text-muted text-center">
            The longer your players survive in the bracket, the more games they play, the more stats they rack up.
            Bet on teams that go deep.
          </p>
        </motion.div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="relative mx-auto max-w-5xl px-4 pb-24">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="font-display text-2xl sm:text-3xl tracking-wide text-text-primary">
            How It Works
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {steps.map(({ number, title, description, Icon }) => (
            <motion.div
              key={number}
              variants={staggerItem}
              className="relative rounded-xl border border-bg-border bg-bg-card p-6 text-center"
            >
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

        {/* Final CTA */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-14 text-center"
        >
          <Link
            to="/leagues/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-neon-green px-8 py-3 font-semibold text-gray-900 transition-shadow hover:shadow-[0_0_20px_rgba(0,255,135,0.4)]"
          >
            Start Playing
          </Link>
          <p className="mt-4 text-sm italic text-text-muted">
            Underdogs Welcome.
          </p>
        </motion.div>
      </section>
    </div>
  );
}
