import { Link } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { ChevronLeft, Home, Shield, Settings } from 'lucide-react';
import { getPlatformUrl } from '@/lib/utils';
import { useAdminCheck } from '@/hooks/useAdminCheck';

export default function Header() {
  const isAdmin = useAdminCheck();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-bg-secondary border-b border-bg-border">
      <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Logo + back link */}
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="font-display text-2xl tracking-wide hover:animate-glow transition-all focus-visible:outline-2 focus-visible:outline-neon-cyan focus-visible:outline-offset-2"
          >
            <span className="text-white">MNS</span><span className="text-neon-green">ncaa</span>
          </Link>
          <a
            href={getPlatformUrl()}
            className="hidden sm:flex items-center gap-1 text-text-muted text-xs hover:text-text-secondary transition-colors focus-visible:outline-2 focus-visible:outline-neon-cyan focus-visible:outline-offset-2"
          >
            <ChevronLeft className="w-3 h-3" />
            All Games
          </a>
        </div>

        {/* Center: Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors focus-visible:outline-2 focus-visible:outline-neon-cyan focus-visible:outline-offset-2"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            to="/settings"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors focus-visible:outline-2 focus-visible:outline-neon-cyan focus-visible:outline-offset-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors focus-visible:outline-2 focus-visible:outline-neon-cyan focus-visible:outline-offset-2"
            >
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          )}
        </nav>

        {/* Right: User button */}
        <div className="flex items-center">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: 'w-8 h-8',
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
