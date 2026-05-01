import React, { useState, useRef, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Filter,
  MoreVertical,
  Mail,
  Calendar,
  DollarSign,
  User as UserIcon,
  Crown,
  Eye,
  Check,
  X,
  AlertCircle,
  Shield,
  UserX,
  RefreshCcw,
  Ban
} from 'lucide-react';
import { useManagement, ManagedMembershipOrder, ManagedUser } from '../../contexts/ManagementContext';
import { formatDate, formatCurrency } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function MembershipManagement() {
  const { 
    membershipOrders, 
    approveMembership, 
    rejectMembership, 
    setMembershipPending,
    confirmMembershipPayment,
    markMembershipPaymentFailed,
    updateUserRole,
    suspendUser,
    isLoading 
  } = useManagement();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'APPROVED' | 'REJECTED' | 'FAILED'>('ALL');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ManagedMembershipOrder | null>(null);
  const [showConfirm, setShowConfirm] = useState<{ id: string, type: string, action: () => void } | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOrders = membershipOrders.filter(order => {
    const matchesSearch = 
      order.user?.name.toLowerCase().includes(search.toLowerCase()) || 
      order.user?.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || order.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'APPROVED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'FAILED':
      case 'REJECTED': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'APPROVED': return <CheckCircle2 className="w-3 h-3" />;
      case 'FAILED':
      case 'REJECTED': return <XCircle className="w-3 h-3" />;
      case 'PENDING': return <Clock className="w-3 h-3" />;
      default: return null;
    }
  };

  const handleAction = (id: string, type: string, action: () => void) => {
    setActiveMenu(null);
    setShowConfirm({ id, type, action });
  };

  return (
    <div className="space-y-6 text-left relative">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Membership Orders</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Review and approve premium upgrades</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex items-center gap-2">
            <Crown className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-tight">
              {membershipOrders.filter(o => o.status === 'PENDING').length} Pending Requests
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2 p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-x-auto no-scrollbar">
          {(['ALL', 'PENDING', 'PAID', 'APPROVED', 'REJECTED', 'FAILED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                filter === f 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-indigo-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <motion.div
                layout
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-900 transition-all group relative"
              >
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                    <UserIcon className="w-6 h-6 text-slate-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight truncate">{order.user?.name}</h4>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{order.user?.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{formatCurrency(order.amount)}</span>
                      </div>
                      {order.expiredAt && (
                        <div className="flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest italic">Exp: {formatDate(order.expiredAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-all"
                    >
                      Details
                    </button>
                    <div className="relative">
                      <button 
                        onClick={() => setActiveMenu(activeMenu === order.id ? null : order.id)}
                        className="p-3 text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 dark:bg-slate-800 rounded-xl"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {activeMenu === order.id && (
                          <motion.div
                            ref={menuRef}
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-[100] overflow-hidden"
                          >
                            <div className="p-2 space-y-1">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">Primary Actions</p>
                              <button 
                                onClick={() => setSelectedOrder(order)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                              >
                                <Eye className="w-4 h-4" /> View Details
                              </button>
                              <button 
                                disabled={order.status === 'APPROVED' || order.status === 'PAID'}
                                onClick={() => handleAction(order.id, 'APPROVE', () => approveMembership(order.id))}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors disabled:opacity-30 disabled:pointer-events-none"
                              >
                                <CheckCircle2 className="w-4 h-4" /> Approve Member
                              </button>
                              <button 
                                disabled={order.status === 'REJECTED' || order.status === 'FAILED'}
                                onClick={() => handleAction(order.id, 'REJECT', () => rejectMembership(order.id))}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors disabled:opacity-30 disabled:pointer-events-none"
                              >
                                <Ban className="w-4 h-4" /> Reject Request
                              </button>
                              <button 
                                disabled={order.status === 'PENDING'}
                                onClick={() => handleAction(order.id, 'SET_PENDING', () => setMembershipPending(order.id))}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-colors disabled:opacity-30 disabled:pointer-events-none"
                              >
                                <Clock className="w-4 h-4" /> Mark Pending
                              </button>
                              
                              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">Payment Actions</p>
                              <button 
                                disabled={order.status === 'PAID'}
                                onClick={() => handleAction(order.id, 'CONFIRM_PAYMENT', () => confirmMembershipPayment(order.id))}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors disabled:opacity-30 disabled:pointer-events-none"
                              >
                                <DollarSign className="w-4 h-4" /> Confirm Payment
                              </button>
                              <button 
                                disabled={order.status === 'FAILED'}
                                onClick={() => handleAction(order.id, 'MARK_FAILED', () => markMembershipPaymentFailed(order.id))}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors disabled:opacity-30 disabled:pointer-events-none"
                              >
                                <AlertCircle className="w-4 h-4" /> Mark Failed
                              </button>

                              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">User Management</p>
                              <div className="px-3 py-2 space-y-2">
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em]">Change Role</p>
                                <div className="flex gap-1">
                                  {['USER', 'PREMIUM', 'ADMIN'].map((role) => (
                                    <button
                                      key={role}
                                      onClick={() => handleAction(order.userId, `CHANGE_ROLE_${role}`, () => updateUserRole(order.userId, role as any))}
                                      className="flex-1 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[7px] font-black text-slate-600 dark:text-slate-400 hover:bg-indigo-600 hover:text-white transition-all uppercase"
                                    >
                                      {role}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <button 
                                onClick={() => handleAction(order.userId, 'SUSPEND', () => suspendUser(order.userId))}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                              >
                                <UserX className="w-4 h-4" /> Suspend User
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                <Filter className="w-10 h-10 text-slate-200 dark:text-slate-700" />
              </div>
              <h3 className="font-display font-black text-xl text-slate-900 dark:text-white uppercase italic tracking-tight mb-2">No results found</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Try adjusting your search or filters</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl relative border border-slate-100 dark:border-slate-800"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                      <Crown className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Order Details</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Order ID: {selectedOrder.id}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</p>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase">{selectedOrder.user?.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 lowercase">{selectedOrder.user?.email}</p>
                      </div>
                    </div>
                    <div className="h-px bg-slate-100 dark:bg-slate-700" />
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</p>
                      <p className="text-xs font-black text-indigo-600">{formatCurrency(selectedOrder.amount)}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                      <div className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">{formatDate(selectedOrder.createdAt)}</p>
                    </div>
                    {selectedOrder.expiredAt && (
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Expiry Date</p>
                        <p className="text-[10px] font-black text-amber-600 uppercase italic">{formatDate(selectedOrder.expiredAt)}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    {selectedOrder.status === 'PENDING' ? (
                      <>
                        <button 
                          onClick={() => { approveMembership(selectedOrder.id); setSelectedOrder(null); }}
                          className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 hover:bg-emerald-500 transition-all active:scale-95"
                        >
                          Approve Now
                        </button>
                        <button 
                          onClick={() => { rejectMembership(selectedOrder.id); setSelectedOrder(null); }}
                          className="flex-1 py-4 border-2 border-rose-600 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-50 transition-all active:scale-95"
                        >
                          Reject Request
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => setSelectedOrder(null)}
                        className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                      >
                        Close Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative border border-slate-100 dark:border-slate-800 text-center"
            >
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2">Confirm Action</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 leading-relaxed">
                Are you sure you want to perform the action: <br/>
                <span className="text-indigo-600">"{showConfirm.type.replace(/_/g, ' ')}"</span>?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirm(null)}
                  className="flex-1 py-3 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => { showConfirm.action(); setShowConfirm(null); }}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-95"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
