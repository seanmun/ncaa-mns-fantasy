import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import BottomNav from './BottomNav';

export default function AppShell() {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <Header />

      {/* Main content area */}
      <main className="flex-1 pt-16 pb-[60px] md:pb-0">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>

      {/* Desktop footer */}
      <Footer />

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}
