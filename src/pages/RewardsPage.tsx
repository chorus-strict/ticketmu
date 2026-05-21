import { useEffect } from 'react';
import { 
  Star, 
  ChevronLeft, 
  ArrowRight, 
  Gift, 
  Lock, 
  History,
  Timer,
  ShoppingBag,
  Ticket as TicketIcon,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useManagement } from '../contexts/ManagementContext';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/layout/Layout';
import { formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function RewardsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    userPoints, 
    rewards, 
    myRewards,
    pointLogs, 
    fetchRewards, 
    fetchMyRewards,
    fetchPointLogs, 
    redeemReward,
    isLoading 
  } = useManagement();

  useEffect(() => {
    fetchRewards();
    fetchMyRewards();
    fetchPointLogs();
  }, [fetchRewards, fetchMyRewards, fetchPointLogs]);

  const handleRedeem = (reward: any) => {
    if (userPoints < reward.pointsRequired) return;
    if (window.confirm(`Redeem "${reward.title}" for ${reward.pointsRequired} points?`)) {
       redeemReward(reward.id);
    }
  };

  const myVouchers = (myRewards || []).filter(r => !r.isUsed);
  const usedHistory = (myRewards || []).filter(r => r.isUsed);

  return (
    <Layout>
      <main className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 py-12 lg:py-24">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-20">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => navigate(-1)}
              className="w-16 h-16 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all active:scale-90 group"
            >
              <ChevronLeft className="w-8 h-8 text-slate-300 group-hover:text-white transition-colors" />
            </button>
            <div className="relative">
              <div className="absolute -top-10 -left-6 w-24 h-24 bg-indigo-600/10 blur-3xl rounded-full"></div>
              <h1 className="text-5xl lg:text-6xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Rewards Hub</h1>
              <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mt-6 italic opacity-60">Architecting value through engagement</p>
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-slate-950 text-white p-10 lg:p-12 rounded-[3.5rem] border border-white/5 flex items-center gap-10 relative overflow-hidden group shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
             <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 blur-[100px] rounded-full"></div>
             <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl transform group-hover:rotate-12 transition-all duration-700">
                <Star className="w-10 h-10 text-white fill-white" />
             </div>
             <div className="relative z-10">
                <div className="flex items-baseline gap-3 mb-2">
                   <span className="text-5xl font-display font-black leading-none tracking-tighter">{userPoints}</span>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 italic">Total Balance</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">Earning Protocol: 1 Point / Acquisition</p>
                </div>
             </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
          
          {/* Rewards Grid (8 cols) */}
          <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-16">
             
             {/* My Active Vouchers */}
             {myVouchers.length > 0 && (
               <div>
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-1 h-8 bg-indigo-600 rounded-full"></div>
                    <TicketIcon className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Active Transmissions</h2>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-10">
                    {myVouchers.map((v) => (
                      <div key={v.id} className="relative bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-900 rounded-[3.5rem] p-12 text-white overflow-hidden group shadow-[0_50px_100px_-20px_rgba(79,70,229,0.4)] hover:scale-[1.02] transition-all duration-700">
                        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-150 transition-transform duration-1000">
                           <TicketIcon className="w-32 h-32" />
                        </div>
                        <div className="relative z-10">
                           <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-3 leading-none">Security Node Voucher</div>
                           <h3 className="text-3xl font-display font-black uppercase italic mb-6 leading-tight tracking-tighter">{v.reward.title}</h3>
                           <div className="flex items-baseline gap-4 mb-10">
                              <span className="text-5xl font-display font-black leading-none tracking-tighter shadow-sm">Rp {v.value.toLocaleString()}</span>
                              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 italic">Reduction</span>
                           </div>
                           <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 flex items-center justify-between group-hover:bg-white/20 transition-all">
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] block mb-1">Clearing Code</span>
                                <span className="text-xs font-mono font-black tracking-[0.2em] opacity-60">AUTOMATIC AT CHECKOUT</span>
                              </div>
                              <CheckCircle className="w-6 h-6 text-indigo-300" />
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
             )}

             <div>
                <div className="flex items-center gap-4 mb-10">
                   <div className="w-1 h-8 bg-indigo-600 rounded-full"></div>
                   <Gift className="w-6 h-6 text-indigo-600" />
                   <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Available Strategic Perks</h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-10">
                   {rewards.length > 0 ? (
                     rewards.map((reward) => {
                       const canRedeem = userPoints >= reward.pointsRequired && reward.stock > 0;
                       return (
                         <div 
                           key={reward.id} 
                           className={`bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 lg:p-12 border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col transition-all duration-500 relative group h-full ${
                             !canRedeem ? 'opacity-80 grayscale-[0.5]' : 'hover:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] hover:-translate-y-2'
                           }`}
                         >
                            <div className="absolute top-10 right-10">
                               <div className={`py-2 px-6 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] border ${reward.stock > 0 ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/5 text-rose-500 border-rose-500/20 shadow-2xl'}`}>
                                 {reward.stock > 0 ? `${reward.stock} AVAILABLE` : 'DEPLETED'}
                               </div>
                            </div>

                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 rounded-[2rem] flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner border border-slate-100 dark:border-slate-800">
                               {reward.type === 'DISCOUNT' ? <TicketIcon className="w-9 h-9 transition-colors" /> : <ShoppingBag className="w-9 h-9 transition-colors" />}
                            </div>

                            <div className="flex-1">
                               <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] bg-indigo-600/5 px-5 py-2 rounded-xl mb-6 inline-block border border-indigo-600/10 italic">
                                  {reward.type} PROT
                               </span>
                               <h3 className="text-2xl font-display font-black text-slate-900 dark:text-white uppercase italic leading-tight mb-4 tracking-tighter">
                                  {reward.title}
                               </h3>
                               <div className="flex items-center gap-3 text-slate-400 mb-10">
                                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                  <span className="text-[11px] font-black uppercase tracking-[0.2em] italic opacity-60">{reward.pointsRequired} Intel Points Required</span>
                                </div>
                            </div>

                            <button 
                               onClick={() => handleRedeem(reward)}
                               disabled={!canRedeem || isLoading}
                               className={`w-full py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all duration-500 shadow-2xl ${
                                 canRedeem 
                                 ? 'bg-slate-950 dark:bg-indigo-600 text-white shadow-indigo-600/30 hover:bg-indigo-600 dark:hover:bg-white dark:hover:text-slate-900 active:scale-95 group-hover:translate-x-1' 
                                 : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed border border-slate-100 dark:border-slate-800'
                               }`}
                            >
                               {isLoading ? 'Clearing...' : canRedeem ? 'Authorize Redeem' : (reward.stock <= 0 ? 'Out of Supply' : 'Insufficient Intel')}
                               {canRedeem && !isLoading && <ArrowRight className="w-4 h-4" />}
                            </button>
                         </div>
                       );
                     })
                   ) : (
                     <div className="col-span-full py-32 bg-slate-50 dark:bg-slate-950 rounded-[4rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center shadow-inner">
                        <Lock className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-8" />
                        <p className="text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em] italic opacity-60">Locked Protocol: No active rewards detected</p>
                     </div>
                   )}
                </div>
             </div>
          </div>

          {/* Activity Log (4 cols) */}
          <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-12 self-start xl:sticky xl:top-32">
             <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-12 lg:p-14 border border-slate-100 dark:border-slate-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)]">
                <div className="flex items-center gap-4 mb-12">
                   <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
                   <History className="w-6 h-6 text-indigo-600" />
                   <h2 className="text-xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Strategy Ledger</h2>
                </div>

                <div className="space-y-10">
                   {pointLogs.length > 0 || usedHistory.length > 0 ? (
                     <div className="space-y-10">
                        {pointLogs.map((log) => (
                          <div key={log.id} className="flex gap-6 group">
                             <div className={`flex-none w-12 h-12 rounded-[1.2rem] flex items-center justify-center shadow-inner border ${
                                log.type === 'EARN' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' : 'bg-rose-500/5 text-rose-500 border-rose-500/10'
                             }`}>
                                {log.type === 'EARN' ? <TrendingUp className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-4 mb-1">
                                   <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate italic group-hover:text-indigo-600 transition-colors">{log.description}</p>
                                   <span className={`text-sm font-display font-black italic tracking-tighter ${log.type === 'EARN' ? 'text-emerald-500' : 'text-rose-600'}`}>
                                      {log.type === 'EARN' ? '+' : '-'}{log.points}
                                   </span>
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-40">{formatDate(log.createdAt)} • NODE {log.id.slice(-4).toUpperCase()}</p>
                             </div>
                          </div>
                        ))}
                        {usedHistory.map((v) => (
                          <div key={v.id} className="flex gap-6 group opacity-40 italic">
                             <div className="flex-none w-12 h-12 bg-slate-50 dark:bg-slate-950 text-slate-300 rounded-[1.2rem] flex items-center justify-center shadow-inner border border-slate-100 dark:border-slate-800">
                                <CheckCircle className="w-5 h-5" />
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-4 mb-1">
                                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-tight truncate">CLEARED: {v.reward.title}</p>
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">NOMINAL</span>
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-40">Executed on {formatDate(v.createdAt)}</p>
                             </div>
                          </div>
                        ))}
                     </div>
                   ) : (
                     <div className="py-20 text-center">
                        <Clock className="w-12 h-12 text-slate-100 dark:text-slate-950 mx-auto mb-6 shadow-inner rounded-full p-2" />
                        <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.4em] italic leading-none">No active records detected</p>
                     </div>
                   )}
                </div>
             </div>

             <div className="bg-amber-600/5 dark:bg-amber-900/10 p-12 lg:p-14 rounded-[3.5rem] border border-amber-600/10 dark:border-amber-900/40 relative overflow-hidden group">
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-600/5 blur-[40px] rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
                <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-[1.5rem] flex items-center justify-center mb-10 shadow-xl border border-amber-500/20 group-hover:rotate-12 transition-all">
                   <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
                </div>
                <h3 className="text-2xl font-display font-black text-amber-900 dark:text-amber-100 uppercase italic leading-none mb-10 tracking-tighter">Engagement Directives</h3>
                <ul className="space-y-10">
                   <li className="flex gap-5 group/item">
                      <div className="w-10 h-10 rounded-full border-2 border-amber-500/20 flex items-center justify-center flex-shrink-0 group-hover/item:border-amber-500 transition-colors">
                        <CheckCircle className="w-5 h-5 text-amber-500" />
                      </div>
                      <p className="text-[11px] font-black text-amber-800/60 dark:text-amber-200/50 uppercase tracking-[0.2em] leading-relaxed italic">
                        Points are bound to account index. Zero direct liquidation protocol in effect.
                      </p>
                   </li>
                   <li className="flex gap-5 group/item">
                      <div className="w-10 h-10 rounded-full border-2 border-amber-500/20 flex items-center justify-center flex-shrink-0 group-hover/item:border-amber-500 transition-colors">
                        <CheckCircle className="w-5 h-5 text-amber-500" />
                      </div>
                      <p className="text-[11px] font-black text-amber-800/60 dark:text-amber-200/50 uppercase tracking-[0.2em] leading-relaxed italic">
                        Authentication required for all redemption cycles. Voucher issuance is final.
                      </p>
                   </li>
                   <li className="flex gap-5 group/item">
                      <div className="w-10 h-10 rounded-full border-2 border-amber-500/20 flex items-center justify-center flex-shrink-0 group-hover/item:border-amber-500 transition-colors">
                        <Clock className="w-5 h-5 text-amber-500" />
                      </div>
                      <p className="text-[11px] font-black text-amber-800/60 dark:text-amber-200/50 uppercase tracking-[0.2em] leading-relaxed italic">
                        Node inactivity for 90 cycles results in total point decay. Maintain engagement level.
                      </p>
                   </li>
                </ul>
             </div>
          </div>

        </div>
      </main>
    </Layout>
  );
}

function TrendingUp(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
