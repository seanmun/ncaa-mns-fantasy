import { NavLink } from 'react-router-dom';
import { Home, Trophy, User, Shield } from 'lucide-react';
import { useAdminCheck } from '@/hooks/useAdminCheck';

export default function BottomNav() {
  const isAdmin = useAdminCheck();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-[60px] bg-bg-secondary border-t border-bg-border md:hidden">
      <div className="h-full flex items-center justify-around px-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-colors focus-visible:outline-2 focus-visible:outline-neon-cyan focus-visible:outline-offset-2 ${
              isActive
                ? 'text-neon-green [text-shadow:0_0_10px_#00ff87]'
                : 'text-text-muted hover:text-text-secondary'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/dashboard"
          end={false}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-colors focus-visible:outline-2 focus-visible:outline-neon-cyan focus-visible:outline-offset-2 ${
              isActive
                ? 'text-neon-green [text-shadow:0_0_10px_#00ff87]'
                : 'text-text-muted hover:text-text-secondary'
            }`
          }
        >
          <Trophy className="w-5 h-5" />
          <span>My Leagues</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-colors focus-visible:outline-2 focus-visible:outline-neon-cyan focus-visible:outline-offset-2 ${
              isActive
                ? 'text-neon-green [text-shadow:0_0_10px_#00ff87]'
                : 'text-text-muted hover:text-text-secondary'
            }`
          }
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-colors focus-visible:outline-2 focus-visible:outline-neon-cyan focus-visible:outline-offset-2 ${
                isActive
                  ? 'text-neon-green [text-shadow:0_0_10px_#00ff87]'
                  : 'text-text-muted hover:text-text-secondary'
              }`
            }
          >
            <Shield className="w-5 h-5" />
            <span>Admin</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
}
