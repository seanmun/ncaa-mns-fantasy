import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  SignedIn,
  SignUp,
  useAuth,
} from '@clerk/clerk-react';
import { AnimatePresence } from 'framer-motion';
import AppShell from './components/layout/AppShell';
import Footer from './components/layout/Footer';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import CreateLeague from './pages/CreateLeague';
import JoinLeague from './pages/JoinLeague';
import LeagueHome from './pages/LeagueHome';
import PickRoster from './pages/PickRoster';
import MemberRoster from './pages/MemberRoster';
import AdminPanel from './pages/AdminPanel';
import Settings from './pages/Settings';
import Media from './pages/Media';
import About from './pages/About';
import Privacy from './pages/Privacy';
import Changelog from './pages/Changelog';
import NotFound from './pages/NotFound';
import OnboardingModal from './components/ui/OnboardingModal';
import { useUserSync } from './hooks/useUserSync';

// Syncs Clerk user → local DB users table on sign-in
function UserSync() {
  useUserSync();
  return null;
}

function PrimarySignInRedirect() {
  useEffect(() => {
    window.location.href =
      'https://mnsfantasy.com/sign-in?redirect_url=' +
      encodeURIComponent(window.location.href);
  }, []);
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      window.location.href =
        'https://mnsfantasy.com/sign-in?redirect_url=' +
        encodeURIComponent(window.location.href);
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || !isSignedIn) return null;
  return <>{children}</>;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      {/* Sync Clerk user to DB + show onboarding modal for new users */}
      <SignedIn>
        <UserSync />
        <OnboardingModal />
      </SignedIn>

      <div className="flex-1">
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route
            path="/sign-in/*"
            element={<PrimarySignInRedirect />}
          />
          <Route
            path="/sign-up/*"
            element={
              <div className="min-h-screen flex items-center justify-center bg-bg-primary">
                <SignUp routing="path" path="/sign-up" afterSignUpUrl="/dashboard" />
              </div>
            }
          />
          <Route path="/join/:inviteCode" element={<JoinLeague />} />
          <Route path="/media" element={<Media />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/changelog" element={<Changelog />} />

          {/* Protected routes inside AppShell */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leagues/create" element={<CreateLeague />} />
            <Route path="/leagues/:id" element={<LeagueHome />} />
            <Route path="/leagues/:id/pick" element={<PickRoster />} />
            <Route path="/leagues/:id/roster/:memberId" element={<MemberRoster />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
      </div>

      <Footer />
    </div>
  );
}
