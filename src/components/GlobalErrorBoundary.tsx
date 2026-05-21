// Global Error Boundary for Tiketmu App
import React from 'react';
import { AlertTriangle, RefreshCcw, Home, RotateCw } from 'lucide-react';

interface Props {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
}

export default class GlobalErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false
  };

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Uncaught error in ${this.props.name || 'Component'}:`, error, errorInfo);
  }

  handleReload = () => {
    try {
      window.location.reload();
    } catch (e) {
      console.error('Failed to reload page:', e);
    }
  };

  handleGoHome = () => {
    try {
      window.location.href = '/';
    } catch (e) {
      console.error('Failed to redirect:', e);
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="py-20 px-6 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-inner max-w-lg mx-auto my-8">
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
             <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
          <h3 className="text-xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">Section Interrupted</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic mb-8 max-w-xs mx-auto leading-relaxed">
            We encountered a minor disturbance in the experience feed. (Source: {this.props.name || 'Unknown'})
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button 
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-transform cursor-pointer"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Try Reset
            </button>
            <button 
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-transform cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Reload Page
            </button>
            <button 
              type="button"
              onClick={this.handleGoHome}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-transform cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

