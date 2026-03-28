export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-background)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 text-center">
        <p className="text-sm text-[var(--color-muted-foreground)] mb-2">
          <span className="font-display text-[var(--color-foreground)]">
            MNS<span className="text-neon-green">ncaa</span>
          </span>
          {' '}&mdash; NCAA Tournament 2026
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-1 text-xs text-[var(--color-muted-foreground)] mb-4">
          <a href="https://mnsfantasy.com" className="hover:text-white transition-colors">
            Home
          </a>
          <span>&middot;</span>
          <a href="https://mnsfantasy.com/privacy" className="hover:text-white transition-colors">
            Privacy
          </a>
        </nav>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          &copy; {new Date().getFullYear()} MNS &middot; Built by{' '}
          <a
            href="https://www.seanmun.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Sean Munley
          </a>
        </p>
      </div>
    </footer>
  )
}
