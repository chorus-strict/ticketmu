import { useState, useEffect, useMemo } from 'react';
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
  Ticket as TicketIcon
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

  const availableVouchers = useMemo(() => myRewards.filter(r => !r.isUsed), [myRewards]);
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
      <main className="max-w-lg mx-auto p-5 py-10">
        {/* Status Badge */}
        <div className="flex justify-center mb-6 h-8">
          <AnimatePresence mode="wait">
            {isPremium ? (
              <motion.span 
                key="premium"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-4 py-1.5 bg-emerald-500 text-white rounded-full text-[10px] font-black tracking-[0.2em] uppercase shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                Premium Active
              </motion.span>
            ) : isExpired ? (
              <motion.span 
                key="expired"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-4 py-1.5 bg-rose-500 text-white rounded-full text-[10px] font-black tracking-[0.2em] uppercase shadow-lg shadow-rose-500/20 flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                Membership Expired
              </motion.span>
            ) : isPending ? (
              <motion.span 
                key="pending"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-4 py-1.5 bg-amber-500 text-white rounded-full text-[10px] font-black tracking-[0.2em] uppercase shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                Pending Approval
              </motion.span>
            ) : (
              <motion.span 
                key="free"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-[10px] font-black tracking-[0.2em] uppercase"
              >
                Free Tier
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Current Status Card */}
        <div className={`p-8 rounded-[2.5rem] relative overflow-hidden mb-10 text-left shadow-2xl transition-all duration-700 ${
          isPremium ? 'bg-slate-900 border border-amber-500/30' : 
          isExpired ? 'bg-rose-950 border border-rose-500/30' : 'premium-gradient'
        }`}>
          <Sparkles className={`absolute -right-4 -top-4 w-24 h-24 text-white opacity-20 rotate-12 transition-all duration-700 ${isPremium ? 'text-amber-500 opacity-40 scale-125' : ''}`} />
          <div className="relative z-10 text-center">
            <h2 className="text-[10px] font-bold text-indigo-100 uppercase tracking-[0.2em] mb-3 opacity-80">Membership Identity</h2>
            <div className="flex flex-col items-center justify-center gap-2">
              <motion.span 
                layout
                className={`text-4xl font-display font-black uppercase tracking-tight transition-all duration-700 ${isPremium ? 'text-amber-400' : 'text-white'}`}
              >
                {isPremium ? 'Premium Member' : isExpired ? 'Expired Tier' : isPending ? 'Verification' : 'Standard Tier'}
              </motion.span>
              {isPremium && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 mt-1"
                >
                  <div className="h-[1px] w-8 bg-amber-300/30"></div>
                  <span className="px-3 py-1 bg-amber-400 text-slate-900 rounded-full text-[9px] font-black tracking-widest">VIP ACCESS</span>
                  <div className="h-[1px] w-8 bg-amber-300/30"></div>
                </motion.div>
              )}
            </div>
            {isPremium && user?.membershipExpiredAt && (
              <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-6 text-[10px] font-bold text-amber-500/80 leading-relaxed uppercase tracking-widest"
              >
                Valid until {formatDate(user.membershipExpiredAt)}
              </motion.p>
            )}
            {isExpired && (
              <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-6 text-[10px] font-bold text-rose-400/80 leading-relaxed uppercase tracking-widest"
              >
                Access lost on {formatDate(user?.membershipExpiredAt || '')}
              </motion.p>
            )}
            {isPending && (
              <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-6 text-xs font-bold text-indigo-100/70 leading-relaxed uppercase tracking-wider"
              >
                Our team is reviewing your transaction
              </motion.p>
            )}
            {!isPremium && !isPending && !isExpired && (
              <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-6 text-xs font-bold text-indigo-100/70 leading-relaxed uppercase tracking-wider"
              >
                Unlock the full VIP experience today
              </motion.p>
            )}
          </div>
        </div>

        {/* Benefits Section */}
        <section className="space-y-6 text-left">
          <div className="flex items-center gap-3 ml-1">
            <div className="w-1 h-3 bg-indigo-600 rounded-full"></div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
              {isPremium ? 'Your Active Benefits' : 'Exclusive Privileges'}
            </h3>
          </div>
          <div className="space-y-4">
            {benefits.map((benefit, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex gap-5 group hover:border-indigo-400 transition-all duration-300 hover:shadow-lg"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center flex-none group-hover:scale-110 transition-transform shadow-inner">
                  {benefit.icon}
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight text-sm">{benefit.title}</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed dark:text-slate-400">{benefit.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Dynamic Action Section */}
        <div className="mt-12 overflow-hidden">
          <AnimatePresence mode="wait">
            {isPremium ? (
              <motion.div 
                key="premium-action"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="p-8 bg-emerald-50 dark:bg-emerald-900/10 rounded-[2.5rem] border border-emerald-200/50 dark:border-emerald-800/30 text-center space-y-4"
              >
                <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-500/20 rotate-3">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-display font-black text-2xl text-emerald-950 dark:text-emerald-100 uppercase tracking-tight">Premium Active</h4>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-widest opacity-80 leading-relaxed">
                  You have full access to all premium features.<br/>Thank you for your support!
                </p>
                <button 
                  onClick={handleUpgrade}
                  disabled={isUpgrading || isContextLoading}
                  className="mt-6 w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                >
                  {isUpgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Extend Membership
                </button>
              </motion.div>
            ) : isExpired ? (
              <motion.div 
                key="expired-action"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="p-8 bg-rose-50 dark:bg-rose-900/10 rounded-[2.5rem] border border-rose-200/50 dark:border-rose-800/30 text-center space-y-6"
              >
                <div className="w-16 h-16 bg-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-rose-500/20">
                  <X className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h4 className="font-display font-black text-2xl text-rose-950 dark:text-rose-100 uppercase tracking-tight mb-2">Membership Expired</h4>
                  <p className="text-[10px] text-rose-700 dark:text-rose-400 font-bold uppercase tracking-widest opacity-80">Renew now to regain your exclusive privileges</p>
                </div>
                <button 
                  onClick={handleUpgrade}
                  disabled={isUpgrading || isContextLoading}
                  className="w-full py-5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {isUpgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Renew Now
                </button>
              </motion.div>
            ) : isPending ? (
              <motion.div 
                key="pending-action"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="p-8 bg-amber-50 dark:bg-amber-900/10 rounded-[2.5rem] border border-amber-200/50 dark:border-amber-800/30 text-center space-y-6"
              >
                <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-amber-500/20 animate-pulse">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h4 className="font-display font-black text-2xl text-amber-950 dark:text-amber-100 uppercase tracking-tight mb-2">Waiting for Approval</h4>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-widest opacity-80">Your payment is being verified by admin</p>
                </div>
                <button 
                  onClick={() => navigate('/settings?tab=payments')}
                  className="w-full py-5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
                >
                  View Payment Status <Clock className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="free-action"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="p-8 bg-slate-50 dark:bg-slate-900/80 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-8 text-center relative overflow-hidden group shadow-xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-indigo-500/10 transition-colors"></div>
                
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 p-1.5 px-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4 font-black">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></div>
                    <span className="text-[9px] text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Early Adopter Offer</span>
                  </div>
                  
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-4xl font-display font-black tracking-tighter ${discountAmount > 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                      {formatCurrency(finalPrice)}
                    </span>
                    <span className="text-slate-400 font-bold ml-1">/mo</span>
                  </div>
                  {discountAmount > 0 && (
                    <p className="text-[10px] font-bold text-rose-500 mt-2 uppercase tracking-widest leading-none">
                      Voucher Applied: -{formatCurrency(discountAmount)}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 font-bold mt-4 uppercase tracking-[0.1em] opacity-60">Instant Access • Admin Verified Approval</p>
                </div>

                <AnimatePresence>
                  {showPaymentSelection && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800"
                    >
                       {/* VOUCHER SELECTION */}
                       {availableVouchers.length > 0 && (
                          <div className="space-y-3">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left leading-none mb-2">Apply Voucher</p>
                             <div className="grid grid-cols-1 gap-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                                {availableVouchers.map(v => (
                                   <button
                                     key={v.id}
                                     onClick={() => setSelectedRewardId(selectedRewardId === v.id ? null : v.id)}
                                     type="button"
                                     className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                                       selectedRewardId === v.id 
                                         ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                                         : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/10 hover:border-slate-200'
                                     }`}
                                   >
                                      <div className="flex items-center gap-3">
                                         <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                                            selectedRewardId === v.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-400'
                                         }`}>
                                            <TicketIcon className="w-3 h-3" />
                                         </div>
                                         <p className={`text-[10px] font-bold uppercase tracking-tight ${
                                            selectedRewardId === v.id ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-600 dark:text-slate-300'
                                         }`}>{v.reward.title}</p>
                                      </div>
                                      {selectedRewardId === v.id && <CheckCircle2 className="w-3 h-3 text-indigo-600" />}
                                   </button>
                                ))}
                             </div>
                          </div>
                       )}

                       {/* PAYMENT SELECTION */}
                       {activeMethods.length > 0 && (
                          <div className="space-y-3">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left leading-none mb-2">Select Payment Method</p>
                             <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                {activeMethods.map(method => (
                                   <button
                                     key={method.id}
                                     onClick={() => setSelectedPaymentMethodId(method.id)}
                                     type="button"
                                     className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                                       selectedPaymentMethodId === method.id 
                                         ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                                         : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/10 hover:border-slate-200'
                                     }`}
                                   >
                                      <div className="flex items-center gap-3">
                                         <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                                            selectedPaymentMethodId === method.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-400'
                                         }`}>
                                            {method.type === 'ewallet' ? <Wallet className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                                         </div>
                                         <div className="text-left">
                                            <p className={`text-[10px] font-bold uppercase tracking-tight ${
                                               selectedPaymentMethodId === method.id ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-600 dark:text-slate-300'
                                            }`}>{method.name}</p>
                                         </div>
                                      </div>
                                      {selectedPaymentMethodId === method.id && (
                                         <CheckCircle2 className="w-3 h-3 text-indigo-600" />
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
                  className="w-full py-6 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                >
                  {isUpgrading || isContextLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Preparing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-amber-300" />
                      <span>{showPaymentSelection ? 'Confirm Upgrade' : 'Upgrade Now'}</span>
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>
    </Layout>
  );
}
