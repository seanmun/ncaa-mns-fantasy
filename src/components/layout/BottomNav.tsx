import { NavLink } from 'react-router-dom';
import { Home, Trophy, User, Shield } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Home', icon: <Home className="w-5 h-5" /> },
  { to: '/leagues', label: 'My Leagues', icon: <Trophy className="w-5 h-5" /> },
  { to: '/profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  { to: '/admin', label: 'Admin', icon: <Shield className="w-5 h-5" /> },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-[60px] bg-bg-secondary border-t border-bg-border md:hidden">
      <div className="h-full flex items-center justify-around px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-colors focus-visible:outline-2 focus-visible:outline-neon-cyan focus-visible:outline-offset-2 ${
                isActive
                  ? 'text-neon-green [text-shadow:0_0_10px_#00ff87]'
                  : 'text-text-muted hover:text-text-secondary'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
