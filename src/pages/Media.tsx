import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

/* ------------------------------------------------------------------ */
/*  Helper – capture a DOM node as PNG via html2canvas (lazy-loaded)   */
/* ------------------------------------------------------------------ */
async function downloadAd(node: HTMLElement, filename: string) {
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(node, {
    backgroundColor: null,
    scale: 3, // retina-quality
    useCORS: true,
  });
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/* ------------------------------------------------------------------ */
/*  Ad wrapper – phone-screen ratio card with download button          */
/* ------------------------------------------------------------------ */
function AdCard({
  id,
  filename,
  children,
}: {
  id: string;
  filename: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={ref}
        id={id}
        className="relative w-[390px] min-h-[680px] overflow-hidden rounded-3xl"
        style={{ fontSmooth: 'always', WebkitFontSmoothing: 'antialiased' }}
      >
        {children}
      </div>
      <button
        onClick={() => ref.current && downloadAd(ref.current, filename)}
        className="flex items-center gap-2 rounded-lg border border-bg-border bg-bg-card px-4 py-2 text-sm font-body text-text-secondary transition-colors hover:bg-bg-card-hover hover:text-text-primary"
      >
        <Download className="w-4 h-4" />
        Save as PNG
      </button>
    </div>
  );
}

/* ================================================================== */
/*  AD 1 — NORMIE SPORTS FANS                                         */
/*  Hook: March Madness excitement, simplicity, bragging rights        */
/* ================================================================== */
function AdNormie() {
  return (
    <AdCard id="ad-normie" filename="mns-ad-sports-fan">
      <div className="flex flex-col h-full min-h-[680px] bg-gradient-to-b from-[#080b10] via-[#0d1117] to-[#080b10] p-8 text-center">
        {/* Top badge */}
        <div className="mx-auto mb-6 rounded-full border border-[#1f2937] bg-[#111827] px-4 py-1.5">
          <span className="font-body text-xs tracking-widest uppercase text-[#8b949e]">
            March Madness 2026
          </span>
        </div>

        {/* Bracket visual */}
        <div className="relative mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#00ff87]/10 blur-3xl" />
          <div className="relative grid grid-cols-4 gap-1 opacity-30">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="h-6 w-6 rounded-sm bg-[#00ff87]"
                style={{ opacity: 0.3 + Math.random() * 0.7 }}
              />
            ))}
          </div>
        </div>

        {/* Headline */}
        <h2
          className="font-display text-5xl tracking-wide leading-none"
          style={{ color: '#f0f4f8' }}
        >
          THINK YOU
          <br />
          <span className="text-[#00ff87]" style={{ textShadow: '0 0 30px #00ff87' }}>
            KNOW
          </span>
          <br />
          MARCH MADNESS?
        </h2>

        {/* Sub */}
        <p className="mt-5 font-body text-base leading-relaxed text-[#8b949e] max-w-[300px] mx-auto">
          Pick 10 players. Earn points from real tournament stats.
          Outlast your friends.
        </p>

        {/* How it works mini */}
        <div className="mt-6 flex flex-col gap-2 text-left mx-auto max-w-[280px]">
          {[
            '1. Join or create a league',
            '2. Draft 10 players across 4 seed tiers',
            '3. Watch your score climb with every real game',
          ].map((step) => (
            <div key={step} className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[#00ff87] shrink-0" />
              <span className="font-body text-sm text-[#f0f4f8]">{step}</span>
            </div>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* CTA */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <div
            className="rounded-xl px-8 py-3.5 font-display text-xl tracking-wider text-[#080b10]"
            style={{
              background: '#00ff87',
              boxShadow: '0 0 30px rgba(0,255,135,0.4)',
            }}
          >
            PLAY FREE
          </div>
          <span className="font-body text-xs text-[#4b5563]">
            No purchase necessary
          </span>
        </div>

        {/* Brand */}
        <div className="mt-6">
          <span className="font-display text-lg tracking-wide">
            <span className="text-white">MNS</span>
            <span className="text-[#00ff87]">fantasy</span>
          </span>
          <p className="font-body text-[10px] text-[#4b5563] mt-1">
            ncaa.mnsfantasy.com
          </p>
        </div>
      </div>
    </AdCard>
  );
}

/* ================================================================== */
/*  AD 2 — ADVANCED FANTASY FANS                                       */
/*  Hook: Tier system strategy, new format, depth                      */
/* ================================================================== */
function AdAdvanced() {
  return (
    <AdCard id="ad-advanced" filename="mns-ad-fantasy-pro">
      <div className="flex flex-col h-full min-h-[680px] bg-gradient-to-b from-[#080b10] via-[#0d1117] to-[#080b10] p-8">
        {/* Top badge */}
        <div className="mx-auto mb-5 rounded-full border border-[#1f2937] bg-[#111827] px-4 py-1.5">
          <span className="font-body text-xs tracking-widest uppercase text-[#8b949e]">
            Not Your Average Bracket
          </span>
        </div>

        {/* Headline */}
        <h2 className="font-display text-4xl tracking-wide leading-none text-center text-[#f0f4f8]">
          FANTASY MEETS
          <br />
          <span className="text-[#00e5ff]" style={{ textShadow: '0 0 25px #00e5ff' }}>
            MARCH MADNESS
          </span>
        </h2>

        <p className="mt-4 text-center font-body text-sm text-[#8b949e] max-w-[300px] mx-auto">
          Forget coin-flip brackets. Draft real players. Accumulate real stats. Strategy matters.
        </p>

        {/* Tier breakdown */}
        <div className="mt-6 flex flex-col gap-2.5">
          {[
            { tier: 1, seeds: '1–4', picks: 4, color: '#00ff87', label: 'Elite' },
            { tier: 2, seeds: '5–8', picks: 3, color: '#00e5ff', label: 'Contenders' },
            { tier: 3, seeds: '9–12', picks: 2, color: '#bf5af2', label: 'Sleepers' },
            { tier: 4, seeds: '13–16', picks: 1, color: '#ff9f0a', label: 'Underdogs' },
          ].map(({ tier, seeds, picks, color, label }) => (
            <div
              key={tier}
              className="flex items-center gap-3 rounded-xl border px-4 py-3"
              style={{ borderColor: color + '30', background: color + '08' }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg font-display text-lg text-[#080b10]"
                style={{ background: color }}
              >
                {tier}
              </div>
              <div className="flex-1">
                <div className="font-body text-sm font-semibold" style={{ color }}>
                  {label}
                </div>
                <div className="font-body text-xs text-[#8b949e]">
                  Seeds {seeds}
                </div>
              </div>
              <div className="font-mono text-sm text-[#f0f4f8]">
                {picks} pick{picks > 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>

        {/* Scoring */}
        <div className="mt-5 rounded-xl border border-[#1f2937] bg-[#111827] p-4 text-center">
          <p className="font-body text-xs uppercase tracking-widest text-[#4b5563] mb-2">
            Scoring
          </p>
          <div className="flex justify-center gap-6">
            {['PTS', 'REB', 'AST'].map((stat) => (
              <div key={stat} className="flex flex-col items-center">
                <span className="font-mono text-xl font-bold text-[#00ff87]">+1</span>
                <span className="font-body text-xs text-[#8b949e]">per {stat}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 font-body text-[11px] text-[#4b5563]">
            Eliminated teams = frozen stats. Choose wisely.
          </p>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* CTA */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <div
            className="rounded-xl px-8 py-3 font-display text-xl tracking-wider text-[#080b10]"
            style={{
              background: '#00e5ff',
              boxShadow: '0 0 30px rgba(0,229,255,0.3)',
            }}
          >
            DRAFT YOUR 10
          </div>
          <span className="font-body text-xs text-[#4b5563]">
            10 players. 68 teams. Infinite strategy.
          </span>
        </div>

        {/* Brand */}
        <div className="mt-5 text-center">
          <span className="font-display text-lg tracking-wide">
            <span className="text-white">MNS</span>
            <span className="text-[#00ff87]">fantasy</span>
          </span>
          <p className="font-body text-[10px] text-[#4b5563] mt-1">
            ncaa.mnsfantasy.com
          </p>
        </div>
      </div>
    </AdCard>
  );
}

/* ================================================================== */
/*  AD 3 — VIBECODERS                                                  */
/*  Hook: Built with AI, modern stack, hacker aesthetic                */
/* ================================================================== */
function AdVibecoders() {
  return (
    <AdCard id="ad-vibecoders" filename="mns-ad-vibecoders">
      <div className="flex flex-col h-full min-h-[680px] bg-[#080b10] p-8 font-mono">
        {/* Terminal header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-3 w-3 rounded-full bg-[#ff453a]" />
          <div className="h-3 w-3 rounded-full bg-[#ff9f0a]" />
          <div className="h-3 w-3 rounded-full bg-[#00ff87]" />
          <span className="ml-2 text-xs text-[#4b5563]">
            mnsfantasy — zsh
          </span>
        </div>

        {/* Code block */}
        <div className="rounded-xl border border-[#1f2937] bg-[#0d1117] p-5 text-sm leading-relaxed">
          <p>
            <span className="text-[#bf5af2]">const</span>{' '}
            <span className="text-[#00e5ff]">stack</span>{' '}
            <span className="text-[#8b949e]">=</span>{' '}
            <span className="text-[#ff9f0a]">{`{`}</span>
          </p>
          <p className="pl-4">
            <span className="text-[#f0f4f8]">frontend:</span>{' '}
            <span className="text-[#00ff87]">"React + Vite"</span>,
          </p>
          <p className="pl-4">
            <span className="text-[#f0f4f8]">backend:</span>{' '}
            <span className="text-[#00ff87]">"Vercel Serverless"</span>,
          </p>
          <p className="pl-4">
            <span className="text-[#f0f4f8]">db:</span>{' '}
            <span className="text-[#00ff87]">"Neon Postgres"</span>,
          </p>
          <p className="pl-4">
            <span className="text-[#f0f4f8]">orm:</span>{' '}
            <span className="text-[#00ff87]">"Drizzle"</span>,
          </p>
          <p className="pl-4">
            <span className="text-[#f0f4f8]">auth:</span>{' '}
            <span className="text-[#00ff87]">"Clerk"</span>,
          </p>
          <p className="pl-4">
            <span className="text-[#f0f4f8]">vibes:</span>{' '}
            <span className="text-[#00ff87]">"immaculate"</span>,
          </p>
          <p>
            <span className="text-[#ff9f0a]">{`}`}</span>
            <span className="text-[#8b949e]">;</span>
          </p>
        </div>

        {/* Message */}
        <div className="mt-6 text-center">
          <h2 className="font-display text-3xl tracking-wide text-[#f0f4f8]">
            BUILT BY A
            <br />
            <span className="text-[#bf5af2]" style={{ textShadow: '0 0 25px #bf5af2' }}>
              VIBECODER
            </span>
          </h2>
          <p className="mt-3 font-body text-sm text-[#8b949e] max-w-[280px] mx-auto">
            This entire fantasy platform was vibecoded with Claude.
            Ship fast. Have fun. March Madness is the vibe check.
          </p>
        </div>

        {/* Terminal prompt */}
        <div className="mt-6 rounded-xl border border-[#1f2937] bg-[#0d1117] p-4 text-sm">
          <p>
            <span className="text-[#00ff87]">$</span>{' '}
            <span className="text-[#f0f4f8]">npx create-league</span>
          </p>
          <p className="mt-1 text-[#8b949e]">
            &gt; Deploying your league...
          </p>
          <p className="text-[#00ff87]">
            &gt; League created. Invite your friends.
          </p>
          <p className="mt-1 text-[#8b949e]">
            &gt; Draft your 10 players.
          </p>
          <p className="text-[#00ff87]">
            &gt; Ship it.{' '}
            <span className="animate-pulse">_</span>
          </p>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* CTA */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <div
            className="rounded-xl px-8 py-3 font-display text-xl tracking-wider text-[#080b10]"
            style={{
              background: '#bf5af2',
              boxShadow: '0 0 30px rgba(191,90,242,0.4)',
            }}
          >
            JOIN THE VIBE
          </div>
          <span className="font-body text-xs text-[#4b5563]">
            Vibecoders play fantasy too
          </span>
        </div>

        {/* Brand */}
        <div className="mt-5 text-center">
          <span className="font-display text-lg tracking-wide">
            <span className="text-white">MNS</span>
            <span className="text-[#00ff87]">fantasy</span>
          </span>
          <p className="font-body text-[10px] text-[#4b5563] mt-1">
            ncaa.mnsfantasy.com
          </p>
        </div>
      </div>
    </AdCard>
  );
}

/* ================================================================== */
/*  AD 4 — CRYPTO FOLKS                                                */
/*  Hook: ETH/BTC buy-ins, on-chain vibes, degen energy                */
/* ================================================================== */
function AdCrypto() {
  return (
    <AdCard id="ad-crypto" filename="mns-ad-crypto">
      <div className="flex flex-col h-full min-h-[680px] bg-gradient-to-b from-[#080b10] via-[#0d1117] to-[#080b10] p-8 text-center">
        {/* Top badge */}
        <div className="mx-auto mb-5 rounded-full border border-[#ff9f0a30] bg-[#ff9f0a08] px-4 py-1.5">
          <span className="font-mono text-xs tracking-widest uppercase text-[#ff9f0a]">
            Degen Season
          </span>
        </div>

        {/* Crypto symbols */}
        <div className="relative mx-auto mb-4">
          <div className="absolute inset-0 bg-[#ff9f0a]/10 blur-3xl rounded-full" />
          <div className="relative flex items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ff9f0a30] bg-[#ff9f0a10]">
              <span className="font-display text-3xl text-[#ff9f0a]">$</span>
            </div>
            <div className="text-[#4b5563] font-display text-2xl">+</div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#00ff8730] bg-[#00ff8710]">
              <span className="font-display text-2xl text-[#00ff87]">ETH</span>
            </div>
            <div className="text-[#4b5563] font-display text-2xl">+</div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ff9f0a30] bg-[#ff9f0a10]">
              <span className="font-display text-2xl text-[#ff9f0a]">BTC</span>
            </div>
          </div>
        </div>

        {/* Headline */}
        <h2 className="font-display text-4xl tracking-wide leading-none text-[#f0f4f8]">
          MARCH MADNESS
          <br />
          <span className="text-[#ff9f0a]" style={{ textShadow: '0 0 30px #ff9f0a' }}>
            BUY-INS
          </span>
          <br />
          IN CRYPTO
        </h2>

        <p className="mt-4 font-body text-sm text-[#8b949e] max-w-[280px] mx-auto">
          Create leagues with ETH or BTC buy-ins.
          Peer-to-peer. No middleman. Winner takes the pot.
        </p>

        {/* Feature cards */}
        <div className="mt-6 flex flex-col gap-2.5">
          {[
            {
              icon: 'ETH / BTC',
              title: 'Crypto Buy-ins',
              desc: 'Set league entry in ETH, BTC, or USD',
              color: '#ff9f0a',
            },
            {
              icon: 'P2P',
              title: 'Peer-to-Peer',
              desc: 'Direct wallet payments, no platform cut',
              color: '#00ff87',
            },
            {
              icon: '10',
              title: '10-Player Roster',
              desc: 'Draft across 4 seed tiers, track real stats',
              color: '#00e5ff',
            },
          ].map(({ icon, title, desc, color }) => (
            <div
              key={title}
              className="flex items-center gap-3 rounded-xl border px-4 py-3 text-left"
              style={{ borderColor: color + '25', background: color + '06' }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold text-[#080b10]"
                style={{ background: color }}
              >
                {icon}
              </div>
              <div>
                <div className="font-body text-sm font-semibold text-[#f0f4f8]">
                  {title}
                </div>
                <div className="font-body text-xs text-[#8b949e]">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* CTA */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <div
            className="rounded-xl px-8 py-3 font-display text-xl tracking-wider text-[#080b10]"
            style={{
              background: '#ff9f0a',
              boxShadow: '0 0 30px rgba(255,159,10,0.4)',
            }}
          >
            CREATE A LEAGUE
          </div>
          <span className="font-body text-xs text-[#4b5563]">
            Degen responsibly
          </span>
        </div>

        {/* Brand */}
        <div className="mt-5">
          <span className="font-display text-lg tracking-wide">
            <span className="text-white">MNS</span>
            <span className="text-[#00ff87]">fantasy</span>
          </span>
          <p className="font-body text-[10px] text-[#4b5563] mt-1">
            ncaa.mnsfantasy.com
          </p>
        </div>
      </div>
    </AdCard>
  );
}

/* ================================================================== */
/*  MEDIA PAGE                                                         */
/* ================================================================== */
export default function Media() {
  const sections = [
    {
      id: 'normie',
      label: 'Sports Fans',
      description: 'For the casual fan who loves March Madness and wants to play with friends.',
      component: <AdNormie />,
    },
    {
      id: 'advanced',
      label: 'Fantasy Pros',
      description: 'For experienced fantasy players looking for a fresh format with real strategy depth.',
      component: <AdAdvanced />,
    },
    {
      id: 'vibecoders',
      label: 'Vibecoders',
      description: 'For the developer/builder community. This whole thing was vibecoded with AI.',
      component: <AdVibecoders />,
    },
    {
      id: 'crypto',
      label: 'Crypto / Web3',
      description: 'For the degen crowd. Crypto buy-ins, peer-to-peer, no middleman.',
      component: <AdCrypto />,
    },
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-bg-secondary/80 backdrop-blur-sm border-b border-bg-border">
        <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl tracking-wide">
              <span className="text-white">MNS</span>
              <span className="text-neon-green">fantasy</span>
            </span>
            <Link
              to="/"
              className="flex items-center gap-1 text-text-muted text-xs hover:text-text-secondary transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* Page content */}
      <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-text-primary">
            Media <span className="text-neon-green">&</span> Ad Creatives
          </h1>
          <p className="mt-3 font-body text-text-secondary max-w-lg mx-auto">
            Mobile-sized ad creatives for promoting MNSfantasy.
            Screenshot or save as PNG for X, TikTok, Instagram Stories, etc.
          </p>
        </motion.div>

        {/* Ad sections */}
        <div className="flex flex-col gap-20">
          {sections.map(({ id, label, description, component }, i) => (
            <motion.section
              key={id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-center"
            >
              {/* Section header */}
              <div className="text-center mb-6">
                <span className="font-mono text-xs tracking-widest uppercase text-text-muted">
                  Segment {i + 1}
                </span>
                <h2 className="font-display text-2xl tracking-wide text-text-primary mt-1">
                  {label}
                </h2>
                <p className="font-body text-sm text-text-secondary mt-1 max-w-md">
                  {description}
                </p>
              </div>

              {/* Ad */}
              {component}
            </motion.section>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-bg-border bg-bg-secondary py-6 text-center">
        <p className="font-body text-sm text-text-muted">
          MNSfantasy is powered by{' '}
          <a
            href="https://moneyneversleeps.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary underline underline-offset-2 transition-colors hover:text-text-primary"
          >
            MoneyNeverSleeps.app
          </a>
        </p>
      </footer>
    </div>
  );
}
