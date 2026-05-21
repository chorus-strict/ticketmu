import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Calendar, 
  ShieldCheck,
  CreditCard,
  ChevronRight,
  ArrowLeft,
  Info,
  CheckCircle2,
  Wallet,
  Ticket as TicketIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { useManagement } from '../contexts/ManagementContext';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, formatCurrency, getImageUrl } from '../lib/utils';
import Layout from '../components/layout/Layout';

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, events, updateCartQuantity, removeFromCart, checkout, paymentMethods, myRewards, fetchMyRewards } = useManagement();
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);

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

  const cartItems = cart.map(item => {
    const event = events.find(e => e.id === item.eventId);
    return {
      ...item,
      event
    };
  }).filter(item => item.event !== undefined);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const platformFee = 15000;
  
  const availableVouchers = useMemo(() => (myRewards || []).filter(r => !r.isUsed), [myRewards]);
  const selectedVoucher = useMemo(() => availableVouchers.find(v => v.id === selectedRewardId), [availableVouchers, selectedRewardId]);
  
  const discountAmount = selectedVoucher ? selectedVoucher.value : 0;
  const totalAmount = Math.max(0, subtotal + platformFee - discountAmount);

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const res = await checkout(selectedPaymentMethodId, selectedRewardId || undefined);
    if (res?.checkoutUrl) {
      window.location.href = res.checkoutUrl;
      return;
    }
    if (res?.orderId) {
      navigate('/payment', { state: { orderId: res.orderId } });
    } else {
      navigate('/tickets');
    }
  };

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-10 min-h-[60vh] text-center">
          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner shadow-black/5">
            <ShoppingBag className="h-10 w-10 text-slate-300 dark:text-slate-600" />
          </div>
          <h2 className="text-3xl font-display font-extrabold text-slate-900 dark:text-white uppercase italic tracking-tight mb-3">Cart is empty</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-10 max-w-xs text-xs font-bold uppercase tracking-widest leading-relaxed">Experience a world of events. Start exploring and grab your passes today!</p>
          <Link 
            to="/" 
            className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest shadow-2xl shadow-indigo-600/20 active:scale-95 transition-all text-sm"
          >
            Explore Events
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <main className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 py-12 lg:py-24">
        
        {/* PROGRESS BAR (Desktop) */}
        <div className="hidden lg:flex items-center gap-6 mb-20">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-2xl shadow-indigo-600/20 italic">01</div>
               <span className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-600 italic">Review Inventory</span>
            </div>
            <div className="w-16 h-px bg-slate-100 dark:bg-slate-800"></div>
            <div className="flex items-center gap-4 opacity-30">
               <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-400 flex items-center justify-center font-black text-xs italic">02</div>
               <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Auth Checkout</span>
            </div>
             <div className="w-16 h-px bg-slate-100 dark:bg-slate-800"></div>
            <div className="flex items-center gap-4 opacity-30">
               <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-400 flex items-center justify-center font-black text-xs italic">03</div>
               <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Encryption</span>
            </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-24">
          
          {/* Main Cart Items (8 cols) */}
          <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-8 lg:gap-12">
            <div className="flex items-end justify-between border-b-2 border-slate-50 dark:border-slate-800/50 pb-8">
               <div>
                  <h1 className="text-5xl lg:text-6xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none mb-4">Tactical Cart</h1>
                  <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] italic opacity-60">Inventory manifest for upcoming engagements</p>
               </div>
               <span className="text-[12px] font-black text-indigo-600 bg-indigo-600/5 px-6 py-2 rounded-full border border-indigo-600/10 uppercase tracking-[0.2em] italic">{cartItems.length} ALLOCATED</span>
            </div>

            <div className="space-y-6 lg:space-y-8">
              <AnimatePresence mode='popLayout'>
              {cartItems.map((item, index) => (
                  <motion.div 
                    key={`${item.eventId}-${item.ticketTierId || 'base'}-${index}`}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-10 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-8 lg:gap-10 group"
                  >
                    <div className="w-full sm:w-40 h-48 sm:h-40 rounded-[2rem] overflow-hidden shrink-0 border border-slate-100 dark:border-slate-700 shadow-inner">
                      <img 
                        src={getImageUrl(item.event!.image, item.event!.category)} 
                        alt={item.event!.title} 
                        className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000 grayscale-[0.2] group-hover:grayscale-0" 
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getImageUrl(null, item.event!.category);
                        }}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1 sm:py-2">
                       <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-4 block italic opacity-60">Item Node {item.event!.id.slice(-6).toUpperCase()}</span>
                          <h3 className="text-xl sm:text-2xl font-display font-black text-slate-900 dark:text-white uppercase italic leading-tight mb-5 tracking-tighter truncate group-hover:text-indigo-600 transition-colors">{item.event!.title}</h3>
                          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                             <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                                <Calendar className="w-4 h-4 text-indigo-500" />
                                {formatDate(item.event!.date)}
                             </div>
                              <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                                <TicketIcon className="w-4 h-4 text-indigo-500" />
                                {item.ticketTierName || 'Standard Access'}
                             </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.eventId, item.ticketTierId)}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-800 hover:text-white hover:bg-rose-600 transition-all duration-300 border border-slate-100 dark:border-slate-800 hover:border-rose-600 active:scale-90 shrink-0"
                        >
                          <Trash2 className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                      </div>
 
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between mt-10 gap-8">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic mb-3 opacity-60">Acquisition Cost</span>
                            <p className="text-2xl sm:text-3xl font-display font-black text-slate-950 dark:text-white tracking-tighter italic">{formatCurrency(item.price)}</p>
                         </div>
 
                         <div className="flex items-center self-start sm:self-auto bg-slate-50 dark:bg-slate-900/50 rounded-[1.2rem] p-1.5 border border-slate-100 dark:border-slate-800 shadow-inner">
                           <button 
                             onClick={() => updateCartQuantity(item.eventId, item.quantity - 1, item.ticketTierId)}
                             className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all hover:bg-white dark:hover:bg-slate-800 rounded-xl"
                           >
                             <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                           </button>
                           <span className="px-5 text-xs sm:text-sm font-black text-slate-950 dark:text-white italic">{item.quantity}</span>
                           <button 
                             onClick={() => {
                               const maxLimit = item.event?.maxTicketsPerUser ?? 5;
                               if (item.quantity >= maxLimit) {
                                 toast.error(`Anda telah mencapai batas maksimum pembelian ticket untuk event ini. (Max ${maxLimit})`);
                                 return;
                               }
                               updateCartQuantity(item.eventId, item.quantity + 1, item.ticketTierId);
                             }}
                             disabled={item.quantity >= (item.event?.maxTicketsPerUser ?? 5)}
                             className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all hover:bg-white dark:hover:bg-slate-800 rounded-xl ${item.quantity >= (item.event?.maxTicketsPerUser ?? 5) ? 'opacity-30 cursor-not-allowed' : ''}`}
                           >
                             <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                           </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* SECURITY/GUARANTEE */}
            <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
               <div className="p-8 sm:p-10 bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/10 rounded-[2.5rem] sm:rounded-[3rem] flex items-center gap-6 sm:gap-8 group hover:bg-emerald-500/10 transition-all duration-700">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white dark:bg-slate-900 rounded-[1.2rem] sm:rounded-[1.5rem] flex items-center justify-center shadow-xl border border-emerald-500/10 group-hover:scale-110 transition-transform">
                     <ShieldCheck className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-500" />
                  </div>
                  <div>
                     <p className="text-[11px] sm:text-[12px] font-black text-emerald-600 uppercase tracking-[0.3em] italic mb-2">Vault Protection</p>
                     <p className="text-[9px] sm:text-[10px] font-black text-emerald-600/50 uppercase tracking-[0.2em] italic">Access secure for 15:00 UTC</p>
                  </div>
               </div>
               <div className="p-8 sm:p-10 bg-indigo-500/5 dark:bg-indigo-500/5 border border-indigo-500/10 rounded-[2.5rem] sm:rounded-[3rem] flex items-center gap-6 sm:gap-8 group hover:bg-indigo-500/10 transition-all duration-700">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white dark:bg-slate-900 rounded-[1.2rem] sm:rounded-[1.5rem] flex items-center justify-center shadow-xl border border-indigo-500/10 group-hover:scale-110 transition-transform">
                     <Info className="h-7 w-7 sm:h-8 sm:w-8 text-indigo-500" />
                  </div>
                  <div>
                     <p className="text-[11px] sm:text-[12px] font-black text-indigo-600 uppercase tracking-[0.3em] italic mb-2">Direct Encoding</p>
                     <p className="text-[9px] sm:text-[10px] font-black text-indigo-600/50 uppercase tracking-[0.2em] italic">Instant ticket sync protocol</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Sidebar Summary (4 cols) */}
          <div className="lg:col-span-12 xl:col-span-4 self-start xl:sticky xl:top-32 mb-12 lg:mb-0">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-10 lg:p-14 border border-slate-100 dark:border-slate-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] flex flex-col gap-8 lg:gap-10">
               <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Order Intel</h2>
               
               <div className="space-y-6 pt-10 border-t border-slate-50 dark:border-slate-800/50">
                  <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">
                     <span>Base Cost</span>
                     <span className="text-slate-900 dark:text-slate-100">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">
                     <span>Platform Fee</span>
                     <span className="text-slate-900 dark:text-slate-100">{formatCurrency(platformFee)}</span>
                  </div>
                  {discountAmount > 0 && (
                     <div className="flex justify-between items-center text-[11px] font-black text-rose-500 uppercase tracking-[0.3em] italic">
                        <span>Rebate Credit</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                     </div>
                  )}
                  <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">
                     <span>Taxation</span>
                     <span className="text-emerald-500 font-bold">EXEMPT</span>
                  </div>
               </div>

               {/* VOUCHER SELECTION */}
               {availableVouchers.length > 0 && (
                  <div className="space-y-6 pt-10 border-t border-slate-50 dark:border-slate-800/50">
                     <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic opacity-60">Redeemable Credits</p>
                     <div className="space-y-4 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                        {availableVouchers.map(v => (
                           <button
                             key={v.id}
                             onClick={() => setSelectedRewardId(selectedRewardId === v.id ? null : v.id)}
                             className={`w-full p-4 sm:p-6 rounded-[1.5rem] border-2 flex items-center justify-between transition-all duration-500 group relative overflow-hidden ${
                               selectedRewardId === v.id 
                                 ? 'border-indigo-600 bg-indigo-600/5' 
                                 : 'border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-slate-200 dark:hover:border-slate-700'
                             }`}
                           >
                              <div className="flex items-center gap-4 relative z-10">
                                 <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors ${
                                    selectedRewardId === v.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-400'
                                 }`}>
                                    <TicketIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                 </div>
                                 <div className="text-left">
                                    <p className={`text-[10px] sm:text-[11px] font-black uppercase tracking-tight italic ${
                                       selectedRewardId === v.id ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-900 dark:text-slate-400'
                                    }`}>{v.reward.title}</p>
                                    <p className="text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] italic">Voucher Applied</p>
                                 </div>
                              </div>
                              {selectedRewardId === v.id ? (
                                 <CheckCircle2 className="w-5 h-5 text-indigo-600 relative z-10" />
                              ) : (
                                 <div className="w-5 h-5 rounded-full border-2 border-slate-100 dark:border-slate-800 group-hover:border-indigo-600 transition-colors"></div>
                              )}
                           </button>
                        ))}
                     </div>
                  </div>
               )}

               <div className="pt-10 border-t border-slate-50 dark:border-slate-800/50">
                  <div className="flex justify-between items-end mb-10">
                     <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] block mb-3 italic opacity-60 leading-none">Total Strategic Value</span>
                        <p className="text-3xl sm:text-5xl font-display font-black text-indigo-600 italic tracking-tighter shadow-indigo-600/10 drop-shadow-2xl truncate sm:overflow-visible">
                           {formatCurrency(totalAmount)}
                        </p>
                     </div>
                     <ChevronRight className="w-8 h-8 text-slate-100 dark:text-slate-800 shrink-0 ml-4" />
                  </div>

               {activeMethods.length > 0 && (
                  <div className="space-y-6 mb-10">
                     <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic opacity-60">Authorize Payment Protocol</p>
                     <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {activeMethods.map(method => (
                           <button
                             key={method.id}
                             onClick={() => setSelectedPaymentMethodId(method.id)}
                             type="button"
                             className={`w-full p-4 sm:p-6 rounded-[1.5rem] border-2 flex items-center justify-between transition-all duration-500 group ${
                               selectedPaymentMethodId === method.id 
                                 ? 'border-indigo-600 bg-indigo-600/5' 
                                 : 'border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-slate-200 dark:hover:border-slate-700'
                             }`}
                           >
                              <div className="flex items-center gap-4">
                                 <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-lg transition-all ${
                                    selectedPaymentMethodId === method.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-400'
                                 }`}>
                                    {method.type === 'ewallet' ? <Wallet className="w-4 h-4 sm:w-5 sm:h-5" /> : <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />}
                                 </div>
                                 <div className="text-left">
                                    <p className={`text-[10px] sm:text-[11px] font-black uppercase tracking-tight italic ${
                                       selectedPaymentMethodId === method.id ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-900 dark:text-slate-400 group-hover:text-indigo-600'
                                    }`}>{method.name}</p>
                                    <p className="text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] italic">{method.type.replace('_', ' ')} NODE</p>
                                 </div>
                              </div>
                              {selectedPaymentMethodId === method.id ? (
                                 <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                              ) : (
                                 <div className="w-5 h-5 rounded-full border-2 border-slate-100 dark:border-slate-800 group-hover:border-indigo-600 transition-colors"></div>
                              )}
                           </button>
                        ))}
                     </div>
                  </div>
               )}

                  <button 
                    onClick={handleCheckout}
                    className="w-full py-6 bg-slate-950 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-white dark:hover:text-slate-950 text-white rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-[0_30px_60px_-15px_rgba(79,70,229,0.5)] active:scale-95 transition-all duration-500 group flex items-center justify-center gap-4 italic"
                  >
                    INITIATE ACQUISITION
                    <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-2 transition-transform" />
                  </button>
               </div>
            </div>
            
            <p className="mt-12 text-center text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em] italic leading-relaxed max-w-[320px] mx-auto opacity-40">
               Secure tactical encryption verified by Tiketmu Protocol. Manual verification recommended.
            </p>
          </div>
        </div>
      </main>
    </Layout>
  );
}
