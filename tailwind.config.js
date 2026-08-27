/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // RGB-triplet vars so opacity modifiers (bg-neon-red/5) work
        // and both themes flow through — values live in index.css.
        'neon-green': 'rgb(var(--neon-green-rgb) / <alpha-value>)',
        'neon-cyan': 'rgb(var(--neon-cyan-rgb) / <alpha-value>)',
        'neon-purple': 'rgb(var(--neon-purple-rgb) / <alpha-value>)',
        'neon-orange': 'rgb(var(--neon-orange-rgb) / <alpha-value>)',
        'neon-red': 'rgb(var(--neon-red-rgb) / <alpha-value>)',
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-card': 'var(--bg-card)',
        'bg-card-hover': 'var(--bg-card-hover)',
        'bg-border': 'var(--bg-border)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'tier-1': 'var(--tier-1)',
        'tier-2': 'var(--tier-2)',
        'tier-3': 'var(--tier-3)',
        'tier-4': 'var(--tier-4)',
        'status-locked': 'var(--status-locked)',
        'status-active': 'var(--status-active)',
        'status-eliminated': 'var(--status-eliminated)',
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        glow: 'glow 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { boxShadow: '0 0 5px #00ff87, 0 0 10px #00ff87' },
          '50%': { boxShadow: '0 0 20px #00ff87, 0 0 40px #00ff87' },
        },
        glow: {
          from: { textShadow: '0 0 5px #00ff87' },
          to: { textShadow: '0 0 20px #00ff87, 0 0 30px #00ff87' },
        },
      },
    },
  },
  plugins: [],
};
