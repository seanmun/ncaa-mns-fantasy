import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-4 text-center">
          <h1 className="mb-4 font-display text-4xl tracking-wide text-neon-red">
            Technical Foul
          </h1>
          <p className="mb-6 max-w-md text-text-secondary">
            Something went wrong. The app hit an unexpected error.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-neon-green px-6 py-3 text-sm font-bold text-gray-900 transition-shadow hover:shadow-[0_0_20px_rgba(0,255,135,0.3)]"
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
