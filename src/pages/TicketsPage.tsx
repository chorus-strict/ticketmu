import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { 
    Calendar, 
    MapPin, 
    History, 
    CheckCircle2, 
    Clock, 
    X, 
    Share2, 
    Download,
    QrCode,
    ChevronRight,
    ArrowRight,
    ArrowLeft,
    Loader2,
    Copy,
    Check,
    AlertCircle,
    Maximize2,
    Minimize2,
    Info,
    ExternalLink,
    Shield,
    Ticket as TicketIcon
  } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useManagement } from '../contexts/ManagementContext';
import { safeStorage } from '../lib/safeStorage';
import { formatDate, formatDateTime, getImageUrl, cn, formatTicketId } from '../lib/utils';
import { getFallbackImage } from '../lib/imageSync';
import { QRCodeCanvas } from 'qrcode.react';
import Layout from '../components/layout/Layout';
import { toPng } from 'html-to-image';
import toast from 'react-hot-toast';
import TicketViewSwitcher from '../components/tickets/TicketViewSwitcher';
import TicketGridView from '../components/tickets/TicketGridView';
import TicketListView from '../components/tickets/TicketListView';

export default function TicketsPage() {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED'>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [localTickets, setLocalTickets] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showFullQR, setShowFullQR] = useState(false);
  
  const fetchingRef = useRef(false);
  const ticketRef = useRef<HTMLDivElement>(null);
  
  const { t, language } = useSettings();
  const { user } = useAuth();
  const { fetchTicketsPaginated } = useManagement();

  // Persistence for view mode
  useEffect(() => {
    const savedView = safeStorage.getItem('tickets-view-mode');
    if (savedView === 'list' || savedView === 'grid') {
      setViewMode(savedView);
    }
  }, []);

  const handleViewChange = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    safeStorage.setItem('tickets-view-mode', mode);
  };

  const handleCopyId = (id: string) => {
    const displayId = formatTicketId(id);
    navigator.clipboard.writeText(displayId);
    setCopiedId(true);
    toast.success(`${t('common.copied' as any) || 'Copied'}: ${displayId}`, {
      style: {
        borderRadius: '1rem',
        background: '#0f172a',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '0.75rem',
        textTransform: 'uppercase'
      }
    });
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleDownload = async () => {
    if (!ticketRef.current || !selectedTicket) return;
    
    setIsDownloading(true);
    try {
      // Small delay to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await toPng(ticketRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#0f172a', // slate-900
      });
      
      const link = document.createElement('a');
      const eventName = selectedTicket.event?.title.toLowerCase().replace(/\s+/g, '-');
      const ticketIdNum = selectedTicket.id.slice(-8).toUpperCase();
      link.download = `tiketmu-${eventName}-${ticketIdNum}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Ticket downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download ticket');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!selectedTicket) return;
    
    const displayId = formatTicketId(selectedTicket.id);
    const eventTitle = selectedTicket.event?.title || 'Event';
    
    try {
      const shareData = {
        title: `Tiketmu: ${eventTitle}`,
        text: `Check out my ticket for ${eventTitle}. Pass ID: ${displayId}`,
        url: `${window.location.origin}/event/${selectedTicket.event?.slug || selectedTicket.eventId}`,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        toast.success('Event link copied to clipboard', {
          style: {
            borderRadius: '1rem',
            background: '#0f172a',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '0.75rem',
            textTransform: 'uppercase'
          },
          iconTheme: {
            primary: '#4f46e5',
            secondary: '#fff',
          },
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error('Failed to share event', {
          style: {
            borderRadius: '1rem',
            background: '#e11d48',
            color: '#fff',
            fontWeight: 'bold'
          }
        });
      }
    }
  };

  const fetchPage = useCallback(async (pageNum: number) => {
    if (fetchingRef.current) return;
    
    fetchingRef.current = true;
    setIsPageLoading(true);
    
    try {
      const statusFilter = filter === 'ALL' ? undefined : filter;
      const result = await fetchTicketsPaginated(pageNum, 6, { status: statusFilter });
      
      setLocalTickets(result.tickets);
      setTotalPages(result.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setIsPageLoading(false);
      fetchingRef.current = false;
    }
  }, [filter, fetchTicketsPaginated]);

  // Supabase Realtime Listener for real-time ticket sync
  useEffect(() => {
    if (!user) return;

    const supabase = (window as any).supabase; // Using global or through context if available
    if (!supabase) return;

    const channel = supabase
      .channel('ticket_status_sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Ticket',
          filter: `userId=eq.${user.id}`,
        },
        () => {
          fetchPage(page);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, page, fetchPage]);

  // Reset and load on filter change
  useEffect(() => {
    fetchPage(1);
    // Silent scroll on filter change
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [filter, fetchPage]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500 text-white border-emerald-500';
      case 'USED': return 'bg-indigo-500/90 text-white border-indigo-400/50';
      case 'EXPIRED': return 'bg-rose-500/90 text-white border-rose-400/50';
      case 'CANCELLED': return 'bg-slate-900/90 text-slate-400 border-white/10';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  const handleOpenTicket = (ticket: any) => {
    if (ticket.ticketStatus === 'ACTIVE') {
      setSelectedTicket(ticket);
    }
  };

  return (
    <Layout>
      {/* Non-blocking Sync Indicator */}
      <AnimatePresence>
        {isPageLoading && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-24 right-8 z-[100] flex items-center gap-3 bg-white/10 dark:bg-slate-900/40 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/10 shadow-2xl"
          >
            <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Synching Data</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 py-12 lg:py-24">
        
        {/* Header Section */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-20">
          <div className="relative">
            <div className="absolute -top-10 -left-6 w-24 h-24 bg-indigo-600/10 blur-3xl rounded-full"></div>
            <h1 className="text-5xl sm:text-6xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">{t('nav.tickets')}</h1>
            <p className="text-slate-400 dark:text-slate-500 text-[11px] font-black uppercase tracking-[0.4em] mt-6 italic opacity-60">Architecting your digital access portfolio</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* View Switcher */}
            <TicketViewSwitcher viewMode={viewMode} onViewChange={handleViewChange} />

            {/* Filter Chips */}
            <div className="flex bg-slate-50 dark:bg-slate-950 p-2 rounded-[2rem] border border-slate-100 dark:border-slate-900 shadow-inner flex-wrap gap-1">
              {(['ALL', 'ACTIVE', 'USED', 'EXPIRED', 'CANCELLED'] as const).map((t) => (
                <button 
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-6 sm:px-8 py-3 rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase transition-all duration-500 ${
                    filter === t 
                      ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30' 
                      : 'text-slate-400 dark:text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Tickets Grid / List */}
        <section className="pb-20">
          <LayoutGroup>
            {viewMode === 'grid' ? (
              <TicketGridView 
                tickets={localTickets} 
                isPageLoading={isPageLoading} 
                onOpenTicket={handleOpenTicket}
                language={language}
                t={t}
              />
            ) : (
              <TicketListView 
                tickets={localTickets} 
                isPageLoading={isPageLoading} 
                onOpenTicket={handleOpenTicket}
                language={language}
                t={t}
              />
            )}
          </LayoutGroup>
        </section>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <section className="flex items-center justify-center gap-6 py-16 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => fetchPage(page - 1)}
              disabled={page === 1 || isPageLoading}
              className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:border-indigo-600/50 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-xl active:scale-90"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3">
              {Array.from({ length: Math.max(0, totalPages || 0) }, (_, i) => i + 1).map((p) => {
                if (totalPages > 5) {
                   if (p > 1 && p < totalPages && Math.abs(p - page) > 1) {
                      if (p === 2 || p === totalPages - 1) return <span key={p} className="text-slate-300 font-black">•••</span>;
                      return null;
                   }
                }

                return (
                  <button 
                    key={p}
                    onClick={() => fetchPage(p)}
                    disabled={isPageLoading}
                    className={`w-14 h-14 rounded-2xl font-black text-xs tracking-tighter transition-all duration-500 ${
                      page === p 
                        ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40 scale-110' 
                        : 'bg-white dark:bg-slate-900 text-slate-300 dark:text-slate-600 hover:text-indigo-600 border border-slate-100 dark:border-slate-800 shadow-sm'
                    }`}
                  >
                    {p < 10 ? `0${p}` : p}
                  </button>
                );
              })}
            </div>

            <button 
              onClick={() => fetchPage(page + 1)}
              disabled={page === totalPages || isPageLoading}
              className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:border-indigo-600/50 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-xl active:scale-90"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </section>
        )}
      </main>

      {/* Ticket QR Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 lg:p-8 overflow-hidden">
             {/* Backdrop */}
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => {
                 setSelectedTicket(null);
                 setShowFullQR(false);
               }}
               className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
             />
             
             <motion.div 
               initial={{ scale: 0.95, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.95, opacity: 0, y: 20 }}
               className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl lg:max-w-5xl bg-slate-900 sm:rounded-3xl overflow-hidden shadow-2xl border-t sm:border border-white/10 flex flex-col md:flex-row"
             >
                {/* Left Side: Ticket Preview */}
                <div className="flex-[1.2] bg-slate-950 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-12 border-b md:border-b-0 md:border-r border-white/10 relative overflow-y-auto no-scrollbar min-h-[400px] md:min-h-0">
                   {/* Subtle Ambient Background */}
                   <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                      <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-indigo-600/20 blur-[120px] rounded-full"></div>
                      <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-violet-600/20 blur-[120px] rounded-full"></div>
                   </div>

                   {/* Digital Pass Card */}
                   <div 
                     ref={ticketRef}
                     className="w-full max-w-[340px] sm:max-w-[380px] bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 relative"
                   >
                     {/* Pass Header */}
                     <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-8 py-8 flex justify-between items-start border-b border-white/5 relative overflow-hidden">
                       <div className="relative z-10">
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Tiketmu Pass</span>
                         <h3 className="text-xl font-bold text-white tracking-tight">{selectedTicket.ticketTier?.name === 'VIP' ? 'VIP Access' : 'General Admission'}</h3>
                       </div>
                       <div className="relative z-10 w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center border border-indigo-500/20">
                          <TicketIcon className="w-5 h-5 text-indigo-400" />
                       </div>
                     </div>

                     <div className="p-8 flex flex-col items-center gap-8">
                        {/* QR Code Container */}
                        <div className="relative group cursor-pointer" onClick={() => setShowFullQR(true)}>
                           <div className="bg-white p-6 rounded-3xl border-8 border-slate-950 shadow-lg relative">
                              <QRCodeCanvas 
                                value={selectedTicket.qrCode} 
                                size={window.innerWidth < 640 ? 140 : 180}
                                level="H"
                                fgColor="#0f172a"
                              />
                           </div>
                           <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                              <Maximize2 className="w-4 h-4" />
                           </div>
                        </div>

                        {/* Event Quick Info */}
                        <div className="w-full text-center">
                           <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 line-clamp-2 leading-tight">
                             {selectedTicket.event?.title}
                           </h2>
                           <div className="flex items-center justify-center gap-2 text-slate-400 text-xs sm:text-sm font-medium">
                              <Calendar className="w-4 h-4 text-indigo-500" />
                              <span>{formatDate(selectedTicket.event?.date || '')}</span>
                              <span className="opacity-30">•</span>
                              <span>{selectedTicket.event?.location?.split(',')[0]}</span>
                           </div>
                        </div>

                        {/* ID Badge */}
                        <div 
                          onClick={() => handleCopyId(selectedTicket.id)}
                          className="w-full py-4 px-6 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-white/10 transition-all group"
                        >
                           <div className="flex flex-col items-start">
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Pass Identifier</span>
                              <span className="text-sm font-mono font-bold text-white group-hover:text-indigo-400 transition-colors">
                                 {formatTicketId(selectedTicket.id)}
                              </span>
                           </div>
                           <div className={`transition-all ${copiedId ? 'text-emerald-400' : 'text-slate-500 group-hover:text-white'}`}>
                              {copiedId ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                           </div>
                        </div>
                     </div>

                     {/* Security Indicator */}
                     <div className="px-8 pb-6 flex items-center justify-center gap-2 opacity-30">
                        <Shield className="w-3 h-3" />
                        <span className="text-[8px] font-bold uppercase tracking-[0.2em]">Verified Secure Access</span>
                     </div>
                   </div>
                </div>

                {/* Right Side: Details & Actions */}
                <div className="flex-1 flex flex-col h-full bg-slate-900 relative">
                   {/* Header Section */}
                   <div className="p-6 sm:p-8 flex items-center justify-between border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
                      <div>
                         <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-[0.2em] mb-1">Entry Details</h4>
                         <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Tiketmu Verification System</p>
                      </div>
                      <button 
                         onClick={() => setSelectedTicket(null)} 
                         className="w-10 h-10 bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 text-slate-400 rounded-xl flex items-center justify-center transition-all border border-white/10"
                      >
                         <X className="h-6 w-6" />
                      </button>
                   </div>

                   {/* Scrollable Content */}
                   <div className="flex-1 p-6 sm:p-8 overflow-y-auto no-scrollbar space-y-8 pb-32 sm:pb-8">
                      {/* Event Overview Section */}
                      <section className="space-y-6">
                         <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                               <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Date & Time</label>
                               <p className="text-white font-semibold">{formatDateTime(selectedTicket.event?.date || '')}</p>
                               <p className="text-xs text-slate-500 mt-1">Doors open 1 hour before event start.</p>
                            </div>
                         </div>

                         <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
                               <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Venue Location</label>
                               <p className="text-white font-semibold">{selectedTicket.event?.location}</p>
                               <button className="text-xs text-indigo-400 font-bold mt-2 flex items-center gap-1.5 hover:text-indigo-300 transition-colors">
                                  <ExternalLink className="w-3.5 h-3.5" /> View on Maps
                               </button>
                            </div>
                         </div>
                      </section>

                      <div className="w-full h-px bg-white/5"></div>

                      {/* Ticket Spec Section */}
                      <section className="grid grid-cols-2 gap-6">
                         <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Ticket Tier</label>
                            <div className="px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl inline-flex items-center gap-2">
                               <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                               <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{selectedTicket.ticketTier?.name || 'Standard'}</span>
                            </div>
                         </div>
                         <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Status</label>
                            <div className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl inline-flex items-center gap-2">
                               <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                               <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Valid</span>
                            </div>
                         </div>
                      </section>

                      {/* Purchase Context */}
                      <section className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                         <div className="flex justify-between items-center text-[10px] uppercase tracking-wider">
                            <span className="text-slate-500">Order Reference</span>
                            <span className="text-white font-bold">#{selectedTicket.id.slice(-8).toUpperCase()}</span>
                         </div>
                         <div className="flex justify-between items-center text-[10px] uppercase tracking-wider">
                            <span className="text-slate-500">Acquired On</span>
                            <span className="text-white font-bold">{formatDateTime(selectedTicket.createdAt || selectedTicket.purchasedAt)}</span>
                         </div>
                      </section>

                      {/* Manual Verification Info */}
                      <section className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-2xl flex gap-4">
                         <Info className="w-5 h-5 text-amber-500 shrink-0" />
                         <p className="text-[11px] text-amber-500/80 leading-relaxed font-medium">
                            Please present this QR code to the event staff for scanning. If scanning fails, provide the manual Pass Identifier shown on the ticket.
                         </p>
                      </section>
                   </div>

                   {/* Footer Actions */}
                   <div className="p-6 sm:p-8 bg-slate-900 border-t border-white/5 mt-auto flex flex-col sm:flex-row gap-4 sticky bottom-0 z-20">
                      <button 
                         onClick={handleDownload}
                         disabled={isDownloading}
                         className="flex-1 h-12 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-2.5 transition-all text-xs uppercase tracking-widest border border-white/10 disabled:opacity-50"
                      >
                         {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                         Download
                      </button>
                      <button 
                         onClick={handleShare}
                         className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-600/20 transition-all text-xs uppercase tracking-widest"
                      >
                         <Share2 className="w-4 h-4" />
                         Share
                      </button>
                   </div>
                </div>
             </motion.div>

             {/* Fullscreen QR Preview */}
             <AnimatePresence>
                {showFullQR && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[300] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6"
                  >
                     <motion.div 
                       initial={{ scale: 0.9, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       exit={{ scale: 0.9, opacity: 0 }}
                       className="relative"
                     >
                        <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-2xl">
                           <QRCodeCanvas 
                             value={selectedTicket.qrCode} 
                             size={window.innerWidth < 640 ? 260 : 360}
                             level="H"
                             fgColor="#0f172a"
                           />
                        </div>
                        <button 
                           onClick={() => setShowFullQR(false)}
                           className="absolute -top-4 -right-4 w-12 h-12 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-xl border-4 border-slate-950"
                        >
                           <Minimize2 className="w-6 h-6" />
                        </button>
                     </motion.div>
                     <div className="mt-12 text-center">
                        <h5 className="text-xl font-bold text-white mb-2">Scan for Entry</h5>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">Presenter scan at high brightness</p>
                     </div>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
