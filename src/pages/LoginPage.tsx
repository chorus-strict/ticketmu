import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Apple, Ticket, Loader2, AlertCircle } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Invalid credentials. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen flex items-stretch">
      {/* Sidebar Overlay - Desktop Only */}
      <div className="hidden lg:flex w-[420px] premium-gradient p-12 flex-col justify-between text-white relative overflow-hidden shrink-0">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          {/* Update: Added Link to "/" on Desktop Logo */}
          <Link to="/" className="flex items-center gap-3 mb-12 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600">
              <Ticket className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Tiketmu</span>
          </Link>
          
          <h1 className="text-4xl font-extrabold leading-tight mb-6 text-white">The pulse of premium events.</h1>
          <p className="text-indigo-100 text-lg leading-relaxed mb-10">
            Designed for rapid ticketing, seamless entry, and robust event management—wherever you are.
          </p>
          
          <div className="space-y-4">
            <div className="glass p-4 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl">📱</div>
              <div>
                <p className="font-semibold text-white">Mobile-First Architecture</p>
                <p className="text-xs text-indigo-100/70">Optimized for 100% native feel</p>
              </div>
            </div>
            <div className="glass p-4 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl">⚡</div>
              <div>
                <p className="font-semibold text-white">Real-time Analytics</p>
                <p className="text-xs text-indigo-100/70">Live sales and entry tracking</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs font-medium text-indigo-200/80">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          System Status: Operational v2.4
        </div>
      </div>

      {/* Main Form Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 bg-white overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden flex flex-col items-center mb-8">
           {/* Update: Added Link to "/" on Mobile Logo */}
           <Link to="/" className="flex items-center gap-2 mb-6 text-slate-900 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 premium-gradient rounded-lg flex items-center justify-center text-white">
              <Ticket className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">Tiketmu</span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome back</h2>
          <p className="text-slate-500 text-center">Enter your credentials to access your dashboard</p>
        </div>

        <div className="w-full max-w-sm">
          {/* Desktop Form Header */}
          <header className="hidden lg:block mb-10 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h2>
            <p className="text-slate-500">Enter your credentials to access your dashboard</p>
          </header>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-red-600">{error}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Work Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors h-5 w-5" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all outline-none" 
                  placeholder="name@company.com" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <a href="#" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Forgot?</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors h-5 w-5" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all outline-none" 
                  placeholder="••••••••" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 py-2">
              <input type="checkbox" id="remember" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all" />
              <label htmlFor="remember" className="text-sm text-slate-600 select-none">Keep me logged in for 30 days</label>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/70 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 group active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In To Platform</span>
                  <ArrowRight className="h-5 w-5 opacity-70 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8 flex items-center gap-4 text-slate-300">
            <div className="h-px flex-1 bg-slate-200"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Or Continue With</span>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>

          {/* Social Logins */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors active:scale-95">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFomCCujSelVExahfGgd3kann1DcEQTgM0psYlMAJ3nWtx4kzfJN77JYivHdABdvTpijSUIWXVVs8h3D8wsCjqBduaTBsxSnv83UUT6qgHjNvLRURvC32410FgJyQjrUyTbrZzPHsYw_h16W3QA0jPOLPC47gNrqYZgeyfXsECNHqgAWKvOlNRO30dftXbpJhHo3_P2c9qsv3z74SZGKQaSLHvlhKLcNhkacGO2ifJEKaC9oLks2GxGPCSU6apsu7reNJfDyylUGIK" alt="Google" className="w-5 h-5" />
              <span>Google</span>
            </button>
            <button className="flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors active:scale-95">
              <Apple className="h-5 w-5 text-slate-900" />
              <span>Apple</span>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-10 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account yet? 
              <Link to="/signup" className="text-indigo-600 font-bold hover:text-indigo-700 ml-1">Join Elite Access</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}