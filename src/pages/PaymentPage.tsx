import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck,
  Building,
  Hash,
  Copy,
  Clock,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useManagement } from '../contexts/ManagementContext';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency } from '../lib/utils';
import Layout from '../components/layout/Layout';

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders, isLoading, showNotification, confirmPayment } = useManagement();
  const { t } = useSettings();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Find current order from navigation state or get the latest PENDING order
  const orderIdFromState = location.state?.orderId;
  const currentOrder = orderIdFromState 
    ? orders.find(o => o.id === orderIdFromState) 
    : orders.find(o => o.status === 'PENDING');

  const paymentMethod = (currentOrder as any)?.paymentMethod;

  useEffect(() => {
    if (!isLoading && !currentOrder) {
      const timer = setTimeout(() => {
        navigate('/tickets');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentOrder, isLoading, navigate]);

  const handleConfirmPayment = async () => {
    if (!currentOrder) return;
    
    setIsProcessing(true);
    try {
      await confirmPayment(currentOrder.id);
      setIsProcessing(false);
      setIsSuccess(true);
      showNotification('Payment submitted successfully! Waiting for admin approval.');
      setTimeout(() => {
        navigate('/payment-history'); // Corrected path
      }, 3000);
    } catch (error) {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showNotification(`${label} copied to clipboard`);
  };

  if (!currentOrder && !isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-slate-400" />
          </div>
          <h1 className="text-2xl font-display font-extrabold text-slate-900 uppercase italic tracking-tight mb-2">No active order</h1>
          <p className="text-slate-500 max-w-sm mb-8 font-medium">We couldn't find any pending payment request. Please check your tickets or dashboard.</p>
          <button 
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs' shadow-xl"
          >
            Go Back Home
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <main className="max-w-4xl mx-auto px-6 py-12">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-white" />
             </div>
             <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.3em]">Checkout Flow</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-4">
            Verify Your <span className="text-indigo-600">Payment</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-xl">
            Please complete the transfer to the following account and confirm. Your ticket will be issued after admin verification.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-3 space-y-6">
            <section className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
              <h2 className="text-xl font-display font-black text-slate-900 uppercase italic mb-8 pb-4 border-b border-slate-100 flex items-center justify-between">
                Payment Details
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </h2>

              <div className="space-y-6">
                <div className="flex items-start justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                      <Building className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Payment Method</p>
                      <p className="font-bold text-slate-900">{paymentMethod?.name || 'Manual Bank Transfer'}</p>
                    </div>
                  </div>
                </div>

                {paymentMethod?.type === 'qris' && (
                  <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/40 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                    {(paymentMethod.mode === 'static' || !paymentMethod.mode) ? (
                      <>
                        <div className="bg-white p-4 rounded-3xl shadow-xl mb-6">
                           <img src={paymentMethod.qrImageUrl || paymentMethod.config?.qrImage || paymentMethod.config?.qrUrl} alt="QRIS" className="w-48 h-48 object-contain" />
                        </div>
                        <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Electronic Payment</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 italic">Scan using GoPay, OVO, Dana, LinkAja</p>
                        
                        {paymentMethod.nmid && (
                          <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                            <p className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">NMID: {paymentMethod.nmid}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Dynamic QRIS Logic */}
                        {(currentOrder as any)?.proofUrl ? (
                          <>
                             <div className="bg-white p-4 rounded-3xl shadow-xl mb-6">
                               <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent((currentOrder as any).proofUrl)}`} alt="Dynamic QRIS" className="w-48 h-48 object-contain" />
                             </div>
                             <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1 italic">Generated Secure QR</p>
                             <div className="flex flex-col gap-2 w-full mt-4">
                               <a 
                                  href={(currentOrder as any).proofUrl} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20"
                               >
                                 Open Mobile App
                               </a>
                             </div>
                          </>
                        ) : (
                          <div className="py-10">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generating Dynamic QR...</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {paymentMethod?.type === 'gateway' && (currentOrder as any)?.proofUrl && (
                  <div className="p-8 bg-indigo-50 dark:bg-indigo-900/5 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 text-center flex flex-col items-center gap-4">
                     <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-600/10 mb-2">
                        <CreditCard className="w-8 h-8 text-indigo-600" />
                     </div>
                     <h3 className="text-lg font-display font-black text-indigo-900 dark:text-indigo-100 uppercase italic">Pay via Gateway</h3>
                     <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest max-w-[200px] leading-relaxed">Continue to the secure payment page to complete your booking.</p>
                     <a 
                        href={(currentOrder as any).proofUrl} 
                        className="mt-2 w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                     >
                        Open Payment Link
                     </a>
                  </div>
                )}

                {(paymentMethod?.type === 'va' || paymentMethod?.type === 'manual' || !paymentMethod) && (
                  <div className="flex items-start justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                        <Hash className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                          {paymentMethod?.type === 'va' ? 'Virtual Account Number' : 'Account Number'}
                        </p>
                        <p className="font-mono font-bold text-lg text-slate-900">
                          {paymentMethod?.config?.accountNumber || '8233 4567 8901 2345'}
                        </p>
                        {paymentMethod?.config?.bankName && (
                          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">{paymentMethod.config.bankName}</p>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(paymentMethod?.config?.accountNumber || '8233456789012345', 'Account number')}
                      className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-indigo-600"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {paymentMethod?.type === 'ewallet' && (
                   <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                         <CreditCard className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                         <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5">E-Wallet Info</p>
                         <p className="font-bold text-indigo-900">{paymentMethod.config?.phone || 'Payment via APP'}</p>
                      </div>
                   </div>
                )}

                <div className="flex items-start justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5">Total Amount</p>
                      <p className="font-display font-black text-2xl text-indigo-600 italic">
                        {formatCurrency(currentOrder?.total || 0)}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(currentOrder?.total.toString() || '', 'Amount')}
                    className="p-2 hover:bg-indigo-50 rounded-xl transition-colors text-indigo-400 hover:text-indigo-600"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="mt-10 p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <div className="flex gap-4">
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <Clock className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed">
                    Transfer exactly the amount above including the last 3 digits. Payment will be automatically verified in 15-30 minutes.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Checkout Steps / Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-indigo-600/40 transition-all duration-700" />
              
              <h3 className="text-xl font-display font-black uppercase italic mb-8 flex items-center gap-3">
                Action Required
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              </h3>

              <div className="space-y-8 mb-10 relative z-10">
                <div className="flex gap-4">
                  <div className="w-1 h-full bg-slate-800 absolute left-4 top-2 bottom-0 -z-10" />
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-lg shadow-indigo-600/30">1</div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-1">Transfer Funds</p>
                    <p className="text-xs text-slate-500 font-medium">Use mobile banking or ATM to transfer {formatCurrency(currentOrder?.total || 0)}</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center font-bold text-xs shrink-0">2</div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-200 mb-1">Confirm Payment</p>
                    <p className="text-xs text-slate-500 font-medium">Click the confirmation button below after transfer is complete.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center font-bold text-xs shrink-0">3</div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-200 mb-1">Wait for Ticket</p>
                    <p className="text-xs text-slate-500 font-medium">Our admin will verify the payment and your ticket will appear in "My Tickets".</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleConfirmPayment}
                disabled={isProcessing || isSuccess}
                className={`w-full py-5 rounded-2xl font-black uppercase italic tracking-tighter shadow-2xl transition-all flex items-center justify-center gap-3 ${
                  isSuccess 
                    ? 'bg-emerald-500 text-white cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Confirmed!
                  </>
                ) : (
                  <>
                    Confirm Payment
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </section>

            <section className="bg-indigo-50 rounded-[2rem] p-6 border border-indigo-100">
               <div className="flex gap-3 mb-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                     <AlertCircle className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-widest flex items-center">
                    Payment rules
                  </h4>
               </div>
               <ul className="space-y-2">
                  <li className="text-[10px] font-bold text-indigo-700/70 flex items-start gap-2">
                     <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1 shrink-0" />
                     PAYMENT LIMIT: 24 HOURS
                  </li>
                  <li className="text-[10px] font-bold text-indigo-700/70 flex items-start gap-2">
                     <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1 shrink-0" />
                     AUTOMATIC CANCELLATION IF NOT PAID
                  </li>
                  <li className="text-[10px] font-bold text-indigo-700/70 flex items-start gap-2">
                     <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1 shrink-0" />
                     NON-REFUNDABLE ONCE PAID
                  </li>
               </ul>
            </section>
          </div>
        </div>
      </main>
    </Layout>
  );
}
