import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Apple, Ticket, Loader2, AlertCircle } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';

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
    <div className="bg-slate-950 min-h-screen flex items-stretch overflow-hidden font-sans">
      {/* Sidebar Overlay - Desktop Only */}
      <div className="hidden lg:flex w-[480px] bg-slate-900 p-20 flex-col justify-between text-white relative overflow-hidden shrink-0 border-r border-slate-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] -mr-64 -mt-64 rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-900/20 blur-[100px] -ml-48 -mb-48 rounded-full"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-4 mb-20 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-600/40 group-hover:rotate-12 transition-transform duration-500">
              <Ticket className="w-6 h-6" />
            </div>
            <span className="text-3xl font-extrabold tracking-tighter uppercase italic">Tiketmu</span>
          </div>
          
          <h1 className="text-5xl font-sans font-extrabold leading-[1.1] mb-8 text-white tracking-tight">
            Discover <br/>
            <span className="text-indigo-550">Premium</span> <br/>
            Experiences.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-16 font-medium">
            Your all-in-one platform for secure ticket acquisition, real-time event discovery, and exclusive rewards.
          </p>
          
          <div className="space-y-6">
            <div className="bg-slate-950/50 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800/50 flex items-center gap-6 group hover:border-indigo-600/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">💳</div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider mb-1">Secure Payments</p>
                <p className="text-[10px] font-medium text-slate-500 tracking-wide">Encrypted end-to-end transactions</p>
              </div>
            </div>
            <div className="bg-slate-950/50 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800/50 flex items-center gap-6 group hover:border-indigo-600/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🎁</div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider mb-1">Exclusive Rewards</p>
                <p className="text-[10px] font-medium text-slate-500 tracking-wide">Earn points with every ticket purchase</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="relative z-10 flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-60">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          Secure Connection Active
        </div>
      </div>

      {/* Main Form Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-20 bg-slate-950 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/5 blur-[150px] rounded-full pointer-events-none"></div>

        {/* Mobile Header */}
        <div className="lg:hidden flex flex-col items-center mb-16 relative z-10">
           <div className="flex items-center gap-3 mb-10 text-white cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
              <Ticket className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold tracking-widest uppercase italic">Tiketmu</span>
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Welcome Back</h2>
          <p className="text-slate-400 text-sm font-medium">Please enter your details to sign in</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px] relative z-10"
        >
          {/* Desktop Form Header */}
          <header className="hidden lg:block mb-12">
            <h2 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Welcome Back</h2>
            <p className="text-slate-400 text-sm font-medium">Please enter your credentials to sign in</p>
          </header>

          {error && (
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="mb-8 p-6 bg-rose-600/5 border border-rose-600/20 rounded-2xl flex items-start gap-4"
            >
              <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-rose-500 tracking-wide leading-relaxed">{error}</p>
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors h-5 w-5" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-16 pr-6 py-5 bg-slate-900/50 border border-slate-800 rounded-2xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium text-sm placeholder:text-slate-600" 
                  placeholder="you@example.com" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
                <Link to="/forgot-password" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Forgot Password?</Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors h-5 w-5" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-16 pr-16 py-5 bg-slate-900/50 border border-slate-800 rounded-2xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium text-sm placeholder:text-slate-600" 
                  placeholder="Enter password" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 py-2 px-2">
               <div className="relative flex items-center">
                  <input type="checkbox" id="remember" className="peer w-5 h-5 rounded-md bg-slate-900 border-2 border-slate-800 text-indigo-500 checked:bg-indigo-600 checked:border-indigo-600 cursor-pointer appearance-none checked:border-indigo-600" />
                  <div className="absolute w-5 h-5 pointer-events-none hidden peer-checked:flex items-center justify-center text-white">
                     <ArrowRight className="w-3 h-3 -rotate-45" />
                  </div>
               </div>
              <label htmlFor="remember" className="text-xs font-semibold text-slate-400 hover:text-slate-300 transition-colors select-none cursor-pointer">Keep me signed in</label>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5 rounded-2xl transition-all duration-300 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 group active:scale-[0.98] text-sm cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-sm font-medium text-slate-500">
              Don't have an account? 
              <Link to="/signup" className="text-indigo-400 font-semibold hover:text-white ml-2 transition-colors">Sign Up</Link>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
