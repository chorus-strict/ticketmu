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
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-2xl shadow-indigo-600/5 border border-slate-100 dark:border-slate-800">
            <AlertCircle className="w-10 h-10 text-slate-300 dark:text-slate-700" />
          </div>
          <h1 className="text-4xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4">No Active Intel</h1>
          <p className="text-slate-400 dark:text-slate-500 max-w-sm mb-12 font-black text-[11px] uppercase tracking-[0.2em] italic leading-relaxed">System manifest empty. No pending acquisition nodes identified in the current sector.</p>
          <button 
            onClick={() => navigate('/')}
            className="px-12 py-5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl transition-all active:scale-95 italic"
          >
            RETURN TO BASE
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <main className="max-w-[1240px] mx-auto px-6 sm:px-8 lg:px-12 py-16 lg:py-24">
        <header className="mb-20">
          <div className="flex items-center gap-4 mb-6">
             <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/20 italic">
                <CreditCard className="w-5 h-5 text-white" />
             </div>
             <span className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em] italic leading-none">Authentication Phase</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-black text-slate-950 dark:text-white uppercase italic tracking-tighter leading-none mb-6">
            Verify <span className="text-indigo-600">Acquisition</span>
          </h1>
          <p className="text-slate-400 dark:text-slate-500 font-black text-[11px] uppercase tracking-[0.2em] italic max-w-xl leading-relaxed opacity-70">
            Finalize server-side handshake through secure asset transfer. Authorization required for ticket generation protocol.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-20">
          {/* Order Details */}
          <div className="lg:col-span-12 xl:col-span-7 space-y-8 lg:space-y-10">
            <section className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-8 sm:p-10 lg:p-14 border border-slate-100 dark:border-slate-800 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.05)] relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
               
              <h2 className="text-2xl font-display font-black text-slate-950 dark:text-white uppercase italic mb-12 pb-6 border-b-2 border-slate-50 dark:border-slate-800/50 flex items-center justify-between tracking-tight relative z-10">
                Strategic Assets
                <ShieldCheck className="w-7 h-7 text-emerald-500" />
              </h2>

              <div className="space-y-10 relative z-10">
                <div className="flex items-start justify-between group">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center border border-slate-100 dark:border-slate-800/50 group-hover:bg-indigo-600 transition-all duration-500 group-hover:rotate-6">
                      <Building className="w-8 h-8 text-slate-400 dark:text-slate-600 group-hover:text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 italic opacity-60">Source Node</p>
                      <p className="font-black text-xl text-slate-950 dark:text-white uppercase italic tracking-tight">{paymentMethod?.name || 'MANUAL PROTOCOL'}</p>
                    </div>
                  </div>
                </div>

                {paymentMethod?.type === 'qris' && (
                  <div className="flex flex-col items-center justify-center p-12 lg:p-16 bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-slate-800 text-center relative overflow-hidden group/qr">
                    {(paymentMethod.mode === 'static' || !paymentMethod.mode) ? (
                      <>
                        <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] mb-10 transform group-hover/qr:scale-110 transition-transform duration-700">
                           <img src={paymentMethod.qrImageUrl || paymentMethod.config?.qrImage || paymentMethod.config?.qrUrl} alt="QRIS" className="w-56 h-56 object-contain grayscale-[0.5] hover:grayscale-0 transition-all duration-700" />
                        </div>
                        <p className="text-[12px] font-black text-slate-950 dark:text-white uppercase tracking-[0.4em] mb-3 italic">Electronic Matrix</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 italic opacity-60">Scan secure cryptographic code</p>
                        
                        {paymentMethod.nmid && (
                          <div className="px-8 py-3 bg-indigo-600/5 dark:bg-indigo-900/40 rounded-2xl border border-indigo-600/20 backdrop-blur-xl">
                            <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.5em] italic">NMID: {paymentMethod.nmid}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Dynamic QRIS Logic */}
                        {(currentOrder as any)?.proofUrl ? (
                          <>
                             <div className="bg-white p-6 rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] mb-10 transform group-hover/qr:scale-105 transition-transform duration-700">
                               <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent((currentOrder as any).proofUrl)}`} alt="Dynamic QRIS" className="w-56 h-56 object-contain" />
                             </div>
                             <p className="text-[12px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em] mb-3 italic leading-none">Dynamic Secure Node</p>
                             <div className="flex flex-col gap-4 w-full mt-6">
                               <a 
                                  href={(currentOrder as any).proofUrl} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="py-5 bg-indigo-600 hover:bg-slate-950 dark:hover:bg-white text-white dark:hover:text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] italic shadow-2xl shadow-indigo-600/20 transition-all active:scale-95"
                               >
                                 ACTIVATE APP LINK
                               </a>
                             </div>
                          </>
                        ) : (
                          <div className="py-16">
                            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-6" />
                            <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] italic opacity-60">Synthesizing Protocol...</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {paymentMethod?.type === 'gateway' && (currentOrder as any)?.proofUrl && (
                  <div className="p-12 lg:p-16 bg-indigo-600/5 dark:bg-indigo-900/10 rounded-[3.5rem] border-2 border-indigo-600/10 text-center flex flex-col items-center gap-8 relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.1),transparent)]" />
                     <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-600/10 mb-2 relative z-10 border border-indigo-600/5">
                        <CreditCard className="w-10 h-10 text-indigo-600" />
                     </div>
                     <div className="relative z-10">
                        <h3 className="text-3xl font-display font-black text-slate-950 dark:text-white uppercase italic tracking-tighter mb-4">Secure Outbound</h3>
                        <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] italic max-w-xs mx-auto leading-relaxed opacity-70">Redirect to encrypted gateway for transaction finalization protocol.</p>
                     </div>
                     <a 
                        href={(currentOrder as any).proofUrl} 
                        className="relative z-10 w-full py-6 bg-indigo-600 hover:bg-slate-950 dark:hover:bg-white text-white dark:hover:text-black rounded-[1.8rem] font-black uppercase tracking-[0.4em] text-[12px] transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 italic"
                     >
                        OPEN GATEWAY
                     </a>
                  </div>
                )}

                {(paymentMethod?.type === 'va' || paymentMethod?.type === 'manual' || !paymentMethod) && (
                  <div className="flex items-center justify-between group p-10 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-600/30 transition-all duration-500">
                    <div className="flex items-center gap-8">
                      <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-[1.5rem] flex items-center justify-center shadow-lg border border-slate-50 dark:border-slate-800 transition-transform group-hover:-rotate-3">
                        <Hash className="w-8 h-8 text-slate-300 dark:text-slate-700 group-hover:text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-3 italic opacity-60">
                          {paymentMethod?.type === 'va' ? 'VA DESTINATION NODE' : 'ACQUISITION PORT'}
                        </p>
                        <p className="font-mono font-black text-2xl lg:text-3xl text-slate-950 dark:text-white tracking-widest leading-none">
                          {paymentMethod?.config?.accountNumber || '8233 4567 8901 2345'}
                        </p>
                        {paymentMethod?.config?.bankName && (
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mt-4 italic opacity-80">{paymentMethod.config.bankName} PROTOCOL</p>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(paymentMethod?.config?.accountNumber || '8233456789012345', 'Port ID')}
                      className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 hover:text-indigo-600 hover:border-indigo-600 shadow-sm transition-all active:scale-90"
                    >
                      <Copy className="w-6 h-6" />
                    </button>
                  </div>
                )}

                {paymentMethod?.type === 'ewallet' && (
                   <div className="p-10 bg-indigo-600/5 dark:bg-indigo-900/10 rounded-[2.5rem] border-2 border-indigo-600/5 flex items-center gap-8 group">
                      <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-[1.5rem] flex items-center justify-center shadow-lg border border-indigo-600/5 transition-all group-hover:bg-indigo-600">
                         <CreditCard className="w-8 h-8 text-indigo-600 group-hover:text-white" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-2 italic opacity-60">WALLET IDENTIFIER</p>
                         <p className="font-black text-xl text-slate-950 dark:text-white uppercase italic tracking-tight">{paymentMethod.config?.phone || 'LINKED DEVICE'}</p>
                      </div>
                   </div>
                )}

                <div className="flex items-center justify-between group p-10 bg-indigo-600/5 dark:bg-indigo-400/5 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-600/10">
                  <div className="flex items-center gap-8">
                    <div className="w-16 h-16 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-indigo-600/30 transition-transform group-hover:scale-110">
                      <CreditCard className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-indigo-600/60 uppercase tracking-[0.4em] mb-2 italic">REQUIRED VALUE</p>
                      <p className="font-display font-black text-4xl lg:text-5xl text-indigo-600 italic tracking-tighter">
                        {formatCurrency(currentOrder?.total || 0)}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(currentOrder?.total.toString() || '', 'Value')}
                    className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-300 hover:text-indigo-600 shadow-sm transition-all active:scale-90"
                  >
                    <Copy className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="mt-12 p-8 bg-slate-50 dark:bg-slate-900/40 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                <div className="flex gap-6 items-center">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm shrink-0 border border-slate-100 dark:border-slate-700">
                    <Clock className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] italic max-w-sm leading-relaxed opacity-80">
                    Exact value matching required. System verification cycle: 15-30m UTC. Authorization failure on mismatch.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Checkout Steps / Sidebar */}
          <div className="lg:col-span-12 xl:col-span-5 space-y-8 lg:space-y-10 mb-12 lg:mb-0">
            <section className="bg-slate-950 rounded-[3rem] p-8 sm:p-12 lg:p-14 text-white shadow-[0_60px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden group border border-slate-900">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[130px] -mr-32 -mt-32 rounded-full group-hover:bg-indigo-600/20 transition-all duration-1000" />
              
              <h3 className="text-3xl font-display font-black uppercase italic mb-14 flex items-center gap-4 tracking-tighter leading-none">
                PROTOCOL STATUS
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
              </h3>

              <div className="space-y-12 mb-16 relative z-10">
                <div className="flex gap-8 relative">
                  <div className="w-px h-full bg-slate-900 absolute left-[2.2rem] top-10 bottom-0 -z-10" />
                  <div className="w-12 h-12 bg-indigo-600 rounded-3xl flex items-center justify-center font-black text-sm shrink-0 shadow-[0_10px_25px_-5px_rgba(79,70,229,0.5)] italic">01</div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-200 mb-2 italic">ASSET TRANSFER</p>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.15em] italic leading-relaxed">Initiate {formatCurrency(currentOrder?.total || 0)} handshake through banking node.</p>
                  </div>
                </div>
                
                <div className="flex gap-8 relative">
                  <div className="w-12 h-12 bg-slate-900 text-slate-700 rounded-3xl flex items-center justify-center font-black text-sm shrink-0 italic border border-slate-800">02</div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2 italic">MANIFEST VALIDATION</p>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.15em] italic leading-relaxed opacity-60">Trigger manual acknowledgement once assets are committed.</p>
                  </div>
                </div>

                <div className="flex gap-8 relative">
                  <div className="w-12 h-12 bg-slate-900 text-slate-700 rounded-3xl flex items-center justify-center font-black text-sm shrink-0 italic border border-slate-800">03</div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2 italic">ENCRYPTION SYNC</p>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.15em] italic leading-relaxed opacity-60">Wait for admin-level authentication. Digital pass will encode instantly.</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleConfirmPayment}
                disabled={isProcessing || isSuccess}
                className={`w-full py-7 rounded-[2rem] font-black uppercase italic tracking-[0.4em] shadow-[0_40px_80px_-15px_rgba(79,70,229,0.4)] transition-all duration-500 flex items-center justify-center gap-4 text-[12px] ${
                  isSuccess 
                    ? 'bg-emerald-600 text-white cursor-default shadow-emerald-500/20'
                    : 'bg-indigo-600 hover:bg-white hover:text-slate-950 text-white hover:-translate-y-2 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    AUTHENTICATING...
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="w-6 h-6" />
                    COMMITTED
                  </>
                ) : (
                  <>
                    CONFIRM PROTOCOL
                    <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </button>
            </section>

            <section className="bg-indigo-50 dark:bg-indigo-900/10 rounded-[3rem] p-10 border border-indigo-100 dark:border-indigo-600/20">
               <div className="flex gap-6 mb-8">
                  <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl border border-indigo-600/5">
                     <AlertCircle className="w-7 h-7 text-indigo-600" />
                  </div>
                  <h4 className="text-[12px] font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-[0.4em] flex items-center italic">
                    Acquisition Rules
                  </h4>
               </div>
               <ul className="space-y-4">
                  <li className="text-[10px] font-black text-indigo-700/60 dark:text-indigo-400/60 flex items-start gap-4 uppercase tracking-[0.2em] italic">
                     <div className="w-2 h-2 bg-indigo-400 rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
                     WINDOW: 24:00 HOURS UNTIL VOID
                  </li>
                  <li className="text-[10px] font-black text-indigo-700/60 dark:text-indigo-400/60 flex items-start gap-4 uppercase tracking-[0.2em] italic">
                     <div className="w-2 h-2 bg-indigo-400 rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
                     AUTO-PURGE ON DELINQUENCY
                  </li>
                  <li className="text-[10px] font-black text-indigo-700/60 dark:text-indigo-400/60 flex items-start gap-4 uppercase tracking-[0.2em] italic">
                     <div className="w-2 h-2 bg-indigo-400 rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
                     COMMITMENT FINAL: NO RETRACTION
                  </li>
               </ul>
            </section>
          </div>
        </div>
      </main>
    </Layout>
  );
}
