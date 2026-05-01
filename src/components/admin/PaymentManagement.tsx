import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  User as UserIcon,
  Ticket as TicketIcon,
  Calendar,
  MoreVertical,
  ChevronRight,
  ArrowUpRight,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useManagement, ManagedOrder } from '../../contexts/ManagementContext';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate, formatDateTime, formatCurrency, getImageUrl } from '../../lib/utils';

export default function PaymentManagement() {
  const { orders, fetchOrders, approveOrder, rejectOrder, isLoading } = useManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'FAILED'>('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      order.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.event?.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'ALL' || order.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await approveOrder(id);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await rejectOrder(id);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'PAID': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'FAILED': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">Order <span className="text-indigo-600">Verification</span></h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{orders.length} orders total</p>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={() => fetchOrders()}
             className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-2 hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-widest shadow-sm"
           >
             <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
             Sync Data
           </button>
        </div>
      </header>

      {/* Filters & Search */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by customer, event, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none text-sm font-medium"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <select 
            value={filter}
            onChange={(e: any) => setFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none text-sm font-bold appearance-none uppercase tracking-widest"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </section>

      {/* Orders Table/List */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Customer</th>
                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Event / Item</th>
                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Total Amount</th>
                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              <AnimatePresence mode="popLayout">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                          <CreditCard className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No matching orders found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <motion.tr 
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center font-black text-indigo-600 text-lg uppercase italic shadow-sm">
                            {order.user?.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white mb-0.5">{order.user?.name}</p>
                            <p className="text-xs font-medium text-slate-400">{order.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-500">
                            <img 
                              src={getImageUrl(order.event?.image, order.event?.category || 'Other')} 
                              alt={order.event?.title} 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                const cat = order.event?.category || 'Other';
                                e.currentTarget.src = getImageUrl(null, cat);
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{order.event?.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(order.event?.date || '')}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-display font-black text-lg text-slate-900 dark:text-white italic tracking-tighter">
                          {formatCurrency(order.total)}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] ${getStatusStyle(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {order.status === 'PENDING' ? (
                            <>
                              <button 
                                onClick={() => handleApprove(order.id)}
                                disabled={processingId === order.id}
                                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-tighter flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                              >
                                {processingId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Approve
                              </button>
                              <button 
                                onClick={() => handleReject(order.id)}
                                disabled={processingId === order.id}
                                className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 rounded-xl font-black text-xs uppercase tracking-tighter flex items-center gap-2 shadow-sm active:scale-95 transition-all"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">
                              <CheckCircle className="w-4 h-4 text-slate-300" />
                              Handled
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
