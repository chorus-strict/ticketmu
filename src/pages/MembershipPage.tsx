import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  Sparkles, 
  Zap, 
  Shield, 
  Gift, 
  Loader2, 
  Clock, 
  X, 
  CreditCard, 
  ChevronDown, 
  CheckCircle2, 
  Wallet,
  Ticket as TicketIcon,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useManagement } from '../contexts/ManagementContext';
import Layout from '../components/layout/Layout';
import { formatCurrency, formatDate } from '../lib/utils';

export default function MembershipPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    myMembershipOrder, 
    requestMembershipUpgrade, 
    isLoading: isContextLoading, 
    paymentMethods,
    myRewards,
    fetchMyRewards
  } = useManagement();
  const { t } = useSettings();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [showPaymentSelection, setShowPaymentSelection] = useState(false);

  const activeMethods = paymentMethods.filter(m => m.status);

  useEffect(() => {
    if (user) {
      fetchMyRewards();
    }
  }, [user, fetchMyRewards]);

  useEffect(() => {
    if (activeMethods.length > 0 && !selectedPaymentMethodId) {
      setSelectedPaymentMethodId(activeMethods[0].id);
    }
  }, [activeMethods, selectedPaymentMethodId]);

  const availableVouchers = useMemo(() => (myRewards || []).filter(r => !r.isUsed), [myRewards]);
  const selectedVoucher = useMemo(() => availableVouchers.find(v => v.id === selectedRewardId), [availableVouchers, selectedRewardId]);
  
  const originalPrice = 50000;
  const discountAmount = selectedVoucher ? selectedVoucher.value : 0;
  const finalPrice = Math.max(0, originalPrice - discountAmount);

  const benefits = [
    { 
      title: 'Priority Booking', 
      desc: 'Get early access to tickets for high-demand events 24 hours before everyone else.',
      icon: <Zap className="w-5 h-5 text-amber-500" />
    },
    { 
      title: 'Exclusive Member Events', 
      desc: 'Access "Member Only" areas and secret events not visible to standard users.',
      icon: <Shield className="w-5 h-5 text-indigo-500" />
    },
    { 
      title: 'Premium Discounts', 
      desc: 'Enjoy a flat 10% discount on all service fees and special partner offers.',
      icon: <Gift className="w-5 h-5 text-rose-500" />
    }
  ];

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (activeMethods.length > 1 && !showPaymentSelection) {
      setShowPaymentSelection(true);
      return;
    }
    
    setIsUpgrading(true);
    try {
      const res = await requestMembershipUpgrade(selectedPaymentMethodId, selectedRewardId || undefined);
      if (res?.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        navigate('/membership/payment');
      }
    } catch (error) {
      console.error('Upgrade request failed:', error);
    } finally {
      setIsUpgrading(false);
    }
  };

  const isPending = user?.membership === 'PENDING';
  const isExpired = user?.membershipExpiredAt && new Date(user.membershipExpiredAt) <= new Date();
  const isPremium = user?.membershipExpiredAt && new Date(user.membershipExpiredAt) > new Date();

  return (
    <Layout>
      <main className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 py-12 lg:py-24">
        
        {/* HEADER SECTION */}
        <div className="text-center mb-16 lg:mb-24">
           {/* Status Badge */}
           <div className="flex justify-center mb-10 h-8">
             <AnimatePresence mode="wait">
               {isPremium ? (
                 <motion.span 
                   key="premium"
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black tracking-[0.3em] uppercase shadow-2xl shadow-emerald-600/30 flex items-center gap-3 border border-white/10"
                 >
                   <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]"></div>
                   Signature Elite Active
                 </motion.span>
               ) : isExpired ? (
                 <motion.span 
                   key="expired"
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className="px-6 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black tracking-[0.3em] uppercase shadow-2xl shadow-rose-600/30 flex items-center gap-3 border border-white/10"
                 >
                   <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                   Terminated Tier
                 </motion.span>
               ) : isPending ? (
                 <motion.span 
                   key="pending"
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className="px-6 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black tracking-[0.3em] uppercase shadow-2xl shadow-amber-500/30 flex items-center gap-3 border border-white/10"
                 >
                   <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                   Tactical Verification
                 </motion.span>
               ) : (
                 <motion.span 
                   key="free"
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className="px-6 py-2 bg-slate-100 dark:bg-slate-900 text-slate-400 rounded-xl text-[10px] font-black tracking-[0.3em] uppercase border border-slate-200 dark:border-slate-800"
                 >
                   Standard Access
                 </motion.span>
               )}
             </AnimatePresence>
           </div>
           
           <h1 className="text-4xl sm:text-6xl lg:text-8xl font-display font-black text-slate-900 dark:text-white uppercase italic leading-[0.9] tracking-tighter mb-8">
              The Membership <br className="hidden sm:block"/> <span className="text-indigo-600">Experience</span>
           </h1>
           <p className="max-w-2xl mx-auto text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-widest opacity-60 italic">
              Experience the pinnacle of event intelligence and priority luxury access.
           </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          
          {/* LEFT: BENEFITS & IDENTITY (8 columns on large) */}
          <div className="lg:col-span-12 xl:col-span-7 flex flex-col gap-12">
            
            {/* Current Status IDENTITY Card */}
            <div className={`p-12 sm:p-20 rounded-[3.5rem] relative overflow-hidden text-left shadow-2xl transition-all duration-1000 group ${
              isPremium ? 'bg-slate-900 border border-amber-500/30' : 
              isExpired ? 'bg-rose-950/20 border border-rose-500/20 backdrop-blur-md' : 'bg-indigo-600 border border-indigo-500/30 shadow-indigo-600/20'
            }`}>
              <Sparkles className={`absolute -right-8 -top-8 w-40 h-40 text-white opacity-10 rotate-12 transition-all duration-1000 group-hover:scale-125 group-hover:rotate-45 ${isPremium ? 'text-amber-500 opacity-20' : ''}`} />
              <div className="relative z-10">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-8 block leading-none">Identity Classification</span>
                <div className="flex flex-col gap-4">
                  <motion.h2 
                    layout
                    className="text-4xl sm:text-7xl font-display font-black uppercase italic tracking-tighter text-white leading-none"
                  >
                    {isPremium ? 'Elite Member' : isExpired ? 'Inactive' : isPending ? 'Pending' : 'Standard'}
                  </motion.h2>
                  {isPremium && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-3 w-fit"
                    >
                      <div className="h-[2px] w-12 bg-amber-400"></div>
                      <span className="text-[10px] font-black tracking-[0.3em] text-amber-400 uppercase">Authenticated VIP</span>
                    </motion.div>
                  )}
                </div>
                
                <div className="mt-12 sm:mt-24 flex flex-col sm:flex-row sm:items-end justify-between gap-8 pt-12 border-t border-white/10">
                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] leading-none mb-4">Account Status</p>
                      {isPremium && user?.membershipExpiredAt ? (
                        <p className="text-xl font-black text-amber-500 uppercase italic tracking-tighter leading-none">Active until {formatDate(user.membershipExpiredAt)}</p>
                      ) : isExpired ? (
                        <p className="text-xl font-black text-rose-500 uppercase italic tracking-tighter leading-none">Expired on {formatDate(user?.membershipExpiredAt || '')}</p>
                      ) : (
                        <p className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Limited Access Mode</p>
                      )}
                   </div>
                   <div className="flex -space-x-4">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="w-12 h-12 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden shadow-2xl ring-1 ring-white/10">
                           <div className={`w-full h-full bg-gradient-to-br from-indigo-500 to-slate-900 opacity-60`}></div>
                        </div>
                      ))}
                      <div className="w-12 h-12 rounded-full border-4 border-slate-900 bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white shadow-2xl relative z-10">
                         VIP
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Benefits Grid */}
            <section className="space-y-10">
              <div className="flex items-center gap-4">
                <div className="w-2 h-10 bg-indigo-600 rounded-full"></div>
                <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.4em] italic mb-1">
                  Exclusive Command & Control
                </h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                {benefits.map((benefit, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white dark:bg-slate-950 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col gap-8 group hover:border-indigo-500 transition-all shadow-xl hover:shadow-indigo-500/5"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center flex-none group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                      <div className="text-indigo-500 group-hover:text-white transition-colors">
                        {benefit.icon}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xl font-display font-black text-slate-900 dark:text-white mb-3 uppercase italic tracking-tight leading-none">{benefit.title}</h4>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{benefit.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT: DYNAMIC ACTION PANE (4 columns on large) */}
          <div className="lg:col-span-12 xl:col-span-5 sticky top-32 mb-12 lg:mb-0">
            <div className="overflow-hidden">
              <AnimatePresence mode="wait">
                {isPremium ? (
                  <motion.div 
                    key="premium-action"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="p-12 bg-emerald-50 dark:bg-emerald-950/20 rounded-[3.5rem] border border-emerald-200 dark:border-emerald-800/30 text-center space-y-8"
                  >
                    <div className="w-20 h-20 bg-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-emerald-500/40 rotate-3 border-2 border-white/20">
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-3xl text-emerald-950 dark:text-emerald-100 uppercase italic tracking-tighter mb-4 leading-none">Optimal Protocol</h4>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-black uppercase tracking-[0.2em] leading-relaxed opacity-60">
                        Full Elite Authorization active. <br/> Access granted across all terminal nodes.
                      </p>
                    </div>
                    <button 
                      onClick={handleUpgrade}
                      disabled={isUpgrading || isContextLoading}
                      className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-2xl hover:shadow-emerald-600/20"
                    >
                      {isUpgrading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                      Extend Strategy
                    </button>
                    <div className="pt-8 border-t border-emerald-200/50 dark:border-emerald-800/30">
                       <p className="text-[9px] font-black text-emerald-600/50 uppercase tracking-widest leading-none">Signature Elite Verified</p>
                    </div>
                  </motion.div>
                ) : isExpired ? (
                  <motion.div 
                    key="expired-action"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="p-12 bg-rose-50 dark:bg-rose-950/20 rounded-[3.5rem] border border-rose-200 dark:border-rose-800/30 text-center space-y-10 shadow-2xl"
                  >
                    <div className="w-20 h-20 bg-rose-600 rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-rose-500/40 border-2 border-white/20">
                      <X className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-3xl text-rose-950 dark:text-rose-100 uppercase italic tracking-tighter mb-4 leading-none">System Expired</h4>
                      <p className="text-[10px] text-rose-700 dark:text-rose-400 font-black uppercase tracking-[0.2em] leading-relaxed opacity-60">Authentication terminated. <br/> Renew to restore executive privileges.</p>
                    </div>
                    <button 
                      onClick={handleUpgrade}
                      disabled={isUpgrading || isContextLoading}
                      className="w-full py-6 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-rose-600/30 transition-all flex items-center justify-center gap-4"
                    >
                      {isUpgrading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                      Restore Activation
                    </button>
                  </motion.div>
                ) : isPending ? (
                  <motion.div 
                    key="pending-action"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="p-12 bg-amber-50 dark:bg-amber-950/10 rounded-[3.5rem] border border-amber-200 dark:border-amber-800/30 text-center space-y-10 shadow-2xl"
                  >
                    <div className="w-20 h-20 bg-amber-500 rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-amber-500/40 border-2 border-white/20 animate-pulse">
                      <Clock className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-3xl text-amber-950 dark:text-amber-100 uppercase italic tracking-tighter mb-4 leading-none">Awaiting Clearance</h4>
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 font-black uppercase tracking-[0.2em] leading-relaxed opacity-60">Verification in progress. <br/> Your credentials are being validated.</p>
                    </div>
                    <button 
                      onClick={() => navigate('/settings?tab=payments')}
                      className="w-full py-6 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center gap-4"
                    >
                      Audit Payment <ArrowRight className="w-5 h-5" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="free-action"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-10 sm:p-14 bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 space-y-10 text-center relative overflow-hidden group shadow-2xl"
                  >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-3xl -mr-24 -mt-24 rounded-full group-hover:bg-indigo-500/10 transition-all duration-1000"></div>
                    
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="inline-flex items-center gap-3 p-2 px-5 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl mb-10 border border-indigo-100 dark:border-indigo-800">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-blink shadow-[0_0_8px_rgb(79,70,229)]"></div>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-[0.3em]">Tier Upgrade Available</span>
                      </div>
                      
                      <div className="flex items-baseline justify-center gap-2 mb-4">
                        <span className={`text-4xl sm:text-7xl font-display font-black tracking-tighter italic ${discountAmount > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                          {formatCurrency(finalPrice)}
                        </span>
                        <span className="text-slate-400 font-black uppercase text-xs tracking-widest mt-1">/ Month</span>
                      </div>
                      
                      {discountAmount > 0 && (
                        <div className="px-5 py-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-xl">
                           <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] leading-none">
                             Tactical Discount: -{formatCurrency(discountAmount)} Applied
                           </p>
                        </div>
                      )}
                      
                      <p className="text-[10px] text-slate-400 font-black mt-8 uppercase tracking-[0.2em] opacity-40 leading-relaxed italic">
                         Strategic Entry • Full Network Deployment <br className="hidden sm:block"/> Admin Verified Protocols required.
                      </p>
                    </div>

                    <AnimatePresence>
                      {showPaymentSelection && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-8 pt-10 border-t border-slate-100 dark:border-slate-800 relative z-10"
                        >
                           {/* VOUCHER SELECTION */}
                           {availableVouchers.length > 0 && (
                              <div className="space-y-4">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-left ml-2 opacity-60">Redeem Incentives</p>
                                 <div className="grid grid-cols-1 gap-3 max-h-[160px] overflow-y-auto pr-3 custom-scrollbar">
                                    {availableVouchers.map(v => (
                                       <button
                                         key={v.id}
                                         onClick={() => setSelectedRewardId(selectedRewardId === v.id ? null : v.id)}
                                         type="button"
                                         className={`w-full p-5 rounded-2xl border flex items-center justify-between transition-all active:scale-[0.98] ${
                                           selectedRewardId === v.id 
                                             ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-indigo-600/5' 
                                             : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-indigo-400 group/v'
                                         }`}
                                       >
                                          <div className="flex items-center gap-5">
                                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                                                selectedRewardId === v.id ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                                             }`}>
                                                <TicketIcon className="w-5 h-5" />
                                             </div>
                                             <div className="text-left">
                                                <p className={`text-[11px] font-black uppercase italic tracking-tighter ${
                                                   selectedRewardId === v.id ? 'text-slate-900 dark:text-white' : 'text-slate-500'
                                                }`}>{v.reward.title}</p>
                                                <p className="text-[9px] font-black text-indigo-600/60 uppercase tracking-widest mt-1">Value: -{formatCurrency(v.value)}</p>
                                             </div>
                                          </div>
                                          {selectedRewardId === v.id && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                                       </button>
                                    ))}
                                 </div>
                              </div>
                           )}

                           {/* PAYMENT SELECTION */}
                           {activeMethods.length > 0 && (
                              <div className="space-y-4">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-left ml-2 opacity-60">Transactional Interface</p>
                                 <div className="grid grid-cols-1 gap-3 max-h-[160px] overflow-y-auto pr-3 custom-scrollbar">
                                    {activeMethods.map(method => (
                                       <button
                                         key={method.id}
                                         onClick={() => setSelectedPaymentMethodId(method.id)}
                                         type="button"
                                         className={`w-full p-5 rounded-2xl border flex items-center justify-between transition-all active:scale-[0.98] ${
                                           selectedPaymentMethodId === method.id 
                                             ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' 
                                             : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-indigo-400 group/p'
                                         }`}
                                       >
                                          <div className="flex items-center gap-5">
                                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                                                selectedPaymentMethodId === method.id ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                                             }`}>
                                                {method.type === 'ewallet' ? <Wallet className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                                             </div>
                                             <div className="text-left">
                                                <p className={`text-[11px] font-black uppercase italic tracking-tighter ${
                                                   selectedPaymentMethodId === method.id ? 'text-slate-900 dark:text-white' : 'text-slate-500 font-bold'
                                                }`}>{method.name}</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Verified Channel</p>
                                             </div>
                                          </div>
                                          {selectedPaymentMethodId === method.id && (
                                             <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                                          )}
                                       </button>
                                    ))}
                                 </div>
                              </div>
                           )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button 
                      onClick={handleUpgrade}
                      disabled={isUpgrading || isContextLoading}
                      className="w-full py-7 bg-indigo-600 dark:bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-50 relative z-10 hover:-translate-y-1"
                    >
                      {isUpgrading || isContextLoading ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                          <span>Initializing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-6 h-6 text-amber-300" />
                          <span>{showPaymentSelection ? 'Initialize Protocol' : 'Request Activation'}</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
