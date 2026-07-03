/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional fallback to show instead of the default error UI */
  fallback?: React.ReactNode;
  /** If true, renders a compact inline error instead of the full-page version */
  inline?: boolean;
  /** Called when the error boundary catches an error */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global React Error Boundary that prevents the entire app from crashing
 * to a white page. Instead, it catches React rendering errors and shows
 * a recovery UI with a retry button.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Explicitly annotate types to resolve React 19 generic class-component type resolution in strict environments
  props: ErrorBoundaryProps;
  state: ErrorBoundaryState;
  setState: (state: Partial<ErrorBoundaryState> | ((prevState: ErrorBoundaryState) => Partial<ErrorBoundaryState>), callback?: () => void) => void;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught rendering error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      if (this.props.inline) {
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center gap-4 min-h-[200px] w-full">
            <AlertTriangle className="w-8 h-8 text-pink-500/60" />
            <div>
              <p className="text-sm font-semibold text-white/80">This section encountered an issue</p>
              <p className="text-xs text-white/40 mt-1 max-w-sm">
                A rendering error occurred. Click below to reload this view.
              </p>
            </div>
            <button
              onClick={this.handleRetry}
              className="px-5 py-2 rounded-full bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-400 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
            >
              <RefreshCw size={12} />
              <span>Reload View</span>
            </button>
            {this.state.error && (
              <details className="text-left max-w-lg w-full mt-4">
                <summary className="text-[10px] text-white/30 cursor-pointer hover:text-white/50 uppercase tracking-widest font-mono">
                  Error Details
                </summary>
                <pre className="mt-2 p-4 rounded-xl bg-white/5 border border-white/10 text-[10px] text-red-400/80 font-mono overflow-auto max-h-40 whitespace-pre-wrap">
                  {this.state.error.message}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        );
      }

      // Full-page error recovery UI
      return (
        <div className="min-h-screen bg-[#131314] flex flex-col items-center justify-center text-center p-8 gap-6">
          <div className="w-20 h-20 rounded-full bg-pink-500/10 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-pink-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
            <p className="text-sm text-white/50 mt-2 max-w-md">
              The player experienced an unexpected error. Your music and data are safe.
              Click below to recover.
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="px-8 py-3 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-bold text-sm shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
          >
            <RefreshCw size={16} />
            <span>Reload Playme</span>
          </button>
          {this.state.error && (
            <details className="text-left max-w-lg w-full mt-4">
              <summary className="text-[10px] text-white/30 cursor-pointer hover:text-white/50 uppercase tracking-widest font-mono">
                Error Details
              </summary>
              <pre className="mt-2 p-4 rounded-xl bg-white/5 border border-white/10 text-[10px] text-red-400/80 font-mono overflow-auto max-h-40 whitespace-pre-wrap">
                {this.state.error.message}
                {'\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
