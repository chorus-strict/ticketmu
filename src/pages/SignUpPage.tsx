import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Apple, ChevronLeft, Ticket, Loader2, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Dynamic, interactive validation for global SaaS standard
    if (!name.trim()) {
      setError('Please enter your Full Name.');
      return;
    }

    if (!email) {
      setError('Please enter your Email Address.');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter a Password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!agreedTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy to create your account.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(name, email, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen flex flex-col items-center relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 right-0 -z-10 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[150px] opacity-50"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-[800px] h-[800px] bg-slate-900/40 rounded-full blur-[130px] opacity-30"></div>

      {/* Top Bar Navigation */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-3xl border-b border-slate-900 flex items-center justify-between px-6 sm:px-10 h-24"
      >
        <Link to="/login" className="w-14 h-14 flex items-center justify-center rounded-2xl hover:bg-slate-900 border border-slate-900 transition-all active:scale-90 group text-slate-400 hover:text-white">
          <ChevronLeft className="h-7 w-7 group-hover:-translate-x-1 transition-transform" />
        </Link>
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20">
            <Ticket className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-white tracking-widest uppercase italic text-lg lg:text-xl">Tiketmu</span>
        </div>
        <div className="w-14"></div>
      </motion.header>

      <main className="flex-grow pt-40 pb-32 px-6 max-w-lg mx-auto w-full z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-none mb-4">Create <span className="text-indigo-500">Account</span></h2>
          <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-md mx-auto">Join Tiketmu today. Explore premium events, unlock exclusive member benefits, and secure your tickets with ease.</p>
        </motion.div>

        {error && (
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="mb-10 p-6 bg-rose-600/5 border border-rose-600/20 rounded-[2rem] flex items-start gap-4"
          >
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-rose-500 tracking-wide leading-relaxed">{error}</p>
          </motion.div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2" htmlFor="full_name">Full Name</label>
            <div className="relative group">
              <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors h-5 w-5" />
              <input 
                id="full_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-2xl py-5 pl-16 pr-6 font-medium text-sm transition-all text-white outline-none placeholder:text-slate-600" 
                placeholder="Enter your full name" 
                type="text"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2" htmlFor="email">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors h-5 w-5" />
              <input 
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-2xl py-5 pl-16 pr-6 font-medium text-sm transition-all text-white outline-none placeholder:text-slate-600" 
                placeholder="you@example.com" 
                type="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2" htmlFor="password">Password</label>
            <div className="relative group">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors h-5 w-5" />
              <input 
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-2xl py-5 pl-16 pr-16 font-medium text-sm transition-all text-white outline-none placeholder:text-slate-600" 
                placeholder="At least 6 characters" 
                type={showPassword ? "text" : "password"}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-4 px-2 pt-2">
             <div className="relative flex items-center shrink-0">
                <input 
                  id="terms" 
                  type="checkbox" 
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="peer w-5 h-5 rounded-md bg-slate-900 border-2 border-slate-800 text-indigo-500 focus:ring-0 transition-all cursor-pointer appearance-none checked:bg-indigo-600 checked:border-indigo-600" 
                />
                <div className="absolute w-5 h-5 pointer-events-none hidden peer-checked:flex items-center justify-center text-white">
                   <ArrowRight className="w-3 h-3 -rotate-45" />
                </div>
             </div>
            <label className="text-xs font-medium text-slate-400 cursor-pointer select-none" htmlFor="terms">
              I agree to the <span className="text-indigo-400 hover:underline">Terms of Service</span> and <span className="text-indigo-400 hover:underline">Privacy Policy</span>.
            </label>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-300 active:scale-[0.98] shadow-lg shadow-indigo-600/30 mt-6 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-12 py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-900"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <span className="bg-slate-950 px-6">Or register with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <button className="flex items-center justify-center gap-4 h-16 bg-slate-900/50 border border-slate-800 rounded-2xl active:scale-95 transition-all shadow-sm hover:border-slate-700 hover:bg-slate-900 group cursor-pointer">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFomCCujSelVExahfGgd3kann1DcEQTgM0psYlMAJ3nWtx4kzfJN77JYivHdABdvTpijSUIWXVVs8h3D8wsCjqBduaTBsxSnv83UUT6qgHjNvLRURvC32410FgJyQjrUyTbrZzPHsYw_h16W3QA0jPOLPC47gNrqYZgeyfXsECNHqgAWKvOlNRO30dftXbpJhHo3_P2c9qsv3z74SZGKQaSLHvlhKLcNhkacGO2ifJEKaC9oLks2GxGPCSU6apsu7reNJfDyylUGIK" alt="Google" className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-widest">Google</span>
          </button>
          <button className="flex items-center justify-center gap-4 h-16 bg-slate-900/50 border border-slate-800 rounded-2xl active:scale-95 transition-all shadow-sm hover:border-slate-700 hover:bg-slate-900 group cursor-pointer">
            <Apple className="h-5 w-5 text-slate-500 group-hover:text-white" />
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-widest">Apple</span>
          </button>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm font-medium text-slate-500">
            Already have an account? 
            <Link to="/login" className="text-indigo-400 font-semibold ml-2 hover:text-white transition-colors">Sign In</Link>
          </p>
        </div>
      </main>

      <div className="fixed top-0 right-0 -z-10 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-80 h-80 bg-slate-100 rounded-full blur-[100px] opacity-30"></div>
    </div>
  );
}
