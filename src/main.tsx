import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { CLERK_PUBLISHABLE_KEY, ALLOWED_REDIRECT_ORIGINS } from './lib/clerk';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      allowedRedirectOrigins={ALLOWED_REDIRECT_ORIGINS}
      isSatellite
      domain="mnsfantasy.com"
      signInUrl="https://mnsfantasy.com/sign-in"
      afterSignOutUrl="https://mnsfantasy.com"
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster
            position="top-right"
            theme="dark"
            toastOptions={{
              style: {
                background: 'var(--bg-card)',
                border: '1px solid var(--bg-border)',
                color: 'var(--text-primary)',
              },
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </ClerkProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
