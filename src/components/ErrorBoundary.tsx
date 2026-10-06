import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, RotateCcw } from 'lucide-react';
import { clearAllOrders } from '../services/orderService';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Wrap & Wing Co - Error caught by boundary:', error, errorInfo);
  }

  private handleResetAndReload = () => {
    try {
      clearAllOrders();
    } catch {}
    window.location.reload();
  };

  private handleReturnToMenu = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = '';
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0d0d12] text-zinc-100 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#161620] border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center text-3xl">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                {this.props.fallbackTitle || 'Display System Recovery'}
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                The display encountered an unexpected data hiccup. Don't worry — your orders are preserved in the cloud and you can instantly refresh to restore normal view.
              </p>
              {this.state.error?.message && (
                <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 font-mono text-[10px] text-rose-300 break-words text-left">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleResetAndReload}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-xs sm:text-sm tracking-wide shadow-xl shadow-rose-950/60 flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.01]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh & Re-sync Display</span>
              </button>

              <button
                type="button"
                onClick={this.handleReturnToMenu}
                className="w-full py-3 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors border border-white/10"
              >
                <Home className="w-4 h-4" />
                <span>Return to Customer Menu</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
