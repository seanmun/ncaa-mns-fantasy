import { Routes, Route } from 'react-router-dom';
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  SignIn,
  SignUp,
} from '@clerk/clerk-react';
import { AnimatePresence } from 'framer-motion';
import AppShell from './components/layout/AppShell';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import CreateLeague from './pages/CreateLeague';
import JoinLeague from './pages/JoinLeague';
import LeagueHome from './pages/LeagueHome';
import PickRoster from './pages/PickRoster';
import MemberRoster from './pages/MemberRoster';
import AdminPanel from './pages/AdminPanel';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import OnboardingModal from './components/ui/OnboardingModal';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

export default function App() {
  return (
    <>
      {/* Onboarding modal fires once for new users */}
      <SignedIn>
        <OnboardingModal />
      </SignedIn>

      <AnimatePresence mode="wait">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route
            path="/sign-in/*"
            element={
              <div className="min-h-screen flex items-center justify-center bg-bg-primary">
                <SignIn routing="path" path="/sign-in" afterSignInUrl="/dashboard" />
              </div>
            }
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
    </>
  );
}
