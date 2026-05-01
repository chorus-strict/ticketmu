import React, { useState, useEffect, useCallback } from 'react';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  Ticket as TicketIcon,
  ShoppingBag,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useManagement, ManagedPayment } from '../../contexts/ManagementContext';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate, formatDateTime, formatCurrency } from '../../lib/utils';
import { Link } from 'react-router-dom';

export default function PaymentHistory() {
  const { fetchPaymentHistory, isLoading: contextLoading } = useManagement();
  const [history, setHistory] = useState<ManagedPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED'>('ALL');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    const filters: any = {};
    if (statusFilter !== 'ALL') filters.status = statusFilter;
    if (dateRange.start) filters.startDate = new Date(dateRange.start).toISOString();
    if (dateRange.end) {
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);
      filters.endDate = end.toISOString();
    }
    
    const data = await fetchPaymentHistory(filters);
    setHistory(data);
    setIsLoading(false);
  }, [fetchPaymentHistory, statusFilter, dateRange]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/50';
      case 'PAID':
      case 'SUCCESS': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/50';
      case 'FAILED': return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-900/50';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'PAID':
      case 'SUCCESS': return 'Success';
      case 'FAILED':
      case 'REJECTED': return 'Failed';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Loading transactions...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 border border-slate-200 dark:border-slate-800 text-center">
        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2">No transactions yet</h3>
        <p className="text-slate-500 font-medium max-w-xs mx-auto mb-8">You haven't made any ticket purchases yet. Discover exciting events and start your journey!</p>
        <Link 
          to="/"
          className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all"
        >
          Explore Events
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight flex items-center gap-3">
             <CreditCard className="w-6 h-6 text-indigo-600" />
             Transaction <span className="text-indigo-600">History</span>
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{history.length} transactions found</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400 mr-2" />
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-transparent border-none text-[10px] font-bold text-slate-600 dark:text-slate-300 outline-none w-24"
            />
            <span className="text-slate-300 mx-2 font-black">-</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-transparent border-none text-[10px] font-bold text-slate-600 dark:text-slate-300 outline-none w-24"
            />
          </div>

          <select 
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none shadow-sm shadow-slate-100 dark:shadow-none"
          >
            <option value="ALL">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {history.map((payment, idx) => (
          <motion.div 
            key={payment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all"
          >
            <div className="flex items-center gap-5 flex-1 min-w-0">
               <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform duration-500">
                 {payment.type === 'MEMBERSHIP' ? (
                   <Sparkles className="w-8 h-8 text-amber-500" />
                 ) : (
                   <TicketIcon className="w-8 h-8 text-indigo-600" />
                 )}
               </div>
               <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       {formatDateTime(payment.createdAt)}
                     </span>
                     <span className="w-1 h-1 bg-slate-300 rounded-full" />
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       {payment.type}
                     </span>
                  </div>
                  <h4 className="text-lg font-display font-black text-slate-900 dark:text-white uppercase italic truncate group-hover:text-indigo-600 transition-colors">
                    {payment.type === 'MEMBERSHIP' ? 'Membership Upgrade' : (payment.eventTitle || 'Ticket Purchase')}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Reference ID: #{payment.id.slice(-8).toUpperCase()}</p>
               </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-8 shrink-0">
               <div className="text-right">
                  <p className="text-xl font-display font-black text-slate-900 dark:text-white italic tracking-tighter">
                    {formatCurrency(payment.amount)}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {payment.type === 'MEMBERSHIP' ? 'Premium Tier' : 'Event Entry'}
                  </p>
               </div>

               <div className="flex items-center gap-4">
                  <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm ${getStatusStyle(payment.status)}`}>
                    {getStatusMessage(payment.status)}
                  </div>
                  
                  {payment.status === 'PENDING' ? (
                    <Link 
                      to={payment.type === 'MEMBERSHIP' ? "/membership/payment" : "/payment"}
                      state={payment.type === 'TICKET' ? { orderId: payment.referenceId } : undefined}
                      className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                    >
                       <ExternalLink className="w-4 h-4" />
                    </Link>
                  ) : payment.status === 'SUCCESS' ? (
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl flex items-center justify-center">
                       <CheckCircle className="w-4 h-4" />
                    </div>
                  ) : null}
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
