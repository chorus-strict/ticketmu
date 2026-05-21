import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  QrCode,
  History,
  Ticket as TicketIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate, formatDateTime, getImageUrl, cn } from '../../lib/utils';

interface TicketGridViewProps {
  tickets: any[];
  isPageLoading: boolean;
  onOpenTicket: (ticket: any) => void;
  language: string;
  t: (key: string) => string;
}

export default function TicketGridView({ tickets, isPageLoading, onOpenTicket, language, t }: TicketGridViewProps) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500 text-white border-emerald-500';
      case 'USED': return 'bg-indigo-500/90 text-white border-indigo-400/50';
      case 'EXPIRED': return 'bg-rose-500/90 text-white border-rose-400/50';
      case 'CANCELLED': return 'bg-slate-900/90 text-slate-400 border-white/10';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  if (tickets.length === 0 && !isPageLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-32 text-center"
      >
        <div className="w-32 h-32 bg-slate-50 dark:bg-slate-950 rounded-[3.5rem] flex items-center justify-center mb-10 shadow-inner group">
          <History className="h-12 w-12 text-slate-200 dark:text-slate-800 group-hover:text-indigo-600 transition-colors" />
        </div>
        <h3 className="text-3xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-6">Archive Empty</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm font-black uppercase tracking-[0.3em] leading-loose mb-12 italic">Your digital asset portfolio is currently inactive. Secure your access to ongoing experiences.</p>
        <Link to="/" className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all text-[11px] hover:bg-slate-900">
          Explore New Strategy
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 lg:gap-12">
      <AnimatePresence mode="popLayout">
        {tickets.map((ticket) => (
          <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            key={ticket.id} 
            className={cn(
              "bg-white dark:bg-slate-900 rounded-[3.5rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col group transition-all duration-700 hover:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] hover:-translate-y-2",
              ticket.ticketStatus !== 'ACTIVE' && "opacity-60 grayscale-[0.5] blur-[0.5px]"
            )}
          >
            {/* Event Header */}
            <div className="h-60 relative overflow-hidden flex-none">
               <img 
                src={getImageUrl(ticket.event?.image, ticket.event?.category || 'Other')} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" 
                alt={ticket.event?.title} 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.style.backgroundImage = `url(${getImageUrl(null, ticket.event?.category || 'Other')})`;
                  e.currentTarget.parentElement!.style.backgroundSize = 'cover';
                }}
               />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent"></div>
               <div className="absolute top-6 right-6">
                  <div className={cn(
                    "px-6 py-2 rounded-xl text-[9px] font-black tracking-[0.3em] uppercase border backdrop-blur-xl shadow-2xl transition-all duration-500 group-hover:scale-110",
                    getStatusStyle(ticket.ticketStatus)
                  )}>
                     {ticket.ticketStatus}
                  </div>
               </div>
               
               <div className="absolute bottom-6 left-8 right-8">
                  <h3 className="text-2xl font-display font-black text-white uppercase italic leading-none tracking-tighter truncate group-hover:tracking-normal transition-all duration-700">{ticket.event?.title}</h3>
               </div>
            </div>

            <div className="p-10 flex flex-col flex-1">
               <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-5">
                     <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Calendar className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 opacity-60">Executive Date</p>
                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase italic">{formatDate(ticket.event?.date || '')}</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-5">
                     <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <MapPin className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 opacity-60">Secure Location</p>
                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase italic truncate max-w-[180px]">{ticket.event?.location}</p>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-5">
                     <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <TicketIcon className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 opacity-60">Portal Tier</p>
                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase italic truncate max-w-[180px]">{ticket.ticketTier?.name || 'Standard Access'}</p>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-5 opacity-40 group-hover:opacity-100 transition-opacity">
                     <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                        <Clock className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Asset Acquired</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight italic">{formatDateTime(ticket.createdAt || ticket.purchasedAt, language === 'id' ? 'id-ID' : 'en-US')}</p>
                     </div>
                  </div>
               </div>

               <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-2 block opacity-40">Digital Signature</span>
                     <span className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">#{ticket.id.slice(-8).toUpperCase()}</span>
                  </div>
                  <button 
                    onClick={() => onOpenTicket(ticket)}
                    className={cn(
                      "w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shadow-2xl group/btn",
                      ticket.ticketStatus === 'ACTIVE' 
                        ? 'bg-slate-950 dark:bg-indigo-600 text-white hover:scale-110 active:scale-95 group-hover:rotate-6' 
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-300 cursor-not-allowed'
                    )}
                  >
                     <QrCode className="w-8 h-8 group-hover/btn:scale-110 transition-all" />
                  </button>
               </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
