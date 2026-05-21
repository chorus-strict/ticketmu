import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Filter,
  MoreVertical,
  Mail,
  Calendar,
  DollarSign,
  Eye,
  Check,
  X,
  AlertCircle,
  Ban,
  Globe,
  ExternalLink,
  Wallet,
  CreditCard
} from 'lucide-react';
import { useManagement, ManagedOrganizerRequest } from '../../contexts/ManagementContext';
import { formatDate, formatCurrency } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function OrganizerRequestManagement() {
  const { 
    organizerRequests,
    approveOrganizerRequest,
    rejectOrganizerRequest,
    isLoading 
  } = useManagement();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PAYMENT_PENDING' | 'WAITING_APPROVAL' | 'APPROVED' | 'REJECTED'>('ALL');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ManagedOrganizerRequest | null>(null);
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

  const filteredRequests = (organizerRequests ?? []).filter(req => {
    const matchesSearch = 
      (req.companyName || '').toLowerCase().includes(search.toLowerCase()) || 
      (req.user?.name || '').toLowerCase().includes(search.toLowerCase()) || 
      (req.user?.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || req.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'REJECTED': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'WAITING_APPROVAL': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'PAYMENT_PENDING': return 'bg-slate-50 text-slate-600 border-slate-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle2 className="w-3 h-3" />;
      case 'REJECTED': return <XCircle className="w-3 h-3" />;
      case 'WAITING_APPROVAL': return <Clock className="w-3 h-3" />;
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
          <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Organizer Applications</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Initialize and verify merchant nodes</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-tight">
              {organizerRequests.filter(o => o.status === 'WAITING_APPROVAL').length} Pending Reviews
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
            placeholder="Search by company, name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2 p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-x-auto no-scrollbar">
          {(['ALL', 'PAYMENT_PENDING', 'WAITING_APPROVAL', 'APPROVED', 'REJECTED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                filter === f 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-indigo-600'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((req) => (
              <motion.div
                layout
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-900 transition-all group relative"
              >
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform overflow-hidden">
                    {req.logo ? (
                      <img src={req.logo} alt={req.companyName} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight truncate">{req.companyName}</h4>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusColor(req.status)}`}>
                        {getStatusIcon(req.status)}
                        {req.status.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{req.user?.name} ({req.user?.email})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(req.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{formatCurrency(req.amount)}</span>
                      </div>
                      {req.paymentMethod && (
                        <div className="flex items-center gap-1.5">
                          {req.paymentMethod.type === 'ewallet' ? <Wallet className="w-3.5 h-3.5 text-amber-500" /> : <CreditCard className="w-3.5 h-3.5 text-amber-500" />}
                          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest italic">{req.paymentMethod.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSelectedRequest(req)}
                      className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-all"
                    >
                      Audit Request
                    </button>
                    <div className="relative">
                      <button 
                        onClick={() => setActiveMenu(activeMenu === req.id ? null : req.id)}
                        className="p-3 text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 dark:bg-slate-800 rounded-xl"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {activeMenu === req.id && (
                          <motion.div
                            ref={menuRef}
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-[100] overflow-hidden"
                          >
                            <div className="p-2 space-y-1">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">Primary Protocol</p>
                              <button 
                                onClick={() => setSelectedRequest(req)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                              >
                                <Eye className="w-4 h-4" /> Comprehensive View
                              </button>
                              <button 
                                disabled={req.status !== 'WAITING_APPROVAL'}
                                onClick={() => handleAction(req.id, 'APPROVE', () => approveOrganizerRequest(req.id))}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors disabled:opacity-30 disabled:pointer-events-none"
                              >
                                <CheckCircle2 className="w-4 h-4" /> Authorize Elite Role
                              </button>
                              <button 
                                disabled={req.status !== 'WAITING_APPROVAL' && req.status !== 'PAYMENT_PENDING'}
                                onClick={() => handleAction(req.id, 'REJECT', () => rejectOrganizerRequest(req.id))}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors disabled:opacity-30 disabled:pointer-events-none"
                              >
                                <Ban className="w-4 h-4" /> Reject Credentials
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
              <h3 className="font-display font-black text-xl text-slate-900 dark:text-white uppercase italic tracking-tight mb-2">No transmissions found</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Adjust filters to capture latent requests</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRequest(null)}
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
                    <div className="w-16 h-16 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center overflow-hidden">
                      {selectedRequest.logo ? (
                        <img src={selectedRequest.logo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-8 h-8 text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Merchant Dossier</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Application ID: {selectedRequest.id}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedRequest(null)}
                    className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand Affinity</p>
                       <p className="text-sm font-black text-indigo-600 uppercase italic">{selectedRequest.companyName}</p>
                    </div>
                    <div className="h-px bg-slate-100 dark:bg-slate-700" />
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Merchant Narrative</p>
                       <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">"{selectedRequest.description || 'No data provided'}"</p>
                    </div>
                    <div className="h-px bg-slate-100 dark:bg-slate-700" />
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Financial Node</p>
                          <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase">{selectedRequest.bankName}</p>
                          <p className="text-[10px] font-mono text-slate-500">{selectedRequest.bankAccount}</p>
                       </div>
                       <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">External Link</p>
                          {selectedRequest.website ? (
                            <a href={selectedRequest.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline">
                               Infrastructure <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <p className="text-[10px] font-bold text-slate-500 italic">None</p>
                          )}
                       </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Identity Linked</p>
                      <div className="text-right">
                        <p className="text-xs font-black uppercase italic">{selectedRequest.user?.name}</p>
                        <p className="text-[10px] font-bold text-white/40 lowercase">{selectedRequest.user?.email}</p>
                      </div>
                    </div>
                    <div className="h-px bg-white/5" />
                    <div className="flex items-center justify-between text-amber-500">
                      <p className="text-[10px] font-black uppercase tracking-widest">Activation Value</p>
                      <p className="text-xs font-black uppercase">{formatCurrency(selectedRequest.amount)}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Application Phase</p>
                      <div className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusColor(selectedRequest.status)}`}>
                        {selectedRequest.status.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                  
                  {selectedRequest.proofUrl && (
                    <div className="space-y-3">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Verification Artifact</p>
                       <div className="rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                          <img src={selectedRequest.proofUrl} alt="Payment Proof" className="w-full h-auto cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(selectedRequest.proofUrl, '_blank')} />
                       </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                  {selectedRequest.status === 'WAITING_APPROVAL' ? (
                    <>
                      <button 
                        onClick={() => { approveOrganizerRequest(selectedRequest.id); setSelectedRequest(null); }}
                        className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 hover:bg-emerald-500 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" /> Authorize Role
                      </button>
                      <button 
                        onClick={() => { rejectOrganizerRequest(selectedRequest.id); setSelectedRequest(null); }}
                        className="flex-1 py-4 border-2 border-rose-600 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <AlertCircle className="w-4 h-4" /> Terminate Request
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setSelectedRequest(null)}
                      className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                    >
                      Cycle Complete
                    </button>
                  )}
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
              <h3 className="text-lg font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2">Execute Protocol?</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 leading-relaxed">
                Confirm deployment of operation: <br/>
                <span className="text-indigo-600 font-black">"{showConfirm.type}"</span>?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirm(null)}
                  className="flex-1 py-3 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all font-black"
                >
                  ABORT
                </button>
                <button 
                  onClick={() => { showConfirm.action(); setShowConfirm(null); }}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-95 font-black italic"
                >
                  INITIALIZE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
