import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  ChevronLeft, 
  CheckCircle2, 
  Copy, 
  Info,
  ShieldCheck,
  AlertCircle,
  Loader2,
  QrCode
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useManagement } from '../contexts/ManagementContext';
import { formatCurrency } from '../lib/utils';
import Layout from '../components/layout/Layout';

export default function MembershipPaymentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { myMembershipOrder, showNotification } = useManagement();
  const [copied, setCopied] = useState(false);

  const paymentMethod = (myMembershipOrder as any)?.paymentMethod;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showNotification('Account number copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const virtualAccount = "8809 1234 5678 9012";

  return (
    <Layout>
      <main className="max-w-lg mx-auto p-5 py-10">
        <button 
          onClick={() => navigate('/membership')}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-[10px] uppercase tracking-widest mb-8 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Membership
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden">
          <div className="bg-indigo-600 p-8 text-center text-white relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <svg width="100%" height="100%"><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/></pattern><rect width="100%" height="100%" fill="url(#grid)" /></svg>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-80">Payment Instruction</p>
              <h2 className="text-3xl font-display font-black uppercase tracking-tight">Upgrade Premium</h2>
              <div className="mt-6 inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">
                <span className="text-2xl font-black">{formatCurrency(50000)}</span>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment Method</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase">{paymentMethod?.name || 'Manual Bank Transfer'}</span>
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  </div>
                </div>
              </div>
              
              {paymentMethod?.type === 'qris' && (
                 <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
                    {(paymentMethod.mode === 'static' || !paymentMethod.mode) ? (
                      <>
                        <div className="bg-white p-3 rounded-2xl shadow-lg mb-4">
                           <img src={paymentMethod.qrImageUrl || paymentMethod.config?.qrImage || paymentMethod.config?.qrUrl} alt="QRIS" className="w-40 h-40 object-contain mx-auto" />
                        </div>
                        <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1 italic">Scan to Upgrade</p>
                        {paymentMethod.nmid && (
                           <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg mt-2">
                             <p className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">NMID: {paymentMethod.nmid}</p>
                           </div>
                        )}
                      </>
                    ) : (
                      <>
                        {(myMembershipOrder as any)?.proofUrl ? (
                          <>
                             <div className="bg-white p-3 rounded-2xl shadow-lg mb-4">
                               <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent((myMembershipOrder as any).proofUrl)}`} alt="Dynamic QRIS" className="w-40 h-40 object-contain mx-auto" />
                             </div>
                             <a 
                                href={(myMembershipOrder as any).proofUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg"
                             >
                               Pay via App
                             </a>
                          </>
                        ) : (
                           <div className="py-6">
                              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Generating QR...</p>
                           </div>
                        )}
                      </>
                    )}
                 </div>
              )}

              {paymentMethod?.type === 'gateway' && (myMembershipOrder as any)?.proofUrl && (
                 <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/20 text-center flex flex-col items-center gap-3">
                   <CreditCard className="w-8 h-8 text-indigo-600 mb-1" />
                   <p className="text-[10px] font-bold text-indigo-900 dark:text-indigo-100 uppercase tracking-widest leading-none mb-1">Pay via Gateway</p>
                   <p className="text-[9px] font-medium text-indigo-400 uppercase tracking-widest mb-2">Continue to secure payment</p>
                   <a 
                      href={(myMembershipOrder as any).proofUrl}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                   >
                     Open Payment Link
                   </a>
                 </div>
              )}

              {(paymentMethod?.type === 'va' || paymentMethod?.type === 'manual' || !paymentMethod) && (
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 relative group">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    {paymentMethod?.type === 'va' ? 'Virtual Account Number' : 'Account Number'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-display font-black text-slate-900 dark:text-white tracking-wider">
                      {paymentMethod?.config?.accountNumber || "8809 1234 5678 9012"}
                    </span>
                    <button 
                      onClick={() => copyToClipboard(paymentMethod?.config?.accountNumber || "8809123456789012")}
                      className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm hover:bg-slate-100 dark:hover:bg-slate-600 transition-all active:scale-90"
                    >
                      <Copy className="w-4 h-4 text-indigo-600" />
                    </button>
                  </div>
                  {paymentMethod?.config?.bankName && (
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-2">{paymentMethod.config.bankName}</p>
                  )}
                </div>
              )}

              {paymentMethod?.type === 'ewallet' && (
                 <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">E-Wallet Info</p>
                    <p className="font-display font-black text-slate-900 dark:text-white text-lg">{paymentMethod.config?.phone || 'Payment via APP'}</p>
                 </div>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">How to Pay</p>
              <div className="space-y-3">
                {(paymentMethod?.type === 'qris' ? [
                  'Open your payment app (OVO, GoPay, Dana, etc)',
                  'Select Scan QR Code',
                  'Point camera at the QR code above',
                  `Confirm payment of ${formatCurrency(myMembershipOrder?.amount || 50000)}`
                ] : [
                  'Open your mobile banking app',
                  'Select transfer to bank / virtual account',
                  'Enter the account number above',
                  `Confirm details and pay exactly ${formatCurrency(myMembershipOrder?.amount || 50000)}`
                ]).map((step, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[9px] font-black text-indigo-600">{i + 1}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-3xl border border-amber-100 dark:border-amber-800/30 flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-tight mb-1">Manual Verification</h4>
                <p className="text-[10px] font-medium text-amber-700 dark:text-amber-500 leading-relaxed">
                  After payment, our admin will verify your transaction. This process usually takes 5-30 minutes during business hours.
                </p>
              </div>
            </div>

            <button 
              onClick={() => navigate('/membership')}
              className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5" />
              I have completed payment
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 opacity-40">
          <ShieldCheck className="w-5 h-5" />
          <p className="text-[10px] font-bold uppercase tracking-widest">Secure Admin-Managed Payment</p>
        </div>
      </main>
    </Layout>
  );
}
