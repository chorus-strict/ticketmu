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

  const myVouchers = myRewards.filter(r => !r.isUsed);
  const usedHistory = myRewards.filter(r => r.isUsed);

  return (
    <Layout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:translate-x-1 transition-transform"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div>
              <h1 className="text-3xl font-display font-extrabold text-slate-900 dark:text-white uppercase italic tracking-tighter">Rewards Hub</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Redeem points for vouchers & discounts</p>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] border border-white/5 flex items-center gap-6 relative overflow-hidden group shadow-2xl">
             <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/20 blur-3xl rounded-full"></div>
             <div className="w-14 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform">
                <Star className="w-8 h-8 text-white fill-white" />
             </div>
             <div>
                <div className="flex items-baseline gap-2">
                   <span className="text-3xl font-display font-black leading-none">{userPoints}</span>
                   <span className="text-[8px] font-black uppercase tracking-[0.3em] text-indigo-400">Total Balance</span>
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                   <Clock className="w-3 h-3" /> Earning: 1 Point/Ticket
                </p>
             </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-10">
          
          {/* Rewards Grid (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-10">
             
             {/* My Active Vouchers */}
             {myVouchers.length > 0 && (
               <div>
                  <div className="flex items-center gap-3 mb-6">
                    <TicketIcon className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-xl font-display font-extrabold uppercase italic tracking-tight">My Active Vouchers</h2>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {myVouchers.map((v) => (
                      <div key={v.id} className="relative bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 text-white overflow-hidden group shadow-xl">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform">
                           <TicketIcon className="w-20 h-20" />
                        </div>
                        <div className="relative z-10">
                           <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">Claimable Discount</div>
                           <h3 className="text-2xl font-display font-black uppercase italic mb-4 leading-tight">{v.reward.title}</h3>
                           <div className="flex items-center gap-2 mb-6">
                              <span className="text-4xl font-display font-black leading-none tracking-tighter">Rp {v.value.toLocaleString()}</span>
                              <span className="text-[10px] font-bold uppercase opacity-60">Off</span>
                           </div>
                           <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-widest">Show At Checkout</span>
                              <CheckCircle className="w-4 h-4" />
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
             )}

             <div>
                <div className="flex items-center gap-3 mb-6">
                   <Gift className="w-5 h-5 text-indigo-600" />
                   <h2 className="text-xl font-display font-extrabold uppercase italic tracking-tight">Redeem New Perks</h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                   {rewards.length > 0 ? (
                     rewards.map((reward) => {
                       const canRedeem = userPoints >= reward.pointsRequired && reward.stock > 0;
                       return (
                         <div 
                           key={reward.id} 
                           className={`bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col transition-all relative group h-full ${
                             !canRedeem ? 'opacity-80' : 'hover:border-indigo-400 dark:hover:border-indigo-800'
                           }`}
                         >
                            <div className="absolute top-6 right-6">
                               <div className={`p-3 rounded-2xl ${reward.stock > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} text-[10px] font-black uppercase tracking-widest px-4`}>
                                 {reward.stock > 0 ? `${reward.stock} Left` : 'Out of Stock'}
                               </div>
                            </div>

                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                               {reward.type === 'DISCOUNT' ? <TicketIcon className="w-7 h-7 text-indigo-600" /> : <ShoppingBag className="w-7 h-7 text-indigo-600" />}
                            </div>

                            <div className="flex-1">
                               <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full mb-3 inline-block">
                                  {reward.type}
                               </span>
                               <h3 className="text-xl font-display font-extrabold text-slate-900 dark:text-white uppercase italic leading-tight mb-2">
                                  {reward.title}
                               </h3>
                               <div className="flex items-center gap-2 text-slate-400 mb-6">
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                  <span className="text-xs font-bold">{reward.pointsRequired} Points Required</span>
                               </div>
                            </div>

                            <button 
                               onClick={() => handleRedeem(reward)}
                               disabled={!canRedeem || isLoading}
                               className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                 canRedeem 
                                 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 active:scale-95 hover:bg-slate-900' 
                                 : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                               }`}
                            >
                               {isLoading ? 'Redeeming...' : canRedeem ? 'Redeem Item' : (reward.stock <= 0 ? 'Out of Stock' : 'Not Enough Points')}
                               {canRedeem && !isLoading && <ArrowRight className="w-3.5 h-3.5" />}
                            </button>
                         </div>
                       );
                     })
                   ) : (
                     <div className="col-span-full py-20 bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                        <Lock className="w-12 h-12 text-slate-300 mb-4" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">No rewards active at the moment</p>
                     </div>
                   )}
                </div>
             </div>
          </div>

          {/* Activity Log (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-10 self-start sticky top-28">
             <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                   <History className="w-5 h-5 text-indigo-600" />
                   <h2 className="text-lg font-display font-bold uppercase italic tracking-tight">Point & Voucher History</h2>
                </div>

                <div className="space-y-6">
                   {pointLogs.length > 0 || usedHistory.length > 0 ? (
                     <div className="space-y-6">
                        {pointLogs.map((log) => (
                          <div key={log.id} className="flex gap-4 group">
                             <div className={`flex-none w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
                                log.type === 'EARN' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                             }`}>
                                {log.type === 'EARN' ? <TrendingUp className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                   <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{log.description}</p>
                                   <span className={`text-[10px] font-black ${log.type === 'EARN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {log.type === 'EARN' ? '+' : '-'}{log.points}
                                   </span>
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{formatDate(log.createdAt)}</p>
                             </div>
                          </div>
                        ))}
                        {usedHistory.map((v) => (
                          <div key={v.id} className="flex gap-4 group opacity-60 italic">
                             <div className="flex-none w-10 h-10 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center shadow-sm">
                                <CheckCircle className="w-4 h-4" />
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight truncate">Used: {v.reward.title}</p>
                                   <span className="text-[10px] font-black text-slate-400">Voucher</span>
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Redeemed on {formatDate(v.createdAt)}</p>
                             </div>
                          </div>
                        ))}
                     </div>
                   ) : (
                     <div className="py-10 text-center">
                        <Clock className="w-8 h-8 text-slate-200 mx-auto mb-4" />
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">No activity yet</p>
                     </div>
                   )}
                </div>
             </div>

             <div className="bg-amber-50 dark:bg-amber-900/10 p-10 rounded-[3rem] border border-amber-100 dark:border-amber-900/30">
                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                   <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                </div>
                <h3 className="text-lg font-display font-extrabold text-amber-900 dark:text-amber-100 uppercase italic leading-tight mb-3">Redemption Rules</h3>
                <ul className="space-y-4">
                   <li className="flex gap-3">
                      <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <p className="text-[10px] font-bold text-amber-800/70 dark:text-amber-200/70 uppercase tracking-widest leading-relaxed">
                        Points are non-transferable and can't be cashed out directly.
                      </p>
                   </li>
                   <li className="flex gap-3">
                      <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <p className="text-[10px] font-bold text-amber-800/70 dark:text-amber-200/70 uppercase tracking-widest leading-relaxed">
                        Successful redemptions will issue a digital code/voucher.
                      </p>
                   </li>
                   <li className="flex gap-3">
                      <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <p className="text-[10px] font-bold text-amber-800/70 dark:text-amber-200/70 uppercase tracking-widest leading-relaxed">
                        Points expire after 90 days of inactivity.
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
