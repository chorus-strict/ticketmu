import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ArrowRight, ChevronLeft, Ticket, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Invalid or expired password reset token.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('All password fields are required.');
      return;
    }

    if (password.length < 8) {
      setError('New security cipher must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      toast.success('Credential override complete!');
      setIsDone(true);
    } catch (err: any) {
      console.error('Reset password failure:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Credential override validation failed.';
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
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-none mb-4">Reset <span className="text-indigo-500">Password</span></h2>
          <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-md mx-auto">Choose a strong, secure new password to update your account access.</p>
        </motion.div>

        {!token && (
          <motion.div 
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="mb-8 p-6 bg-rose-600/5 border border-rose-600/20 rounded-2xl flex items-start gap-4"
          >
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-500 uppercase tracking-widest leading-none">Missing Reset Token</p>
              <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">Please request a password reset link again to acquire a valid reset session.</p>
            </div>
          </motion.div>
        )}

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
          {!isDone ? (
            <motion.form 
              key="reset-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors h-5 w-5" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={!token}
                    className="w-full pl-16 pr-16 py-5 bg-slate-900/50 border border-slate-800 rounded-2xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium text-sm placeholder:text-slate-600 disabled:opacity-50" 
                    placeholder="Min. 8 characters" 
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

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors h-5 w-5" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={!token}
                    className="w-full pl-16 pr-16 py-5 bg-slate-900/50 border border-slate-800 rounded-2xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium text-sm placeholder:text-slate-600 disabled:opacity-50" 
                    placeholder="Confirm new password" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || !token}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5 rounded-2xl transition-all duration-300 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 group active:scale-[0.98] text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
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
                  <CheckCircle className="w-8 h-8 text-indigo-400 rotate-in" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">Password Updated</h3>
                  <p className="text-xs text-indigo-300 font-medium tracking-wide mt-2 px-4 leading-relaxed">
                    Your password has been reset successfully. You can now log in with your updated credentials.
                  </p>
                </div>
              </div>

              <Link 
                to="/login"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5 rounded-2xl transition-all duration-300 shadow-lg shadow-indigo-600/30 flex items-center justify-center text-sm cursor-pointer"
              >
                Back to Login
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
