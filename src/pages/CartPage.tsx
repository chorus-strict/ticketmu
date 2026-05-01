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

  const subtotal = cartItems.reduce((sum, item) => sum + (item.event!.price * item.quantity), 0);
  const platformFee = 15000;
  
  const availableVouchers = useMemo(() => myRewards.filter(r => !r.isUsed), [myRewards]);
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-10">
        
        {/* PROGRESS BAR (Desktop) */}
        <div className="hidden lg:flex items-center gap-4 mb-12">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">1</div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Review Cart</span>
            </div>
            <div className="w-12 h-px bg-slate-200 dark:bg-slate-800"></div>
            <div className="flex items-center gap-3 opacity-40">
               <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs">2</div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Checkout</span>
            </div>
             <div className="w-12 h-px bg-slate-200 dark:bg-slate-800"></div>
            <div className="flex items-center gap-3 opacity-40">
               <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs">3</div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Success</span>
            </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-12">
          
          {/* Main Cart Items (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className="flex items-center justify-between">
               <h1 className="text-3xl font-display font-extrabold text-slate-900 dark:text-white uppercase italic tracking-tighter">Your Passes</h1>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{cartItems.length} Selection(s)</span>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode='popLayout'>
                {cartItems.map((item) => (
                  <motion.div 
                    key={item.eventId}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-6 sm:gap-8 group"
                  >
                    <div className="w-full sm:w-32 h-40 sm:h-32 rounded-2xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-700 shadow-inner">
                      <img 
                        src={getImageUrl(item.event!.image, item.event!.category)} 
                        alt={item.event!.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getImageUrl(null, item.event!.category);
                        }}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-base sm:text-lg font-display font-bold text-slate-900 dark:text-white uppercase italic truncate max-w-[200px] sm:max-w-md">{item.event!.title}</h3>
                          <div className="flex items-center gap-4 mt-2">
                             <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                                <Calendar className="w-3 h-3 text-indigo-500" />
                                {formatDate(item.event!.date)}
                             </div>
                             <div className="hidden sm:flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                                <CreditCard className="w-3 h-3 text-indigo-500" />
                                Ticket Pass
                             </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.eventId)}
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-white hover:bg-rose-500 transition-all border border-slate-100 dark:border-slate-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-6 sm:mt-0">
                         <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Item Cost</span>
                            <p className="text-lg font-display font-extrabold text-slate-900 dark:text-white">{formatCurrency(item.event!.price)}</p>
                         </div>

                         <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl p-1 border border-slate-100 dark:border-slate-700">
                           <button 
                             onClick={() => updateCartQuantity(item.eventId, item.quantity - 1)}
                             className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors"
                           >
                             <Minus className="h-3 w-3" />
                           </button>
                           <span className="px-4 text-xs font-black text-slate-900 dark:text-white">{item.quantity}</span>
                           <button 
                             onClick={() => updateCartQuantity(item.eventId, item.quantity + 1)}
                             className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors"
                           >
                             <Plus className="h-3 w-3" />
                           </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* SECURITY/GUARANTEE */}
            <div className="flex flex-col sm:flex-row gap-4">
               <div className="flex-1 p-6 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-[2rem] flex items-center gap-4">
                  <div className="w-12 h-12 bg-white dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center shadow-sm">
                     <ShieldCheck className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                     <p className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest leading-none mb-1">Reserved Access</p>
                     <p className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-500/70 uppercase tracking-widest">Your slot is safe for 15m</p>
                  </div>
               </div>
               <div className="flex-1 p-6 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-[2rem] flex items-center gap-4">
                  <div className="w-12 h-12 bg-white dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center shadow-sm">
                     <Info className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                     <p className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest leading-none mb-1">Digital Delivery</p>
                     <p className="text-[9px] font-bold text-indigo-600/70 dark:text-indigo-500/70 uppercase tracking-widest">Instant ticket sync</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Sidebar Summary (4 cols) */}
          <div className="lg:col-span-4 self-start lg:sticky lg:top-28">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-900/5 flex flex-col gap-8">
               <h2 className="text-xl font-display font-extrabold text-slate-900 dark:text-white uppercase italic tracking-tight">Order Summary</h2>
               
               <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     <span>Subtotal</span>
                     <span className="text-slate-600 dark:text-slate-300">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     <span>Platform Fee</span>
                     <span className="text-slate-600 dark:text-slate-300">{formatCurrency(platformFee)}</span>
                  </div>
                  {discountAmount > 0 && (
                     <div className="flex justify-between items-center text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                        <span>Reward Discount</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                     </div>
                  )}
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     <span>Tax (0%)</span>
                     <span className="text-emerald-500">Free</span>
                  </div>
               </div>

               {/* VOUCHER SELECTION */}
               {availableVouchers.length > 0 && (
                  <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">Available Vouchers</p>
                     <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                        {availableVouchers.map(v => (
                           <button
                             key={v.id}
                             onClick={() => setSelectedRewardId(selectedRewardId === v.id ? null : v.id)}
                             className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all group ${
                               selectedRewardId === v.id 
                                 ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                                 : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-200'
                             }`}
                           >
                              <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    selectedRewardId === v.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-400'
                                 }`}>
                                    <TicketIcon className="w-4 h-4" />
                                 </div>
                                 <div className="text-left">
                                    <p className={`text-xs font-bold uppercase tracking-tight ${
                                       selectedRewardId === v.id ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-600 dark:text-slate-300 group-hover:text-indigo-600'
                                    }`}>{v.reward.title}</p>
                                    <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Redeemed Voucher</p>
                                 </div>
                              </div>
                              {selectedRewardId === v.id && (
                                 <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                              )}
                           </button>
                        ))}
                     </div>
                  </div>
               )}

               <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-end mb-8">
                     <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] block mb-1 leading-none">Total Investment</span>
                        <p className="text-4xl font-display font-extrabold text-indigo-600 italic">{formatCurrency(totalAmount)}</p>
                     </div>
                     <ChevronRight className="w-6 h-6 text-slate-200" />
                  </div>

               {activeMethods.length > 0 && (
                 <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">Select Payment Method</p>
                    <div className="grid grid-cols-1 gap-2">
                       {activeMethods.map(method => (
                          <button
                            key={method.id}
                            onClick={() => setSelectedPaymentMethodId(method.id)}
                            type="button"
                            className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${
                              selectedPaymentMethodId === method.id 
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                                : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-200'
                            }`}
                          >
                             <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                   selectedPaymentMethodId === method.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-400'
                                }`}>
                                   {method.type === 'ewallet' ? <Wallet className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                                </div>
                                <div className="text-left">
                                   <p className={`text-xs font-bold uppercase tracking-tight ${
                                      selectedPaymentMethodId === method.id ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-600 dark:text-slate-300'
                                   }`}>{method.name}</p>
                                   <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">{method.type.replace('_', ' ')}</p>
                                </div>
                             </div>
                             {selectedPaymentMethodId === method.id && (
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                             )}
                          </button>
                       ))}
                    </div>
                 </div>
               )}

                  <button 
                    onClick={handleCheckout}
                    className="w-full py-5 bg-indigo-600 hover:bg-slate-900 dark:hover:bg-white dark:hover:text-black text-white rounded-2xl font-bold uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all text-xs group flex items-center justify-center gap-3"
                  >
                    Proceed to Payment
                    <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                  </button>
               </div>
            </div>
            
            <p className="mt-8 text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-loose max-w-[280px] mx-auto">
               Secure payment encrypted by Tiketmu. Always verify your booking details.
            </p>
          </div>
        </div>
      </main>
    </Layout>
  );
}
