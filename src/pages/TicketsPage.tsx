import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
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
  AlertCircle
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useManagement } from '../contexts/ManagementContext';
import { formatDate, formatDateTime, getImageUrl, cn, formatTicketId } from '../lib/utils';
import { getFallbackImage } from '../lib/imageSync';
import { QRCodeCanvas } from 'qrcode.react';
import Layout from '../components/layout/Layout';
import { toPng } from 'html-to-image';

export default function TicketsPage() {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PAST'>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [localTickets, setLocalTickets] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  
  const fetchingRef = useRef(false);
  const ticketRef = useRef<HTMLDivElement>(null);
  
  const { t, language } = useSettings();
  const { user } = useAuth();
  const { fetchTicketsPaginated } = useManagement();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopyId = (id: string) => {
    const displayId = formatTicketId(id);
    navigator.clipboard.writeText(displayId);
    setCopiedId(true);
    showToast(`${t('common.copied' as any) || 'Copied'}: ${displayId}`);
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
      showToast('Ticket downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      showToast('Failed to download ticket', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!selectedTicket) return;
    
    const displayId = formatTicketId(selectedTicket.id);
    const shareData = {
      title: `Ticket: ${selectedTicket.event?.title}`,
      text: `Check out my ticket for ${selectedTicket.event?.title}. ID: ${displayId}`,
      url: window.location.href
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        showToast('Link copied to clipboard');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        showToast('Failed to share', 'error');
      }
    }
  };

  const fetchPage = useCallback(async (pageNum: number) => {
    if (fetchingRef.current) return;
    
    fetchingRef.current = true;
    setIsPageLoading(true);
    
    try {
      const statusFilter = filter === 'ACTIVE' ? 'ACTIVE' : filter === 'PAST' ? 'USED' : undefined;
      const result = await fetchTicketsPaginated(pageNum, 6, { status: statusFilter });
      
      setLocalTickets(result.tickets);
      setTotalPages(result.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setIsPageLoading(false);
      fetchingRef.current = false;
      // Removed automatic scroll to top for smoother background updates
    }
  }, [filter, fetchTicketsPaginated]);

  // Reset and load on filter change
  useEffect(() => {
    fetchPage(1);
    // Silent scroll on filter change
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [filter, fetchPage]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500 text-white border-emerald-500';
      case 'USED': return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  const handleOpenTicket = (ticket: any) => {
    if (ticket.status === 'ACTIVE') {
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
            className="fixed top-20 right-4 z-[100] flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Syncing</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-10">
        
        {/* Header Section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-display font-extrabold text-slate-900 dark:text-white uppercase italic tracking-tight">{t('nav.tickets')}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-2">Manage your digital passes and entry codes</p>
          </div>

          {/* Filter Chips */}
          <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 self-start shadow-sm flex-wrap">
            {(['ALL', 'ACTIVE', 'PAST'] as const).map((t) => (
              <button 
                key={t}
                onClick={() => setFilter(t)}
                className={`px-6 py-2 rounded-xl font-bold text-[10px] tracking-widest uppercase transition-all ${
                  filter === t 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-slate-400 dark:text-slate-500 hover:text-indigo-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Tickets Grid */}
        <section className="pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {localTickets.length > 0 ? (
                localTickets.map((ticket) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    key={ticket.id} 
                    className={`bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col group transition-all hover:shadow-2xl hover:shadow-indigo-900/5 ${ticket.status !== 'ACTIVE' ? 'opacity-60 grayscale' : ''}`}
                  >
                    {/* Event Header */}
                    <div className="h-44 relative overflow-hidden flex-none">
                       <img 
                        src={getImageUrl(ticket.event?.image, ticket.event?.category || 'Other')} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                        alt={ticket.event?.title} 
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          const cat = ticket.event?.category || 'Other';
                          e.currentTarget.src = getImageUrl(null, cat);
                        }}
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                       <div className="absolute top-4 right-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                          <div className={`px-4 py-1.5 rounded-full text-[9px] font-bold tracking-[0.2em] uppercase border backdrop-blur-md ${getStatusStyle(ticket.status)}`}>
                             {ticket.status}
                          </div>
                       </div>
                    </div>

                    <div className="p-8 flex flex-col flex-1">
                       <div className="flex-1">
                          <h3 className="text-xl font-display font-extrabold text-slate-900 dark:text-white uppercase italic leading-tight mb-4 group-hover:text-indigo-600 transition-colors line-clamp-1">{ticket.event?.title}</h3>
                          
                          <div className="space-y-3">
                             <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                <Calendar className="w-4 h-4 text-indigo-500" />
                                <span>{formatDate(ticket.event?.date || '')}</span>
                             </div>
                             <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 font-medium text-[9px] uppercase tracking-widest mt-1">
                                <Clock className="w-4 h-4 text-slate-300" />
                                <span>{language === 'id' ? 'Dibeli' : 'Purchased'}: {formatDateTime(ticket.createdAt || ticket.purchaseDate, language === 'id' ? 'id-ID' : 'en-US')}</span>
                             </div>
                             <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                <MapPin className="w-4 h-4 text-indigo-500" />
                                <span className="truncate">{ticket.event?.location}</span>
                             </div>
                          </div>
                       </div>

                       <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <div>
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1 block">Ticket Reference</span>
                             <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">#{ticket.id.slice(-8).toUpperCase()}</span>
                          </div>
                          <button 
                            onClick={() => handleOpenTicket(ticket)}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md group/btn ${ticket.status === 'ACTIVE' ? 'bg-slate-900 dark:bg-indigo-600 text-white hover:scale-110 active:scale-90' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
                          >
                             <QrCode className="w-6 h-6 group-hover/btn:rotate-12 transition-transform" />
                          </button>
                       </div>
                    </div>
                  </motion.div>
                ))
              ) : !isPageLoading && (
                <div className="md:col-span-2 xl:col-span-3 flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner">
                    <History className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4">No Digital Passes</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs font-bold uppercase tracking-widest leading-loose mb-10">You haven't secured any tickets for this category.</p>
                  <Link to="/" className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/30 active:scale-95 transition-all text-xs">
                    Find New Experiences
                  </Link>
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <section className="flex items-center justify-center gap-3 py-10 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => fetchPage(page - 1)}
              disabled={page === 1 || isPageLoading}
              className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-600/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                // Showing limited page numbers for cleaner UI
                if (totalPages > 5) {
                   if (p > 1 && p < totalPages && Math.abs(p - page) > 1) {
                      if (p === 2 || p === totalPages - 1) return <span key={p} className="text-slate-300">...</span>;
                      return null;
                   }
                }

                return (
                  <button 
                    key={p}
                    onClick={() => fetchPage(p)}
                    disabled={isPageLoading}
                    className={`w-12 h-12 rounded-2xl font-bold text-xs tracking-tighter transition-all ${
                      page === p 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                        : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:text-indigo-600 border border-slate-200 dark:border-slate-800 shadow-sm'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button 
              onClick={() => fetchPage(page + 1)}
              disabled={page === totalPages || isPageLoading}
              className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-600/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </section>
        )}
      </main>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-6 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md",
              toast.type === 'success' 
                ? "bg-emerald-500/90 text-white border-emerald-400/50" 
                : "bg-rose-500/90 text-white border-rose-400/50"
            )}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-xs font-bold uppercase tracking-widest">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ticket QR Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-5 overflow-y-auto">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setSelectedTicket(null)}
               className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 50 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 50 }}
               className="relative w-full max-w-sm bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border border-white/10"
             >
                <div ref={ticketRef} className="bg-slate-900">
                  <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 flex justify-between items-center text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                    <div className="relative z-10">
                      <h3 className="font-display font-extrabold text-xl uppercase tracking-tighter italic">E-Pass Access</h3>
                      <p className="text-[10px] font-bold opacity-70 uppercase tracking-[0.2em] mt-1">Authorized Digital Ticket</p>
                    </div>
                    <button onClick={() => setSelectedTicket(null)} className="relative z-10 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all">
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="p-8 flex flex-col items-center">
                    {/* Ticket ID Section */}
                    <div 
                      onClick={() => handleCopyId(selectedTicket.id)}
                      className="mb-8 p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 cursor-pointer group hover:bg-white/10 transition-all"
                    >
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Ticket ID</span>
                        <span className="text-sm font-mono font-bold text-white tracking-widest">
                          {formatTicketId(selectedTicket.id)}
                        </span>
                      </div>
                      <div className="w-8 h-8 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                        {copiedId ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] border-4 border-slate-800 mb-8 shadow-2xl shadow-indigo-500/20">
                        <QRCodeCanvas 
                          value={selectedTicket.qrCode} 
                          size={180}
                          level="H"
                          fgColor="#0f172a"
                          includeMargin={false}
                        />
                    </div>

                    <div className="w-full text-center mb-8">
                        <h2 className="text-2xl font-display font-extrabold text-white uppercase italic leading-tight mb-2 line-clamp-2">{selectedTicket.event?.title}</h2>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">
                            {formatDate(selectedTicket.event?.date || '', language === 'id' ? 'id-ID' : 'en-US')}
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                           <Clock className="w-3.5 h-3.5 text-slate-500" />
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">
                              {language === 'id' ? 'Dibeli' : 'Purchased'}: {formatDateTime(selectedTicket.createdAt || selectedTicket.purchaseDate, language === 'id' ? 'id-ID' : 'en-US')}
                           </p>
                        </div>
                    </div>

                    <div className="w-full grid grid-cols-2 gap-4 py-6 border-t border-white/5">
                        <div className="flex flex-col">
                           <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1.5">Access Tier</span>
                           <span className="text-[11px] font-black text-white uppercase italic">Standard Pass</span>
                        </div>
                        <div className="flex flex-col text-right">
                           <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1.5">Gate Access</span>
                           <span className="text-[11px] font-black text-white uppercase italic">Main Entrance</span>
                        </div>
                    </div>

                    <div className="w-full mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-center">
                       <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-[0.3em]">Verified Digital Asset • Ready for Scan</p>
                    </div>
                  </div>
                </div>

                <div className="px-8 pb-8 flex gap-4">
                   <button 
                     onClick={handleDownload}
                     disabled={isDownloading}
                     className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all text-[10px] uppercase tracking-widest border border-white/10 disabled:opacity-50"
                   >
                     {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                     Download
                   </button>
                   <button 
                     onClick={handleShare}
                     className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition-all text-[10px] uppercase tracking-widest"
                   >
                     <Share2 className="w-4 h-4" />
                     Share
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
