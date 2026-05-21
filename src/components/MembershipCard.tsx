import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Zap, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { formatDate } from '../lib/utils';

const MembershipCard: React.FC = () => {
  const { user } = useAuth();
  const isPremium = user?.membershipExpiredAt && new Date(user.membershipExpiredAt) > new Date();
  const isExpired = user?.membershipExpiredAt && new Date(user.membershipExpiredAt) <= new Date();
  const isPending = user?.membership === 'PENDING';

  if (isPremium) {
    return (
      <div className="bg-slate-900 border border-amber-500/20 p-10 rounded-[3rem] flex flex-col justify-between min-h-[300px] relative overflow-hidden group shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          className="absolute top-0 right-0 p-8"
        >
          <Crown className="w-32 h-32 text-amber-500" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Crown className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Signature Elite</span>
          </div>
          <h3 className="text-3xl sm:text-4xl font-display font-black text-white uppercase italic leading-[1.1] tracking-tighter">
            VIP Pass <br/> Activated
          </h3>
          <div className="mt-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Renewal: {user.membershipExpiredAt ? formatDate(user.membershipExpiredAt) : 'N/A'}
            </p>
          </div>
        </div>

        <Link 
          to="/membership" 
          className="mt-10 flex items-center justify-between p-5 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-amber-950 border border-amber-500/20 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all relative z-10"
        >
          Manage Access <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="bg-slate-900 border border-rose-500/20 p-10 rounded-[3rem] flex flex-col justify-between min-h-[300px] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Clock className="w-32 h-32 text-rose-500" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-rose-500" />
            </div>
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">Service Interrupted</span>
          </div>
          <h3 className="text-3xl font-display font-black text-white uppercase italic leading-[1.1] tracking-tighter">
            Access <br/> Restricted
          </h3>
          <p className="text-[10px] font-black text-rose-400/60 uppercase tracking-[0.2em] mt-6">
            Restore your premium status today
          </p>
        </div>

        <Link 
          to="/membership" 
          className="mt-10 flex items-center justify-between p-5 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-600/20 transition-all active:scale-95 relative z-10"
        >
          Renew Account <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-10 rounded-[3rem] flex flex-col justify-between min-h-[300px] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Zap className="w-32 h-32" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Validation Phase</span>
          </div>
          <h3 className="text-3xl font-display font-black text-slate-900 dark:text-white uppercase italic leading-[1.1] tracking-tighter">
            Identity <br/> Verification
          </h3>
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-6">
            Our curators are reviewing your request
          </p>
        </div>

        <Link 
          to="/membership" 
          className="mt-10 flex items-center justify-between p-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl group transition-all active:scale-95 relative z-10"
        >
          Check Timeline <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-indigo-600 p-10 rounded-[3rem] flex flex-col justify-between min-h-[300px] relative overflow-hidden group shadow-[0_30px_60px_-15px_rgba(79,70,229,0.4)]">
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
        <Crown className="w-40 h-40 text-white" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6 text-white/80">
          <Zap className="w-5 h-5 text-amber-300" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Member Privilege</span>
        </div>
        <h3 className="text-3xl sm:text-4xl font-display font-black text-white uppercase italic leading-[0.95] tracking-tighter">
          Unlock Elite <br/> Access & Passes
        </h3>
      </div>

      <Link 
        to="/membership" 
        className="mt-10 flex items-center justify-between p-5 bg-white text-indigo-600 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 hover:bg-slate-900 hover:text-white relative z-10"
      >
        Go Premium <ArrowRight className="w-5 h-5" />
      </Link>
    </div>
  );
};

export default MembershipCard;
