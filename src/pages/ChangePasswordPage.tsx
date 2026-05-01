import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { t } = useSettings();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      navigate(-1);
    }, 1500);
  };

  return (
    <div className="bg-surface dark:bg-dark-surface min-h-screen pb-10 transition-colors duration-300">
      <header className="nav-blur sticky top-0 z-50 h-16 flex items-center px-5 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-900 dark:text-white" />
        </button>
        <h1 className="ml-4 text-lg font-display font-bold text-slate-900 dark:text-white uppercase">{t('account.change_password')}</h1>
      </header>

      <main className="max-w-lg mx-auto p-5">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Current Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors h-5 w-5" />
              <input 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 rounded-xl py-4 pl-12 pr-12 font-medium transition-all outline-none text-slate-900 dark:text-white" 
                placeholder="Current Password" 
                type={showPass.current ? "text" : "password"}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPass(prev => ({ ...prev, current: !prev.current }))}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {showPass.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">New Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors h-5 w-5" />
              <input 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 rounded-xl py-4 pl-12 pr-12 font-medium transition-all outline-none text-slate-900 dark:text-white" 
                placeholder="Min. 8 characters" 
                type={showPass.new ? "text" : "password"}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPass(prev => ({ ...prev, new: !prev.new }))}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {showPass.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Confirm New Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors h-5 w-5" />
              <input 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 rounded-xl py-4 pl-12 pr-12 font-medium transition-all outline-none text-slate-900 dark:text-white" 
                placeholder="Repeat new password" 
                type={showPass.confirm ? "text" : "password"}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPass(prev => ({ ...prev, confirm: !prev.confirm }))}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {showPass.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs font-bold text-red-500 ml-1">{error}</p>}

          <div className="pt-6">
            <button 
              type="submit"
              disabled={isSubmitting || !newPassword || !confirmPassword || !currentPassword}
              className={`w-full py-4.5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg ${
                showSuccess 
                  ? 'bg-green-600 shadow-green-600/20 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 text-white disabled:bg-indigo-600/50'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : showSuccess ? (
                <>
                  <Check className="h-5 w-5" />
                  <span>Password Updated</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
