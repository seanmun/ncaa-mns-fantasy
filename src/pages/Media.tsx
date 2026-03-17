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
/*  AD 5 — COLLEGE STUDENTS / GEN Z                                    */
/*  Hook: FOMO, group chat energy, competitive friend groups            */
/* ================================================================== */
function AdGenZ() {
  return (
    <AdCard id="ad-genz" filename="mns-ad-gen-z">
      <div className="flex flex-col h-full min-h-[680px] bg-gradient-to-b from-[#080b10] via-[#0d1117] to-[#080b10] p-8 text-center">
        {/* Top badge */}
        <div className="mx-auto mb-5 rounded-full border border-[#00e5ff30] bg-[#00e5ff08] px-4 py-1.5">
          <span className="font-body text-xs tracking-widest uppercase text-[#00e5ff]">
            March Madness 2026
          </span>
        </div>

        {/* Notification bubbles */}
        <div className="flex flex-col gap-2 mb-6 max-w-[300px] mx-auto">
          {[
            { name: 'Jake', msg: 'bro I just made a league', align: 'left', delay: '0' },
            { name: 'You', msg: 'bet send the link', align: 'right', delay: '1' },
            { name: 'Marcus', msg: 'my roster is going to be insane', align: 'left', delay: '2' },
            { name: 'You', msg: "you're not ready for my sleeper picks", align: 'right', delay: '3' },
          ].map(({ name, msg, align }) => (
            <div
              key={msg}
              className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'}`}
            >
              <span className="font-mono text-[10px] text-[#4b5563] mb-0.5">{name}</span>
              <div
                className={`rounded-2xl px-3.5 py-2 text-sm font-body max-w-[220px] ${
                  align === 'right'
                    ? 'bg-[#00e5ff] text-[#080b10] rounded-br-md'
                    : 'bg-[#1f2937] text-[#f0f4f8] rounded-bl-md'
                }`}
              >
                {msg}
              </div>
            </div>
          ))}
        </div>

        {/* Headline */}
        <h2 className="font-display text-4xl tracking-wide leading-none text-[#f0f4f8]">
          YOUR GROUP CHAT
          <br />
          <span className="text-[#00e5ff]" style={{ textShadow: '0 0 25px #00e5ff' }}>
            ISN'T READY
          </span>
        </h2>

        <p className="mt-4 font-body text-sm text-[#8b949e] max-w-[280px] mx-auto">
          Flex on your friends with real tournament stats.
          Free to play. No excuses.
        </p>

        {/* Quick stats */}
        <div className="mt-5 flex justify-center gap-4">
          {[
            { num: '10', label: 'Players' },
            { num: '4', label: 'Tiers' },
            { num: '0', label: 'Cost' },
          ].map(({ num, label }) => (
            <div key={label} className="flex flex-col items-center">
              <span className="font-display text-2xl text-[#00e5ff]">{num}</span>
              <span className="font-body text-[10px] text-[#4b5563] uppercase tracking-wider">{label}</span>
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
              background: '#00e5ff',
              boxShadow: '0 0 30px rgba(0,229,255,0.4)',
            }}
          >
            START A LEAGUE
          </div>
          <span className="font-body text-xs text-[#4b5563]">
            Send the link. Talk your trash.
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
/*  AD 6 — SPORTS BETTORS / DFS                                        */
/*  Hook: Stat-based scoring, set your own buy-in with friends          */
/* ================================================================== */
function AdDFS() {
  return (
    <AdCard id="ad-dfs" filename="mns-ad-dfs">
      <div className="flex flex-col h-full min-h-[680px] bg-gradient-to-b from-[#080b10] via-[#0d1117] to-[#080b10] p-8 text-center">
        {/* Top badge */}
        <div className="mx-auto mb-5 rounded-full border border-[#00ff8730] bg-[#00ff8708] px-4 py-1.5">
          <span className="font-body text-xs tracking-widest uppercase text-[#00ff87]">
            Stat-Based Fantasy
          </span>
        </div>

        {/* Stat line mockup */}
        <div className="rounded-xl border border-[#1f2937] bg-[#0d1117] p-4 mb-6">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1f2937]">
            <span className="font-mono text-[10px] text-[#4b5563] uppercase tracking-wider">Player</span>
            <div className="flex gap-4">
              {['PTS', 'REB', 'AST', 'TOT'].map((h) => (
                <span key={h} className="font-mono text-[10px] text-[#4b5563] uppercase tracking-wider w-8 text-right">{h}</span>
              ))}
            </div>
          </div>
          {[
            { name: 'C. Boozer', pts: 24, reb: 9, ast: 3, color: '#00ff87' },
            { name: 'D. Peterson', pts: 21, reb: 4, ast: 7, color: '#00ff87' },
            { name: 'A. Dybantsa', pts: 18, reb: 6, ast: 5, color: '#00e5ff' },
            { name: 'R. Avila', pts: 15, reb: 11, ast: 2, color: '#bf5af2' },
          ].map(({ name, pts, reb, ast, color }) => (
            <div key={name} className="flex items-center justify-between py-1.5">
              <span className="font-body text-sm text-[#f0f4f8]">{name}</span>
              <div className="flex gap-4">
                <span className="font-mono text-sm text-[#8b949e] w-8 text-right">{pts}</span>
                <span className="font-mono text-sm text-[#8b949e] w-8 text-right">{reb}</span>
                <span className="font-mono text-sm text-[#8b949e] w-8 text-right">{ast}</span>
                <span className="font-mono text-sm font-bold w-8 text-right" style={{ color }}>{pts + reb + ast}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Headline */}
        <h2 className="font-display text-4xl tracking-wide leading-none text-[#f0f4f8]">
          BETTER THAN
          <br />
          <span className="text-[#00ff87]" style={{ textShadow: '0 0 25px #00ff87' }}>
            A BRACKET
          </span>
        </h2>

        <p className="mt-4 font-body text-sm text-[#8b949e] max-w-[280px] mx-auto">
          Real stat-based scoring. Set your own buy-in with friends.
          Winner takes the pot. Pure skill.
        </p>

        {/* How it works */}
        <div className="mt-5 flex flex-col gap-2 max-w-[280px] mx-auto">
          {[
            { icon: '10', title: 'Draft 10 Players', desc: 'Across 4 seed tiers', color: '#00ff87' },
            { icon: '$', title: 'Set Your Buy-in', desc: 'You and your friends decide the stakes', color: '#ff9f0a' },
            { icon: 'W', title: 'Most Stats Wins', desc: 'PTS + REB + AST across every game', color: '#00e5ff' },
          ].map(({ icon, title, desc, color }) => (
            <div
              key={title}
              className="flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left"
              style={{ borderColor: color + '25', background: color + '06' }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-display text-base font-bold text-[#080b10]"
                style={{ background: color }}
              >
                {icon}
              </div>
              <div>
                <div className="font-body text-sm font-semibold text-[#f0f4f8]">{title}</div>
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
              background: '#00ff87',
              boxShadow: '0 0 30px rgba(0,255,135,0.4)',
            }}
          >
            START A LEAGUE
          </div>
          <span className="font-body text-xs text-[#4b5563]">
            The sharpest game in March
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
/*  AD 7 — ALUMNI / SCHOOL PRIDE                                       */
/*  Hook: Rep your school's players, loyalty meets strategy             */
/* ================================================================== */
function AdAlumni() {
  return (
    <AdCard id="ad-alumni" filename="mns-ad-alumni">
      <div className="flex flex-col h-full min-h-[680px] bg-gradient-to-b from-[#080b10] via-[#0d1117] to-[#080b10] p-8 text-center">
        {/* Top badge */}
        <div className="mx-auto mb-5 rounded-full border border-[#bf5af230] bg-[#bf5af208] px-4 py-1.5">
          <span className="font-body text-xs tracking-widest uppercase text-[#bf5af2]">
            March Madness 2026
          </span>
        </div>

        {/* Headline */}
        <h2 className="font-display text-5xl tracking-wide leading-none text-[#f0f4f8]">
          REP
          <br />
          <span className="text-[#bf5af2]" style={{ textShadow: '0 0 30px #bf5af2' }}>
            YOUR
          </span>
          <br />
          SCHOOL
        </h2>

        <p className="mt-4 font-body text-sm text-[#8b949e] max-w-[280px] mx-auto">
          Your guys are in the tournament. Draft them.
          Watch their stats climb. Prove your school runs March.
        </p>

        {/* Jersey grid */}
        <div className="mt-6 grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto">
          {[
            { num: '5', school: 'ARK', color: '#bf5af2' },
            { num: '22', school: 'KU', color: '#00e5ff' },
            { num: '12', school: 'DUKE', color: '#00ff87' },
            { num: '15', school: 'TTU', color: '#ff9f0a' },
            { num: '3', school: 'BYU', color: '#00e5ff' },
            { num: '21', school: 'SLU', color: '#bf5af2' },
          ].map(({ num, school, color }) => (
            <div
              key={num + school}
              className="flex flex-col items-center justify-center rounded-xl border py-4"
              style={{ borderColor: color + '30', background: color + '08' }}
            >
              <span className="font-display text-3xl" style={{ color }}>{num}</span>
              <span className="font-mono text-[10px] text-[#8b949e] mt-1">{school}</span>
            </div>
          ))}
        </div>

        <p className="mt-4 font-body text-xs text-[#4b5563] max-w-[260px] mx-auto">
          Draft players from your alma mater — or poach from rivals.
          10 picks across 4 seed tiers.
        </p>

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
            DRAFT YOUR PLAYERS
          </div>
          <span className="font-body text-xs text-[#4b5563]">
            Loyalty meets strategy
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
/*  AD 8 — CINDERELLA / CHAOS                                          */
/*  Hook: Upsets, underdogs, the madness of March                       */
/* ================================================================== */
function AdCinderella() {
  return (
    <AdCard id="ad-cinderella" filename="mns-ad-cinderella">
      <div className="flex flex-col h-full min-h-[680px] bg-gradient-to-b from-[#080b10] via-[#0d1117] to-[#080b10] p-8 text-center">
        {/* Top badge */}
        <div className="mx-auto mb-5 rounded-full border border-[#ff9f0a30] bg-[#ff9f0a08] px-4 py-1.5">
          <span className="font-body text-xs tracking-widest uppercase text-[#ff9f0a]">
            Expect the Unexpected
          </span>
        </div>

        {/* Upset scoreboard */}
        <div className="flex flex-col gap-2 mb-6">
          {[
            { winner: '(16) FDU', loser: '(1) PUR', wscore: '63', lscore: '58', color: '#ff453a' },
            { winner: '(15) ORAL', loser: '(2) OSU', wscore: '75', lscore: '72', color: '#ff9f0a' },
            { winner: '(13) FUR', loser: '(4) UVA', wscore: '68', lscore: '67', color: '#ff9f0a' },
          ].map(({ winner, loser, wscore, lscore, color }) => (
            <div
              key={winner}
              className="rounded-xl border px-4 py-2.5 flex items-center justify-between"
              style={{ borderColor: color + '30', background: color + '06' }}
            >
              <div className="text-left">
                <p className="font-display text-sm font-bold" style={{ color }}>{winner}</p>
                <p className="font-body text-xs text-[#4b5563]">{loser}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-lg font-bold" style={{ color }}>{wscore}</p>
                <p className="font-mono text-xs text-[#4b5563]">{lscore}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Headline */}
        <h2 className="font-display text-4xl tracking-wide leading-none text-[#f0f4f8]">
          CHAOS IS
          <br />
          <span className="text-[#ff453a]" style={{ textShadow: '0 0 30px #ff453a' }}>
            THE STRATEGY
          </span>
        </h2>

        <p className="mt-4 font-body text-sm text-[#8b949e] max-w-[280px] mx-auto">
          16-seeds beat 1-seeds. Nobodies become legends.
          Draft the underdogs everyone else ignores.
        </p>

        {/* Tier 4 callout */}
        <div className="mt-5 rounded-xl border border-[#ff9f0a30] bg-[#ff9f0a08] px-5 py-4">
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg font-display text-xl text-[#080b10] bg-[#ff9f0a]">
              4
            </div>
            <div className="text-left">
              <p className="font-body text-sm font-semibold text-[#ff9f0a]">Tier 4 — Underdogs</p>
              <p className="font-body text-xs text-[#8b949e]">Seeds 13–16 • 1 pick</p>
            </div>
          </div>
          <p className="mt-2 font-body text-xs text-[#4b5563]">
            One pick. One shot. If they go on a run, you win big.
          </p>
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
            DRAFT THE MADNESS
          </div>
          <span className="font-body text-xs text-[#4b5563]">
            Cinderellas score points too
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
/*  AD 9 — SOCIAL / SQUAD                                              */
/*  Hook: Group competition, trash talk, bragging rights                */
/* ================================================================== */
function AdSquad() {
  return (
    <AdCard id="ad-squad" filename="mns-ad-squad">
      <div className="flex flex-col h-full min-h-[680px] bg-gradient-to-b from-[#080b10] via-[#0d1117] to-[#080b10] p-8 text-center">
        {/* Top badge */}
        <div className="mx-auto mb-5 rounded-full border border-[#00e5ff30] bg-[#00e5ff08] px-4 py-1.5">
          <span className="font-body text-xs tracking-widest uppercase text-[#00e5ff]">
            Squad Up
          </span>
        </div>

        {/* Headline */}
        <h2 className="font-display text-5xl tracking-wide leading-none text-[#f0f4f8]">
          5 FRIENDS
          <br />
          <span className="text-[#00e5ff]" style={{ textShadow: '0 0 30px #00e5ff' }}>
            1 CHAMPION
          </span>
        </h2>

        <p className="mt-4 font-body text-sm text-[#8b949e] max-w-[280px] mx-auto">
          Create a league in 30 seconds. Invite your crew.
          Talk trash all tournament. Winner gets the glory.
        </p>

        {/* Leaderboard mockup */}
        <div className="mt-6 rounded-xl border border-[#1f2937] bg-[#0d1117] overflow-hidden">
          <div className="px-4 py-2 border-b border-[#1f2937]">
            <span className="font-mono text-[10px] text-[#4b5563] uppercase tracking-wider">
              League Standings
            </span>
          </div>
          {[
            { rank: 1, name: 'You', score: 847, color: '#00ff87', trophy: true },
            { rank: 2, name: 'Jake', score: 812, color: '#00e5ff', trophy: false },
            { rank: 3, name: 'Marcus', score: 789, color: '#bf5af2', trophy: false },
            { rank: 4, name: 'Sarah', score: 756, color: '#f0f4f8', trophy: false },
            { rank: 5, name: 'Tyler', score: 701, color: '#f0f4f8', trophy: false },
          ].map(({ rank, name, score, color, trophy }) => (
            <div
              key={rank}
              className={`flex items-center gap-3 px-4 py-2.5 ${rank === 1 ? 'bg-[#00ff8708]' : ''}`}
            >
              <span
                className="font-display text-lg w-6 text-center"
                style={{ color }}
              >
                {rank}
              </span>
              <span className="font-body text-sm text-[#f0f4f8] flex-1 text-left">
                {name} {trophy && <span className="text-[#ff9f0a]">👑</span>}
              </span>
              <span className="font-mono text-sm" style={{ color }}>
                {score}
              </span>
            </div>
          ))}
        </div>

        {/* Steps */}
        <div className="mt-5 flex flex-col gap-1.5 text-left mx-auto max-w-[260px]">
          {[
            { step: '1', text: 'Create your league', color: '#00ff87' },
            { step: '2', text: 'Share the invite code', color: '#00e5ff' },
            { step: '3', text: 'Everybody drafts 10 players', color: '#bf5af2' },
            { step: '4', text: 'Watch the leaderboard all March', color: '#ff9f0a' },
          ].map(({ step, text, color }) => (
            <div key={step} className="flex items-center gap-2">
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] text-[#080b10] font-bold"
                style={{ background: color }}
              >
                {step}
              </span>
              <span className="font-body text-xs text-[#8b949e]">{text}</span>
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
              background: 'linear-gradient(135deg, #00e5ff, #00ff87)',
              boxShadow: '0 0 30px rgba(0,229,255,0.3)',
            }}
          >
            CREATE YOUR LEAGUE
          </div>
          <span className="font-body text-xs text-[#4b5563]">
            Bragging rights are forever
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
/*  AD 10 — ROSTER SHOWCASE                                            */
/*  Hook: See what a full 10-player roster looks like                   */
/* ================================================================== */
function AdRoster() {
  const roster = [
    { tier: 1, color: '#00ff87', players: [
      { name: 'Cameron Boozer', jersey: '#12', team: 'DUKE', seed: 1 },
      { name: 'Darryn Peterson', jersey: '#22', team: 'KU', seed: 4 },
      { name: 'Darius Acuff Jr.', jersey: '#5', team: 'ARK', seed: 4 },
      { name: 'Keaton Wagler', jersey: '#23', team: 'ILL', seed: 3 },
    ]},
    { tier: 2, color: '#00e5ff', players: [
      { name: 'JT Toppin', jersey: '#15', team: 'TTU', seed: 5 },
      { name: 'Zuby Ejiofor', jersey: '#24', team: 'SJU', seed: 5 },
      { name: 'AJ Dybantsa', jersey: '#3', team: 'BYU', seed: 6 },
    ]},
    { tier: 3, color: '#bf5af2', players: [
      { name: 'Dailyn Swain', jersey: '#3', team: 'TEX', seed: 11 },
      { name: 'Robbie Avila', jersey: '#21', team: 'SLU', seed: 9 },
    ]},
    { tier: 4, color: '#ff9f0a', players: [
      { name: 'Dominique Daniels Jr.', jersey: '#1', team: 'CBU', seed: 13 },
    ]},
  ];

  return (
    <AdCard id="ad-roster" filename="mns-ad-roster-showcase">
      <div className="flex flex-col h-full min-h-[680px] bg-gradient-to-b from-[#080b10] via-[#0d1117] to-[#080b10] p-6 text-center">
        {/* Top badge */}
        <div className="mx-auto mb-4 rounded-full border border-[#1f2937] bg-[#111827] px-4 py-1.5">
          <span className="font-body text-xs tracking-widest uppercase text-[#8b949e]">
            Example Roster
          </span>
        </div>

        {/* Headline */}
        <h2 className="font-display text-3xl tracking-wide leading-none text-[#f0f4f8] mb-1">
          THIS IS YOUR
          <br />
          <span className="text-[#00ff87]" style={{ textShadow: '0 0 25px #00ff87' }}>
            10-PLAYER ROSTER
          </span>
        </h2>

        <p className="font-body text-xs text-[#8b949e] mb-4">
          4 tiers. 10 picks. Infinite strategy.
        </p>

        {/* Roster by tier */}
        <div className="flex flex-col gap-2">
          {roster.map(({ tier, color, players }) => (
            <div key={tier} className="rounded-xl border overflow-hidden" style={{ borderColor: color + '25' }}>
              {/* Tier header */}
              <div
                className="flex items-center justify-between px-3 py-1.5"
                style={{ background: color + '12' }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded font-display text-xs text-[#080b10] font-bold"
                    style={{ background: color }}
                  >
                    {tier}
                  </span>
                  <span className="font-body text-xs font-semibold" style={{ color }}>
                    Tier {tier}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[#4b5563]">
                  {players.length} pick{players.length > 1 ? 's' : ''}
                </span>
              </div>
              {/* Players */}
              <div className="px-3 py-1.5 space-y-0.5" style={{ background: color + '04' }}>
                {players.map((p) => (
                  <div key={p.name} className="flex items-center justify-between py-0.5">
                    <div className="flex items-center gap-2 text-left">
                      <span className="font-mono text-[10px] text-[#4b5563] w-5 text-right">{p.jersey}</span>
                      <span className="font-body text-xs text-[#f0f4f8] font-medium">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-[#8b949e]">{p.team}</span>
                      <span
                        className="font-mono text-[9px] px-1 py-0.5 rounded"
                        style={{ color, background: color + '15' }}
                      >
                        ({p.seed})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Scoring reminder */}
        <div className="mt-4 flex justify-center gap-5">
          {['PTS', 'REB', 'AST'].map((stat) => (
            <div key={stat} className="flex flex-col items-center">
              <span className="font-mono text-lg font-bold text-[#00ff87]">+1</span>
              <span className="font-body text-[10px] text-[#4b5563]">per {stat}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-4 flex flex-col items-center gap-2">
          <div
            className="rounded-xl px-8 py-3 font-display text-xl tracking-wider text-[#080b10]"
            style={{
              background: '#00ff87',
              boxShadow: '0 0 30px rgba(0,255,135,0.4)',
            }}
          >
            BUILD YOURS
          </div>
          <span className="font-body text-xs text-[#4b5563]">
            Draft your 10 at ncaa.mnsfantasy.com
          </span>
        </div>

        {/* Brand */}
        <div className="mt-4">
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
/*  AD 11 — ROSTER DRAFT STRATEGY                                      */
/*  Hook: Show the strategic tier trade-offs with example roster        */
/* ================================================================== */
function AdDraftStrategy() {
  return (
    <AdCard id="ad-draft-strategy" filename="mns-ad-draft-strategy">
      <div className="flex flex-col h-full min-h-[680px] bg-gradient-to-b from-[#080b10] via-[#0d1117] to-[#080b10] p-7 text-center">
        {/* Top badge */}
        <div className="mx-auto mb-4 rounded-full border border-[#00e5ff30] bg-[#00e5ff08] px-4 py-1.5">
          <span className="font-body text-xs tracking-widest uppercase text-[#00e5ff]">
            Draft Strategy
          </span>
        </div>

        {/* Headline */}
        <h2 className="font-display text-3xl tracking-wide leading-none text-[#f0f4f8]">
          HOW WOULD
          <br />
          <span className="text-[#00e5ff]" style={{ textShadow: '0 0 25px #00e5ff' }}>
            YOU DRAFT?
          </span>
        </h2>

        <p className="mt-3 font-body text-xs text-[#8b949e] max-w-[300px] mx-auto">
          Every roster has the same structure. The strategy is how you fill it.
        </p>

        {/* Side-by-side strategy comparison */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {/* Strategy A: Stars & Scrubs */}
          <div className="rounded-xl border border-[#00ff8725] bg-[#00ff8706] p-3 text-left">
            <p className="font-display text-xs text-[#00ff87] mb-2 text-center">STARS & SCRUBS</p>
            <div className="space-y-1">
              {[
                { name: 'Boozer', team: 'DUKE', tier: 1, color: '#00ff87' },
                { name: 'Peterson', team: 'KU', tier: 1, color: '#00ff87' },
                { name: 'Acuff Jr.', team: 'ARK', tier: 1, color: '#00ff87' },
                { name: 'Wagler', team: 'ILL', tier: 1, color: '#00ff87' },
                { name: 'Toppin', team: 'TTU', tier: 2, color: '#00e5ff' },
                { name: 'Ejiofor', team: 'SJU', tier: 2, color: '#00e5ff' },
                { name: 'Dybantsa', team: 'BYU', tier: 2, color: '#00e5ff' },
              ].map(({ name, team, color }) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="font-body text-[10px] text-[#f0f4f8]">{name}</span>
                  <span className="font-mono text-[9px]" style={{ color }}>{team}</span>
                </div>
              ))}
              <div className="border-t border-[#1f2937] pt-1 mt-1">
                <p className="font-body text-[9px] text-[#4b5563] italic">
                  Bet big on elite talent
                </p>
              </div>
            </div>
          </div>

          {/* Strategy B: Diversified */}
          <div className="rounded-xl border border-[#bf5af225] bg-[#bf5af206] p-3 text-left">
            <p className="font-display text-xs text-[#bf5af2] mb-2 text-center">CHAOS DRAFT</p>
            <div className="space-y-1">
              {[
                { name: 'Fears Jr.', team: 'MSU', color: '#00ff87' },
                { name: 'Smith', team: 'PUR', color: '#00ff87' },
                { name: 'Flemings', team: 'HOU', color: '#00ff87' },
                { name: 'Boozer', team: 'DUKE', color: '#00ff87' },
                { name: 'Anderson', team: 'TTU', color: '#00e5ff' },
                { name: 'Tanner', team: 'VAN', color: '#00e5ff' },
                { name: 'Dybantsa', team: 'BYU', color: '#00e5ff' },
              ].map(({ name, team, color }) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="font-body text-[10px] text-[#f0f4f8]">{name}</span>
                  <span className="font-mono text-[9px]" style={{ color }}>{team}</span>
                </div>
              ))}
              <div className="border-t border-[#1f2937] pt-1 mt-1">
                <p className="font-body text-[9px] text-[#4b5563] italic">
                  Spread risk, chase upsets
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* The key insight */}
        <div className="mt-4 rounded-xl border border-[#1f2937] bg-[#111827] p-4">
          <p className="font-body text-xs text-[#8b949e]">
            Same 10 picks. Same tiers. Completely different strategies.
          </p>
          <div className="mt-3 flex justify-center gap-3">
            {[
              { tier: 1, picks: 4, color: '#00ff87' },
              { tier: 2, picks: 3, color: '#00e5ff' },
              { tier: 3, picks: 2, color: '#bf5af2' },
              { tier: 4, picks: 1, color: '#ff9f0a' },
            ].map(({ tier, picks, color }) => (
              <div key={tier} className="flex flex-col items-center">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg font-display text-sm text-[#080b10] font-bold"
                  style={{ background: color }}
                >
                  {tier}
                </span>
                <span className="font-mono text-[9px] text-[#4b5563] mt-1">{picks}x</span>
              </div>
            ))}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* CTA */}
        <div className="mt-5 flex flex-col items-center gap-2">
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
            What's your strategy?
          </span>
        </div>

        {/* Brand */}
        <div className="mt-4">
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
    {
      id: 'genz',
      label: 'College Students / Gen Z',
      description: 'FOMO-driven, group chat energy, competitive friend groups.',
      component: <AdGenZ />,
    },
    {
      id: 'dfs',
      label: 'Sports Bettors / DFS',
      description: 'For sports bettors and DFS players. Set your own buy-in with friends, winner takes the pot.',
      component: <AdDFS />,
    },
    {
      id: 'alumni',
      label: 'Alumni / School Pride',
      description: 'Rep your school\'s players. Loyalty meets strategy.',
      component: <AdAlumni />,
    },
    {
      id: 'cinderella',
      label: 'Cinderella / Chaos',
      description: 'For fans who live for the upsets. Underdogs, Cinderellas, pure madness.',
      component: <AdCinderella />,
    },
    {
      id: 'squad',
      label: 'Social / Squad',
      description: 'Group competition, trash talk, leaderboard bragging rights.',
      component: <AdSquad />,
    },
    {
      id: 'roster',
      label: 'Roster Showcase',
      description: 'Shows a full 10-player example roster across all 4 tiers. Great for explaining the format.',
      component: <AdRoster />,
    },
    {
      id: 'draft-strategy',
      label: 'Draft Strategy',
      description: 'Side-by-side comparison of two draft strategies using the same tier structure.',
      component: <AdDraftStrategy />,
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
