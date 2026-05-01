import React, { useState } from 'react';
import { 
  QrCode, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  Calendar, 
  Ticket as TicketIcon,
  ShieldCheck,
  History,
  XCircle,
  Loader2,
  Clock
} from 'lucide-react';
import { useManagement, Ticket } from '../../contexts/ManagementContext';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate, formatTicketId } from '../../lib/utils';

export default function TicketValidation() {
  const { validateTicket, events, users } = useManagement();
  const [ticketCode, setTicketCode] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string; ticket?: Ticket } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleValidate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!ticketCode.trim()) return;

    setIsLoading(true);
    // Simulate scan delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const validation = await validateTicket(ticketCode);
    setResult(validation);
    setIsLoading(false);
    setTicketCode('');
  };

  const getEventData = (eventId: string) => {
    return events.find(e => e.id === eventId);
  };

  const getUserData = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  return (
    <div className="space-y-6">
      {/* Scanner Header */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-black p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        
        <div className="flex items-center gap-4 mb-8 relative z-10">
           <div className="w-14 h-14 bg-indigo-600/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-indigo-500/30 shadow-inner">
              <QrCode className="w-7 h-7 text-indigo-400" />
           </div>
           <div>
              <h2 className="text-2xl font-display font-extrabold uppercase italic leading-none tracking-tighter text-white">Ticket Validator</h2>
              <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.2em] mt-1.5 opacity-80">Secure Event Admission Control</p>
           </div>
        </div>
        
        <form onSubmit={handleValidate} className="relative z-10">
           <div className="flex flex-col gap-2 mb-2">
              <label className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest ml-1">Enter Ticket ID</label>
              <div className="relative group">
                 <div className="absolute left-5 top-1/2 -translate-y-1/2 p-2 bg-indigo-500/10 rounded-lg group-focus-within:bg-indigo-500/20 transition-colors">
                    <TicketIcon className="h-5 w-5 text-indigo-400 group-focus-within:text-white transition-colors" />
                 </div>
                 <input 
                   type="text" 
                   placeholder="e.g. TKT-B6F2-8A91"
                   value={ticketCode}
                   onChange={(e) => setTicketCode(e.target.value)}
                   className="w-full pl-16 pr-36 py-5 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono font-bold text-base text-white placeholder:text-slate-600 placeholder:font-sans"
                 />
                 <button 
                   type="submit"
                   disabled={isLoading || !ticketCode.trim()}
                   className="absolute right-2.5 top-2.5 bottom-2.5 px-8 bg-indigo-600 hover:bg-white hover:text-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                 >
                   {isLoading ? (
                     <div className="flex items-center gap-2">
                       <Loader2 className="w-3 h-3 animate-spin" />
                       <span>Verifying...</span>
                     </div>
                   ) : 'Manual Verify'}
                 </button>
              </div>
              <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest ml-1">Paste or type ticket code manually for verification</p>
           </div>
        </form>
      </div>

      {/* Result Display */}
      <AnimatePresence mode="wait">
        {result ? (
          <motion.div 
            key={result.ticket?.id || 'error'}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`rounded-[2.5rem] border p-8 flex flex-col md:flex-row gap-8 shadow-2xl overflow-hidden relative ${
                result.success 
                  ? 'bg-white dark:bg-slate-900 border-emerald-500/30' 
                  : 'bg-white dark:bg-slate-900 border-rose-500/30'
              }`}
          >
            {/* Status Indicator Bar */}
            <div className={`absolute top-0 bottom-0 left-0 w-3 ${result.success ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

            <div className="flex-1 flex flex-col sm:flex-row gap-8 items-start relative z-10">
               <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 shadow-lg ${
                 result.success 
                   ? 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 border border-emerald-500/20' 
                   : 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 border border-rose-500/20'
               }`}>
                  {result.success ? <CheckCircle className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
               </div>
               
               <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-sm ${
                      result.success ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}>
                      {result.success ? 'VALIDATED' : 'ACCESS DENIED'}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                       {result.message}
                    </span>
                    {result.success && (
                       <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 ml-auto">
                          <Clock className="w-3 h-3 line-none" />
                          {new Date().toLocaleTimeString()}
                       </span>
                    )}
                  </div>

                  {result.ticket && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12 mt-8 py-8 border-t border-slate-100 dark:border-slate-800">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
                             <TicketIcon className="w-5 h-5 text-indigo-500" />
                          </div>
                          <div>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ticket Instance</p>
                             <p className="text-sm font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                {formatTicketId(result.ticket.id)}
                             </p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
                             <User className="w-5 h-5 text-indigo-500" />
                          </div>
                          <div>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pass Holder</p>
                             <p className="text-sm font-bold text-slate-900 dark:text-white leading-none capitalize">
                                {getUserData(result.ticket.userId)?.name || 'Guest User'}
                             </p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
                             <Calendar className="w-5 h-5 text-indigo-500" />
                          </div>
                          <div>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Event Entry</p>
                             <p className="text-sm font-bold text-slate-900 dark:text-white uppercase italic truncate max-w-[180px]">
                                {getEventData(result.ticket.eventId)?.title}
                             </p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
                             <ShieldCheck className="w-5 h-5 text-indigo-500" />
                          </div>
                          <div>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Validation Metadata</p>
                             <p className="text-sm font-bold text-slate-900 dark:text-white uppercase">One-Time Entry • Authorized</p>
                          </div>
                       </div>
                    </div>
                  )}
               </div>
            </div>

            <div className="flex flex-col justify-center md:border-l border-slate-100 dark:border-slate-800 md:pl-10">
                <button 
                  onClick={() => setResult(null)}
                  className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-xl"
                >
                  Clear & Ready
                </button>
            </div>
          </motion.div>
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center px-10 bg-slate-50/50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
             <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner border border-slate-100 dark:border-slate-800">
                <ShieldCheck className="w-10 h-10 text-slate-200 dark:text-slate-800" />
             </div>
             <h3 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white uppercase italic tracking-tighter">System Idle</h3>
             <p className="text-xs text-slate-400 tracking-widest uppercase font-bold mt-4 leading-loose max-w-xs mx-auto">
               Input Ticket ID above or use scanner to start verification process
             </p>
          </div>
        )}
      </AnimatePresence>

      {/* Validation Guide */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
         {[
           { icon: <QrCode className="w-5 h-5" />, title: 'Scan QR Code', desc: 'Point camera or enter unique TKT-ID' },
           { icon: <CheckCircle className="w-5 h-5" />, title: 'Instant Verify', desc: 'Checks database for active status' },
           { icon: <History className="w-5 h-5" />, title: 'Logs Access', desc: 'Auto-marks ticket as "Used"' }
         ].map((step, i) => (
           <div key={i} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                {step.icon}
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-1">{step.title}</h4>
              <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase">{step.desc}</p>
           </div>
         ))}
      </div>
    </div>
  );
}
