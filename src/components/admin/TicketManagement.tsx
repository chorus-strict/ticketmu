import React, { useState } from 'react';
import { 
  Search, 
  Ticket as TicketIcon, 
  Edit, 
  Trash2, 
  Loader2, 
  X,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User as UserIcon,
  Tag
} from 'lucide-react';
import { useManagement, Ticket, TicketStatus } from '../../contexts/ManagementContext';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate, formatDateTime } from '../../lib/utils';

export default function TicketManagement() {
  const { tickets, updateTicket, deleteTicket, isLoading } = useManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | TicketStatus>('ALL');
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.event?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t as any).user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTicket) {
      await updateTicket(editingTicket.id, { status: editingTicket.status });
      setEditingTicket(null);
    }
  };

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'USED': return <XCircle className="w-4 h-4 text-slate-400" />;
      case 'CANCELLED': return <AlertCircle className="w-4 h-4 text-rose-500" />;
    }
  };

  const getStatusStyle = (status: TicketStatus) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800';
      case 'USED': return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      case 'CANCELLED': return 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by ID, Event, or Buyer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-sm"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="USED">Used</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Ticket List */}
      <div className="space-y-3">
        {isLoading && tickets.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div 
              key={ticket.id} 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-6 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 group"
            >
              {/* ID & Status */}
              <div className="shrink-0 flex md:flex-col items-center md:items-start gap-4">
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-800 group-hover:scale-110 transition-transform">
                  <TicketIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className={`px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${getStatusStyle(ticket.status)}`}>
                  {getStatusIcon(ticket.status)}
                  {ticket.status}
                </div>
              </div>

              {/* Event & User Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white truncate uppercase italic">{ticket.event?.title}</h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
                  <div className="flex items-center gap-2.5">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{(ticket as any).user?.name || 'Unknown User'}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{formatDateTime(ticket.createdAt || ticket.purchaseDate)}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-mono font-bold text-indigo-500 uppercase">#{ticket.id.slice(-8)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 md:border-l border-slate-100 dark:border-slate-800 md:pl-5">
                <button 
                  onClick={() => setEditingTicket(ticket)}
                  className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setIsDeletingId(ticket.id)}
                  className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}

        {!isLoading && filteredTickets.length === 0 && (
          <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <TicketIcon className="w-14 h-14 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
            <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white uppercase italic">Inventory Exhausted</h3>
            <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mt-2">No tickets matching your current criteria</p>
          </div>
        )}
      </div>

      {/* Edit Ticket Modal */}
      <AnimatePresence>
        {editingTicket && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setEditingTicket(null)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-indigo-600 text-white">
                <div>
                  <h3 className="text-xl font-display font-extrabold uppercase italic leading-none">Modify Pass</h3>
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">Ref: #{editingTicket.id.slice(-8)}</p>
                </div>
                <button onClick={() => setEditingTicket(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Current Status</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['ACTIVE', 'USED', 'CANCELLED'] as TicketStatus[]).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setEditingTicket({ ...editingTicket, status })}
                        className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                          editingTicket.status === status 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20 active:scale-95' 
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setEditingTicket(null)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl active:scale-95 transition-all text-xs uppercase tracking-widest"
                  >
                    Discard
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all text-xs uppercase tracking-widest"
                  >
                    Sync Updates
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {isDeletingId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
             <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setIsDeletingId(null)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-display font-extrabold text-slate-900 dark:text-white mb-2 uppercase italic tracking-tighter">Terminate Pass?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed mb-10 px-4">This entry code will be permanently purged. The user will lose access to the event immediately.</p>
              
              <div className="flex gap-4">
                 <button 
                    onClick={() => setIsDeletingId(null)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl active:scale-95 transition-all text-[10px] uppercase tracking-widest"
                  >
                    Safety Off
                  </button>
                  <button 
                    onClick={async () => { await deleteTicket(isDeletingId); setIsDeletingId(null); }}
                    className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-2xl shadow-xl shadow-rose-600/20 active:scale-95 transition-all text-[10px] uppercase tracking-widest"
                  >
                    Confirm Purge
                  </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
