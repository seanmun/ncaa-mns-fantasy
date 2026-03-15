export default function Footer() {
  return (
    <footer className="hidden md:block border-t border-bg-border bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <p className="text-text-muted text-sm">
          Powered by{' '}
          <a
            href="https://moneyneversleeps.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-text-primary transition-colors underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-neon-cyan focus-visible:outline-offset-2"
          >
            MoneyNeverSleeps.app
          </a>
        </p>
        <p className="text-text-muted text-sm font-display tracking-wide">
          MNSfantasy
        </p>
      </div>
    </footer>
  );
}
