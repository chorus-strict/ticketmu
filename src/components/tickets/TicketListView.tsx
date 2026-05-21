import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  QrCode,
  History,
  ChevronRight,
  Ticket as TicketIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate, formatDateTime, getImageUrl, cn, formatTicketId } from '../../lib/utils';

interface TicketListViewProps {
  tickets: any[];
  isPageLoading: boolean;
  onOpenTicket: (ticket: any) => void;
  language: string;
  t: (key: string) => string;
}

export default function TicketListView({ tickets, isPageLoading, onOpenTicket, language, t }: TicketListViewProps) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'USED': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      case 'EXPIRED': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'CANCELLED': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500';
      case 'USED': return 'bg-indigo-500';
      case 'EXPIRED': return 'bg-rose-500';
      case 'CANCELLED': return 'bg-slate-500';
      default: return 'bg-slate-300';
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
    <div className="flex flex-col gap-6">
      <AnimatePresence mode="popLayout">
        {tickets.map((ticket) => (
          <motion.div 
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            key={ticket.id} 
            onClick={() => ticket.ticketStatus === 'ACTIVE' && onOpenTicket(ticket)}
            className={cn(
              "group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row items-stretch transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] hover:border-indigo-600/20 cursor-pointer p-4 gap-6",
              ticket.ticketStatus !== 'ACTIVE' && "opacity-60 grayscale-[0.3]"
            )}
          >
            {/* Thumbnail */}
            <div className="w-full md:w-56 h-40 md:h-auto rounded-[2rem] overflow-hidden relative flex-shrink-0">
              <img 
                src={getImageUrl(ticket.event?.image, ticket.event?.category || 'Other')} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                alt={ticket.event?.title}
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-between py-2 px-2">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{ticket.event?.category}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{formatTicketId(ticket.id)}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">{ticket.event?.title}</h3>
                </div>

                {/* Status for Large Screens */}
                <div className="hidden lg:flex items-center gap-4">
                  <div className={cn(
                    "px-5 py-2 rounded-xl text-[9px] font-black tracking-widest uppercase border flex items-center gap-2",
                    getStatusStyle(ticket.ticketStatus)
                  )}>
                    <div className={cn("w-1.5 h-1.5 rounded-full", getStatusDot(ticket.ticketStatus))} />
                    {ticket.ticketStatus}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold uppercase italic">{formatDate(ticket.event?.date || '')}</span>
                </div>
                
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold uppercase italic truncate">{ticket.event?.location}</span>
                </div>

                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <TicketIcon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold uppercase italic">{ticket.ticketTier?.name || 'Standard Access'}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions (Desktop only as a side column, Mobile integrated) */}
            <div className="flex items-center justify-between md:flex-col md:justify-center gap-4 md:px-6 md:border-l border-slate-100 dark:border-slate-800">
              {/* Status for Mobile/Tablet */}
              <div className={cn(
                "lg:hidden px-4 py-1.5 rounded-lg text-[8px] font-black tracking-widest uppercase border flex items-center gap-2",
                getStatusStyle(ticket.ticketStatus)
              )}>
                <div className={cn("w-1 h-1 rounded-full", getStatusDot(ticket.ticketStatus))} />
                {ticket.ticketStatus}
              </div>

              <div className={cn(
                "w-12 h-12 md:w-16 md:h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shadow-2xl",
                ticket.ticketStatus === 'ACTIVE' 
                  ? 'bg-slate-950 dark:bg-indigo-600 text-white group-hover:scale-110 group-hover:rotate-3' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-300'
              )}>
                <QrCode className="w-6 h-6 md:w-8 md:h-8" />
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
