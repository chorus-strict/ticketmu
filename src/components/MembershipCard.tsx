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
      <div className="bg-slate-900 border border-amber-500/30 p-8 rounded-[2.5rem] flex flex-col justify-between h-1/2 relative overflow-hidden group shadow-2xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.2, scale: 1 }}
          className="absolute top-0 right-0 p-8"
        >
          <Crown className="w-24 h-24 text-amber-500" />
        </motion.div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-amber-500" />
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Premium Active</span>
          </div>
          <h3 className="text-2xl font-display font-extrabold text-white uppercase italic leading-tight">
            VIP Pass <br/> Activated
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
            Valid until: {user.membershipExpiredAt ? formatDate(user.membershipExpiredAt) : 'N/A'}
          </p>
        </div>

        <Link 
          to="/membership" 
          className="mt-8 flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] group hover:text-white transition-colors"
        >
          Extend Membership <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="bg-rose-950 border border-rose-500/30 p-8 rounded-[2.5rem] flex flex-col justify-between h-1/2 relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Clock className="w-24 h-24 text-rose-500" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-rose-500" />
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Membership Expired</span>
          </div>
          <h3 className="text-2xl font-display font-extrabold text-white uppercase italic leading-tight">
            Access <br/> Restricted
          </h3>
          <p className="text-[10px] font-bold text-rose-400/60 uppercase tracking-widest mt-4">
            Renew to regain your VIP status
          </p>
        </div>

        <Link 
          to="/membership" 
          className="mt-8 flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] group hover:text-white transition-colors"
        >
          Renew Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 p-8 rounded-[2.5rem] flex flex-col justify-between h-1/2 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Clock className="w-24 h-24" />
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Pending Approval</span>
          </div>
          <h3 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white uppercase italic leading-tight">
            Verification <br/> in Progress
          </h3>
        </div>

        <Link 
          to="/membership" 
          className="mt-8 bg-amber-600 text-white w-fit px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-600/20 active:scale-95 transition-all"
        >
          Check Status
        </Link>
      </div>
    );
  }

  return (
    <div className="premium-gradient p-8 rounded-[2.5rem] flex flex-col justify-between h-1/2 relative overflow-hidden group shadow-xl">
      <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform">
        <Crown className="w-24 h-24 outline-none" />
      </div>
      
      <div>
        <div className="flex items-center gap-2 mb-4 text-white">
          <Zap className="w-5 h-5 text-amber-300" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Standard Tier</span>
        </div>
        <h3 className="text-2xl font-display font-extrabold text-white uppercase italic leading-tight">
          Upgrade to Premium <br/> for Early Access
        </h3>
      </div>

      <Link 
        to="/membership" 
        className="mt-8 bg-white text-indigo-600 w-fit px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-slate-50"
      >
        Upgrade Now
      </Link>
    </div>
  );
};

export default MembershipCard;
