import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useManagement } from '../../contexts/ManagementContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Building2, 
  MapPin, 
  Globe, 
  CreditCard, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  Settings,
  CircleDollarSign,
  QrCode,
  LineChart,
  X,
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../../lib/utils';
import api from '../../services/api';

export default function OrganizerUpgrade({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();
  const { upgradeToOrganizer, myOrganizerRequest, paymentMethods, confirmOrganizerPayment, fetchMyOrganizerRequest } = useManagement();
  const { user, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentSelection, setShowPaymentSelection] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');

  const [formData, setFormData] = useState({
    companyName: '',
    description: '',
    bankAccount: '',
    bankName: '',
    website: '',
    logo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'Organizer')}`
  });

  const activeMethods = paymentMethods.filter(m => m.status);

  useEffect(() => {
    fetchMyOrganizerRequest();
  }, [fetchMyOrganizerRequest]);

  useEffect(() => {
    if (activeMethods.length > 0 && !selectedPaymentMethodId) {
      setSelectedPaymentMethodId(activeMethods[0].id);
    }
  }, [activeMethods, selectedPaymentMethodId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeMethods.length > 1 && !showPaymentSelection) {
      setShowPaymentSelection(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await upgradeToOrganizer({
        ...formData,
        paymentMethodId: selectedPaymentMethodId
      });
      
      // If payment is required and an order was created, redirect
      if (result?.order) {
        if (result.order.checkoutUrl) {
          window.location.href = result.order.checkoutUrl;
          return;
        }
        
        // Redirect to unified payment page
        navigate(`/payment?orderId=${result.order.id}`);
        if (onClose) onClose();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'System fault during upgrade. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!myOrganizerRequest) return;
    setIsSubmitting(true);
    try {
      await confirmOrganizerPayment(myOrganizerRequest.id);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Confirmation failed';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { icon: <CircleDollarSign className="w-5 h-5" />, title: '85% Revenue Share', desc: 'Keep most of your earnings with automatic splits.' },
    { icon: <QrCode className="w-5 h-5" />, title: 'On-site Validation', desc: 'Scan tickets via mobile dashboard at your events.' },
    { icon: <LineChart className="w-5 h-5" />, title: 'Advanced Analytics', desc: 'Track sales, attendance and revenue in real-time.' }
  ];

  // UI for when user is already an organizer
  if (user?.role === 'ORGANIZER') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 text-center border-4 border-emerald-500/30 shadow-2xl">
        <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
          <ShieldCheck className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4 leading-none">Status: Active</h2>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto">
          Welcome to the Merchant Ecosystem. Your account has been upgraded to Organizer. The console is now online.
        </p>
        <button 
          onClick={() => window.location.href = '/admin'}
          className="w-full py-5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-xl active:scale-95 transition-all"
        >
          Initialize Console
        </button>
      </div>
    );
  }

  // UI for status: WAITING_APPROVAL
  if (myOrganizerRequest?.status === 'WAITING_APPROVAL') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 text-center border-4 border-amber-500/30 shadow-2xl">
        <div className="w-24 h-24 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl animate-pulse">
          <Clock className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4 leading-none">Awaiting Clearance</h2>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto">
          Your payment has been received. Our administrators are currently reviewing your merchant application.
        </p>
        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-4">Request Identity</p>
           <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{myOrganizerRequest.id}</p>
        </div>
      </div>
    );
  }

  // UI for status: PAYMENT_PENDING
  if (myOrganizerRequest?.status === 'PAYMENT_PENDING') {
    const orderData = (myOrganizerRequest as any).order;
    const paymentMethod = orderData?.paymentMethod || myOrganizerRequest.paymentMethod;

    return (
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 text-center border-4 border-indigo-500/30 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl -mr-32 -mt-32 rounded-full"></div>
        
        <div className="relative z-10">
          <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-600/20 rotate-3">
            <CreditCard className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4 leading-none text-center">Payment Required</h2>
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-10">Activation Fee: {formatCurrency(300000)}</p>
          
          <div className="space-y-6 mb-10 text-left">
             <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] border border-white/10">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-4 block">Merchant Profile</span>
                <p className="text-xl font-display font-black uppercase italic tracking-tight mb-2">{myOrganizerRequest.companyName}</p>
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                   <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Awaiting Verification</p>
                </div>
             </div>

             <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Selected Method</p>
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-indigo-500 shadow-sm border border-slate-100 dark:border-slate-600">
                      <CreditCard className="w-6 h-6" />
                   </div>
                   <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{paymentMethod?.name || 'Manual Transfer'}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Secure Payment Node</p>
                   </div>
                </div>
             </div>
          </div>

          <button 
            onClick={() => {
              if (orderData?.id) {
                navigate(`/payment?orderId=${orderData.id}`);
                if (onClose) onClose();
              } else {
                 setError("Payment session lost. Please refresh or contact support.");
              }
            }}
            className="w-full py-5 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all flex items-center justify-center gap-4"
          >
            <ArrowRight className="w-4 h-4" />
            Proceed to Payment
          </button>
          
          <p className="mt-8 text-[9px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">
             You will be redirected to the secure payment dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-3xl -mr-48 -mt-48 rounded-full pointer-events-none"></div>
      
      {onClose && (
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-20">
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="flex flex-col lg:flex-row min-h-[600px]">
        {/* INFO SIDEBAR */}
        <div className="lg:w-2/5 p-10 lg:p-14 bg-slate-900 text-white relative overflow-hidden flex flex-col justify-between">
           <div className="absolute top-0 right-0 p-10 opacity-5">
              <TrendingUp className="w-40 h-40" />
           </div>
           
           <div className="relative z-10">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-inner shadow-indigo-400/20 border border-indigo-400/30">
                 <Building2 className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl font-display font-black uppercase italic tracking-tighter mb-6 leading-none">Merchant Expansion</h2>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest leading-loose mb-12 italic">
                 Unlock the full potential of Tiketmu. Scale your event brand with enterprise tools and secure financial settlements.
              </p>

              <div className="space-y-6">
                 {steps.map((step, i) => (
                   <div key={i} className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 text-indigo-400">
                         {step.icon}
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-white">{step.title}</p>
                         <p className="text-[9px] font-medium text-slate-500 uppercase mt-1 tracking-tight">{step.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="relative z-10 pt-12 border-t border-white/10 mt-12">
              <div className="flex items-baseline gap-2 mb-2">
                 <span className="text-3xl font-display font-black italic tracking-tighter text-indigo-400">{formatCurrency(300000)}</span>
                 <span className="text-[9px] font-black text-white/40 uppercase tracking-widest italic">Activation Fee</span>
              </div>
              <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest italic leading-relaxed">
                 One-time strategic investment <br/> Lifetime merchant authorization.
              </p>
           </div>
        </div>

        {/* FORM SIDE */}
        <div className="lg:w-3/5 p-10 lg:p-14 relative flex flex-col">
           <div className="mb-10">
              <h3 className="text-xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Activation Protocol</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1.5 opacity-60">Initialize your merchant credentials</p>
           </div>

           {error && (
              <div className="mb-8 p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top duration-300">
                 <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0">
                    <AlertCircle className="w-4 h-4" />
                 </div>
                 <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">{error}</p>
              </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-8 flex-1 flex flex-col">
              <div className="space-y-6 flex-1">
                <AnimatePresence mode="wait">
                  {showPaymentSelection ? (
                    <motion.div 
                      key="payment-selection"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                       <div className="flex items-center gap-3 mb-6">
                          <button 
                            type="button" 
                            onClick={() => setShowPaymentSelection(false)}
                            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                             <ArrowRight className="w-4 h-4 rotate-180" />
                          </button>
                          <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Select Payment Method</p>
                       </div>

                       <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {activeMethods.map(method => (
                             <button
                               key={method.id}
                               type="button"
                               onClick={() => setSelectedPaymentMethodId(method.id)}
                               className={`w-full p-6 rounded-2xl border flex items-center justify-between transition-all active:scale-[0.98] ${
                                 selectedPaymentMethodId === method.id 
                                   ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' 
                                   : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-indigo-400'
                               }`}
                             >
                                <div className="flex items-center gap-5">
                                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
                                      selectedPaymentMethodId === method.id ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                                   }`}>
                                      {method.type === 'ewallet' ? <Wallet className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                                   </div>
                                   <div className="text-left">
                                      <p className={`text-base font-black uppercase italic tracking-tighter ${
                                         selectedPaymentMethodId === method.id ? 'text-slate-900 dark:text-white' : 'text-slate-500'
                                      }`}>{method.name}</p>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Verified Gateway</p>
                                   </div>
                                </div>
                                {selectedPaymentMethodId === method.id && <CheckCircle2 className="w-6 h-6 text-indigo-600" />}
                             </button>
                          ))}
                       </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="form-fields"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Company/Brand Name</label>
                         <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <input 
                              required
                              type="text" 
                              value={formData.companyName}
                              onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                              placeholder="e.g. Nexus Events Corp"
                              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold placeholder:font-normal"
                            />
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Merchant Biography</label>
                         <textarea 
                           rows={3}
                           value={formData.description}
                           onChange={(e) => setFormData({...formData, description: e.target.value})}
                           placeholder="Tell your audience about your event brand..."
                           className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold placeholder:font-normal resize-none"
                         />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Settlement Bank</label>
                           <input 
                              required
                              type="text" 
                              value={formData.bankName}
                              onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                              placeholder="e.g. BCA, Mandiri"
                              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold placeholder:font-normal"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Account Node Number</label>
                           <input 
                              required
                              type="text" 
                              value={formData.bankAccount}
                              onChange={(e) => setFormData({...formData, bankAccount: e.target.value})}
                              placeholder="0000000000"
                              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold placeholder:font-normal"
                           />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-8">
                 <button 
                   disabled={isSubmitting}
                   type="submit"
                   className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 ${
                     showPaymentSelection 
                       ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' 
                       : 'bg-indigo-600 hover:bg-slate-900 text-white shadow-indigo-600/20'
                   }`}
                 >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <>
                        <span>{showPaymentSelection ? 'Complete & Pay' : 'Next: Payment Interface'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                 </button>
                 <p className="mt-8 text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest leading-loose">
                    By activating, you agree to the platform governance policy. <br/> Activation fee {formatCurrency(300000)} is required for merchant node initialization.
                 </p>
              </div>
           </form>
        </div>
      </div>
    </div>
  );
}
