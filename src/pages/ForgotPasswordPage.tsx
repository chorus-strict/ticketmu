import React, { useState } from 'react';
import { Mail, ArrowRight, ChevronLeft, Ticket, Loader2, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ resetUrl: string; simulatedEmail: any } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessResult(null);

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await forgotPassword(email);
      toast.success('Reset link dispatched successfully');
      setSuccessResult(data);
    } catch (err: any) {
      console.error('Forgot password fail:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to dispatch reset link.';
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
          <span className="font-black text-white tracking-widest uppercase italic text-lg lg:text-xl">Tiketmu</span>
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
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-none mb-4">Reset <span className="text-indigo-550">Password</span></h2>
          <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-md mx-auto">Forgot your password? Enter your email address below and we'll help you configure a new one instantly.</p>
        </motion.div>

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

        <AnimatePresence mode="wait">
          {!successResult ? (
            <motion.form 
              key="forgot-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors h-5 w-5" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-16 pr-6 py-5 bg-slate-900/50 border border-slate-800 rounded-2xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium text-sm placeholder:text-slate-600" 
                    placeholder="you@example.com" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5 rounded-2xl transition-all duration-300 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 group active:scale-[0.98] text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.div 
              key="success-container"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="p-8 bg-indigo-950/25 border border-indigo-900/40 rounded-3xl flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <CheckCircle className="w-8 h-8 text-indigo-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">Reset Link Dispatched</h3>
                  <p className="text-xs text-indigo-300 font-medium tracking-wide mt-2 px-4 leading-relaxed">
                    A secure password recovery hyperlink has been dispatched to {email}.
                  </p>
                </div>
              </div>

              {/* Developer simulated email bypass - extremely professional for preview */}
              <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-3xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Simulated Email Sandbox</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase">PREVIEW BROWSER</span>
                </div>
                
                <p className="text-xs text-slate-400 font-medium tracking-wide leading-relaxed">
                  Since actual outbound SMTP is disabled in this sandboxed environment, click the direct reset simulation link below to override credentials instantly:
                </p>

                <div className="p-4 bg-indigo-950/30 border border-indigo-900/50 rounded-2xl flex items-center justify-between gap-4 hover:border-indigo-600 transition-colors">
                  <div className="truncate flex-1">
                    <span className="text-[9px] font-bold tracking-widest uppercase text-indigo-400 block mb-1">RESET LINK</span>
                    <span className="text-xs text-indigo-200 font-mono block truncate">{successResult.resetUrl}</span>
                  </div>
                  <button 
                    onClick={() => window.location.href = successResult.resetUrl}
                    className="h-10 px-4 bg-indigo-600 hover:bg-slate-900 hover:text-white text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <span>Reset Now</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-center pt-4">
                <Link to="/login" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
                  Back to Login
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
