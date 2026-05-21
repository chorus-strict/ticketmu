import { useState, useEffect } from 'react';
import { 
  Heart, 
  Calendar, 
  MapPin, 
  ChevronDown, 
  Star, 
  Ticket, 
  Share2, 
  Lock,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Navigation,
  Loader2
} from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../contexts/AuthContext';
import { useManagement } from '../contexts/ManagementContext';
import { useSettings } from '../contexts/SettingsContext';
import { formatDate, formatCurrency, getImageUrl } from '../lib/utils';
import { getFallbackImage } from '../lib/imageSync';
import Layout from '../components/layout/Layout';

// Fix for default marker icon in Leaflet
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useSettings();
  const { events, cart, addToCart, buyNow, toggleFavorite, isFavorited } = useManagement();
  
  const event = events.find(e => e.id === id || e.slug === id);
  const [selectedTierId, setSelectedTierId] = useState<string | undefined>(
    event?.ticketTiers && event.ticketTiers.length > 0 ? event.ticketTiers[0].id : undefined
  );

  useEffect(() => {
    if (event?.ticketTiers && event.ticketTiers.length > 0 && !selectedTierId) {
      setSelectedTierId(event.ticketTiers[0].id);
    }
  }, [event, selectedTierId]);

  useEffect(() => {
    if (event) {
      document.title = `${event.title} | TIKETMU`;
      
      const updateOrCreateMeta = (property: string, content: string, isName = false) => {
        const attribute = isName ? 'name' : 'property';
        let element = document.querySelector(`meta[${attribute}="${property}"]`);
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute(attribute, property);
          document.head.appendChild(element);
        }
        element.setAttribute('content', content);
      };

      updateOrCreateMeta('og:title', event.title);
      updateOrCreateMeta('og:description', event.description || '');
      updateOrCreateMeta('og:image', event.image || '');
      updateOrCreateMeta('og:url', window.location.href);
      updateOrCreateMeta('og:type', 'website');
      updateOrCreateMeta('description', event.description || '', true);

      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', window.location.origin + `/event/${event.slug || event.id}`);
    }
  }, [event]);

  console.log('Event details:', event);
  const isLiked = event ? isFavorited(event.id) : false;
  const [expandedSection, setExpandedSection] = useState<string | null>('about');

  // isFavorited is now reactive to favoriteEventIds in context, no useEffect needed here for isLiked state


  if (!event) {
    return (
      <div className="bg-surface min-h-screen flex flex-col items-center justify-center p-5 text-center dark:bg-slate-955">
        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/20 rounded-full flex items-center justify-center mb-6">
          <Calendar className="h-10 w-10 text-rose-500 dark:text-rose-400" />
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-2">Event No Longer Available</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">This event is no longer available as it has been archived by the organizer, but all purchased tickets and transaction history remain fully valid.</p>
        <button onClick={() => navigate('/')} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform hover:bg-indigo-700">
          Back to Explore
        </button>
      </div>
    );
  }

  const isPremiumEvent = event.visibility === 'PREMIUM';
  const isPremiumUser = !!(user?.membershipExpiredAt && new Date(user.membershipExpiredAt) > new Date());
  const hasAccess = !isPremiumEvent || isPremiumUser;
  const isItemInCart = cart.some(item => item.eventId === event.id);

  const handleToggleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (event.id) await toggleFavorite(event.id);
  };

  const openNavigation = () => {
    let url = '';
    if (event.latitude && event.longitude) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`;
    } else if (event.location) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;
    }
    
    if (url) {
      window.open(url, '_blank');
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const [isBuying, setIsBuying] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleBuyNow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!hasAccess) return;
    
    setIsBuying(true);
    try {
      const res = await buyNow(event, selectedTierId);
      if (res?.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else if (res?.orderId) {
        navigate('/payment', { state: { orderId: res.orderId } });
      }
    } catch (err) {
      console.error('Buy Now fail:', err);
    } finally {
      setIsBuying(false);
    }
  };

  const handleAddToCart = async () => {
    if (!hasAccess) return;
    setIsAdding(true);
    try {
      await addToCart(event, selectedTierId);
    } catch (err) {
      console.error('Add to cart fail:', err);
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleShare = async () => {
    if (!event) return;
    
    try {
      const shareData = {
        title: event.title,
        text: `Check out this event on Tiketmu: ${event.title}`,
        url: window.location.href, // Or generate a cleaner one if needed
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Event link copied to clipboard', {
          style: {
            borderRadius: '1rem',
            background: '#0f172a',
            color: '#fff',
            fontFamily: 'inherit',
            fontSize: 'max(10px, 0.75rem)',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
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

  const selectedTier = event.ticketTiers?.find(t => t.id === selectedTierId);
  const effectivePrice = selectedTier ? selectedTier.price : event.price;

  return (
    <Layout>
      {/* MOBILE NAV OVERLAY (Hidden on Desktop) */}
      <div className="lg:hidden fixed top-4 left-4 z-[60] flex gap-2">
         <button onClick={() => navigate(-1)} className="w-12 h-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all shadow-2xl">
            <ArrowLeft className="w-6 h-6" />
         </button>
      </div>

      <main className="max-w-[1440px] mx-auto px-0 sm:px-6 lg:px-8 lg:py-12 pb-32 lg:pb-12">
        
        {/* DESKTOP BREADCRUMB */}
        <div className="hidden lg:flex items-center gap-4 mb-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
           <Link to="/" className="hover:text-indigo-600 transition-colors">Digital Explorer</Link>
           <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
           <span className="hover:text-indigo-600 transition-colors">{event.category}</span>
           <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
           <span className="text-slate-900 dark:text-white">{event.title}</span>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 xl:gap-16">
          {/* LEFT CONTENT COLUMN (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            
            {/* HERO IMAGE SECTION */}
            <div className="relative w-full aspect-[4/3] sm:aspect-video lg:aspect-[16/7] lg:rounded-[3.5rem] overflow-hidden group shadow-2xl border border-slate-100 dark:border-slate-800">
              <motion.img 
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.5 }}
                src={getImageUrl(event.image, event.category)} 
                alt={event.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getImageUrl(null, event.category);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
              
              <div className="absolute top-8 right-8 flex gap-4">
                 <button onClick={handleToggleFavorite} className={`w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-2xl border border-white/20 transition-all active:scale-90 shadow-2xl ${isLiked ? 'bg-rose-600 text-white border-rose-600' : 'bg-black/30 text-white hover:bg-black/50'}`}>
                    <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                 </button>
                 <button 
                  onClick={handleShare}
                  className="w-14 h-14 rounded-2xl bg-black/30 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white hover:bg-black/50 active:scale-90 transition-all shadow-2xl"
                 >
                    <Share2 className="w-6 h-6" />
                 </button>
              </div>

              <div className="absolute bottom-12 left-12 hidden sm:block">
                 <div className="flex gap-3 mb-6">
                    <span className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.25em] shadow-xl shadow-indigo-600/30">
                       {event.category}
                    </span>
                    {isPremiumEvent && (
                      <span className="px-5 py-2 bg-amber-400 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-2 shadow-xl shadow-amber-400/30">
                        <Lock className="w-3.5 h-3.5" />
                        Elite Access
                      </span>
                    )}
                 </div>
                 <h1 className="text-4xl lg:text-7xl font-display font-black text-white uppercase italic leading-[0.9] tracking-tighter max-w-2xl drop-shadow-2xl">
                   {event.title}
                 </h1>
              </div>
            </div>

            {/* MOBILE TITLE SECTION */}
            <div className="lg:hidden px-6 -mt-16 relative z-10">
               <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-slate-800">
                  <div className="flex gap-3 mb-6">
                     <span className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg">
                        {event.category}
                     </span>
                     {isPremiumEvent && (
                       <span className="px-4 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg flex items-center gap-2">
                          <Lock className="w-3 h-3" />
                          Elite
                       </span>
                     )}
                  </div>
                  <h1 className="text-3xl font-display font-black uppercase italic leading-[1.1] tracking-tight">{event.title}</h1>
               </div>
            </div>

            {/* QUICK INFO GRID */}
            <div className="px-6 lg:px-0 grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white dark:bg-slate-950 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-900 flex items-center md:flex-col md:text-center gap-4 md:gap-6 group hover:border-indigo-500/50 transition-all shadow-xl hover:shadow-indigo-500/5 overflow-hidden min-h-[160px]">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-600 border border-slate-100 dark:border-slate-800 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                     <Calendar className="w-7 h-7 md:w-8 md:h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                     <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1 md:mb-2 leading-none">Premiere Date</span>
                     <p className="text-xs md:text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-tight break-words">
                        {event.date ? formatDate(event.date) : 'Schedule Pending'}
                     </p>
                  </div>
               </div>

               <div className="bg-white dark:bg-slate-950 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-900 flex items-center md:flex-col md:text-center gap-4 md:gap-6 group hover:border-indigo-500/50 transition-all shadow-xl hover:shadow-indigo-500/5 overflow-hidden min-h-[160px]">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-600 border border-slate-100 dark:border-slate-800 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                     <MapPin className="w-7 h-7 md:w-8 md:h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                     <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1 md:mb-2 leading-none">The Venue</span>
                     <p className="text-xs md:text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-tight line-clamp-2 break-words">
                        {event.location || 'Location Classified'}
                     </p>
                  </div>
               </div>

               <div className="bg-white dark:bg-slate-950 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-900 flex items-center md:flex-col md:text-center gap-4 md:gap-6 group hover:border-indigo-500/50 transition-all shadow-xl hover:shadow-indigo-500/5 overflow-hidden min-h-[160px]">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-600 border border-slate-100 dark:border-slate-800 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                     <Lock className="w-7 h-7 md:w-8 md:h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                     <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1 md:mb-2 leading-none">Security Level</span>
                     <p className="text-xs md:text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-tight line-clamp-2">
                       {event.visibility === 'PUBLIC' ? 'Public Experience' : 'Elite Verified Only'}
                     </p>
                  </div>
               </div>
            </div>

            {/* DESCRIPTION & VENUE SECTIONS */}
            <div className="px-6 lg:px-0 space-y-8">
              {/* TICKET TIERS SELECTION */}
              {event.ticketTiers && event.ticketTiers.length > 0 && (
                <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl p-10">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-1 h-8 bg-indigo-600 rounded-full"></div>
                    <h3 className="text-2xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Select Package</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {event.ticketTiers.map((tier) => (
                      <motion.button
                        key={tier.id}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setSelectedTierId(tier.id)}
                        className={`w-full relative text-left p-5 md:px-8 md:py-6 rounded-[2rem] border-2 transition-all group overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          selectedTierId === tier.id 
                            ? 'border-indigo-600 bg-indigo-50/10 dark:bg-indigo-500/5 shadow-[0_0_40px_-10px_rgba(79,70,229,0.2)]' 
                            : 'border-slate-100 dark:border-slate-900 hover:border-slate-200 dark:hover:border-slate-800'
                        }`}
                      >
                        {tier.isFeatured && (
                          <div className="absolute top-0 right-10 px-3 py-1 bg-amber-400 text-slate-900 text-[7px] font-black uppercase tracking-[0.2em] rounded-b-lg">
                            Highly Recommended
                          </div>
                        )}
                        
                        <div className="flex items-center gap-6 flex-1 min-w-0">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${
                            selectedTierId === tier.id 
                              ? 'bg-indigo-600 border-indigo-600 text-white' 
                              : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 group-hover:text-indigo-600'
                          }`}>
                            <Ticket className="w-6 h-6" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm md:text-base font-display font-black uppercase italic tracking-tight leading-none mb-2 ${
                              selectedTierId === tier.id ? 'text-indigo-600' : 'text-slate-900 dark:text-white'
                            }`}>
                              {tier.name}
                            </h4>
                            {tier.description && (
                              <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1 opacity-70">
                                {tier.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-8 shrink-0">
                          <div className="text-right">
                            <p className="text-xl md:text-2xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none mb-2">
                              {formatCurrency(tier.price)}
                            </p>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none block whitespace-nowrap">
                              {tier.quantity - tier.sold} Seats Left
                            </span>
                          </div>
                          
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            selectedTierId === tier.id 
                              ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-600/30' 
                              : 'bg-slate-100 dark:bg-slate-900 text-transparent border border-slate-200 dark:border-slate-800'
                          }`}>
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl">
                <button onClick={() => toggleSection('about')} className="w-full flex justify-between items-center p-10 text-left hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group">
                  <div className="flex items-center gap-6">
                     <div className={`w-1 h-8 bg-indigo-600 rounded-full transition-all duration-500 ${expandedSection === 'about' ? 'scale-y-100' : 'scale-y-0 opacity-0'}`}></div>
                     <h3 className="text-2xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight">The Experience</h3>
                  </div>
                  <ChevronDown className={`h-8 w-8 text-slate-300 transition-all duration-500 ${expandedSection === 'about' ? 'rotate-180 text-indigo-600' : ''}`} />
                </button>
                <AnimatePresence>
                  {expandedSection === 'about' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-10 pb-10">
                      <p className="text-base font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-5xl">
                        {event.description}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl">
                <button onClick={() => toggleSection('location')} className="w-full flex justify-between items-center p-10 text-left hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group">
                   <div className="flex items-center gap-6">
                     <div className={`w-1 h-8 bg-indigo-600 rounded-full transition-all duration-500 ${expandedSection === 'location' ? 'scale-y-100' : 'scale-y-0 opacity-0'}`}></div>
                     <h3 className="text-2xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Geographic Intelligence</h3>
                  </div>
                  <ChevronDown className={`h-8 w-8 text-slate-300 transition-all duration-500 ${expandedSection === 'location' ? 'rotate-180 text-indigo-600' : ''}`} />
                </button>
                <AnimatePresence>
                  {expandedSection === 'location' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-10 pb-10">
                       <div 
                         onClick={openNavigation}
                         className="w-full h-[400px] rounded-[3rem] overflow-hidden relative border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shadow-inner group/map cursor-pointer ring-1 ring-slate-100 dark:ring-slate-800"
                       >
                          <div className="absolute inset-0 bg-indigo-600/0 group-hover/map:bg-indigo-600/5 transition-all z-[5] pointer-events-none" />
                          {event.latitude && event.longitude ? (
                            <MapContainer 
                              center={[event.latitude, event.longitude]} 
                              zoom={15} 
                              className="w-full h-full"
                              zoomControl={false}
                            >
                              <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              />
                              <Marker position={[event.latitude, event.longitude]}>
                                <Popup>
                                   <div className="p-3 font-display">
                                      <p className="font-black text-slate-900 uppercase italic tracking-tight text-sm mb-1">{event.title}</p>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{event.location}</p>
                                   </div>
                                </Popup>
                              </Marker>
                            </MapContainer>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-6">
                               <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700 animate-pulse">
                                  <MapPin className="w-12 h-12" />
                               </div>
                               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Tactical data unavailable</p>
                            </div>
                          )}
                          
                          {event.latitude && event.longitude && (
                            <div className="absolute bottom-10 right-10 z-[10] pointer-events-auto">
                               <button 
                                 onClick={openNavigation}
                                 className="bg-indigo-600 hover:bg-slate-900 text-white px-8 py-5 rounded-2xl shadow-2xl flex items-center gap-4 transition-all active:scale-95 group border-2 border-white/20"
                               >
                                  <Navigation className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                                  <span className="text-[11px] font-black uppercase tracking-[0.3em]">Launch Navigation</span>
                               </button>
                            </div>
                          )}
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR COLUMN (4 cols) - STICKY ON DESKTOP */}
          <div className="hidden lg:block lg:col-span-4 sticky top-28 self-start">
             <div className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                
                <div className="flex justify-between items-start mb-10 relative z-10">
                   <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none block mb-4">Investment Required</span>
                      <h4 className="text-4xl font-display font-black text-indigo-600 italic tracking-tighter leading-none">
                        {isPremiumEvent && !hasAccess ? 'Unauthorized' : formatCurrency(effectivePrice)}
                      </h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-4 opacity-50">
                        {selectedTier ? `${selectedTier.name} Access` : 'Per Event Access Pass'}
                      </p>
                   </div>
                   <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-[1.5rem] flex items-center justify-center text-indigo-600 border border-indigo-100 dark:border-indigo-800">
                      <Zap className="w-8 h-8 fill-current" />
                   </div>
                </div>

                <div className="space-y-6 mb-12 relative z-10">
                   <div className="flex items-center gap-4 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.2em]">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                         <ShieldCheck className="w-4 h-4" />
                      </div>
                      Encrypted Transaction
                   </div>
                   <div className="flex items-center gap-4 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.2em]">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                         <Ticket className="w-4 h-4" />
                      </div>
                      Instant Digital Distribution
                   </div>
                   <div className="flex items-center gap-4 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.2em]">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                         <Info className="w-4 h-4" />
                      </div>
                      Strategic Acquisition (Final Sale)
                   </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-4 relative z-10 w-full">
                  <button 
                    onClick={handleBuyNow}
                    disabled={!hasAccess || isBuying || isAdding}
                    className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-[0.25em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3.5 text-[11px] ${
                      hasAccess 
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-indigo-600/30 hover:scale-[1.02]' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border-2 border-dashed border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isBuying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        {t('checkout.processing')}
                      </>
                    ) : (
                      <>
                        <span>{hasAccess ? t('checkout.buy_now') : t('checkout.denied')}</span>
                        {hasAccess ? <Zap className="w-4 h-4 fill-current shrink-0" /> : <Lock className="w-4 h-4 shrink-0" />}
                      </>
                    )}
                  </button>

                  <button 
                    onClick={handleAddToCart}
                    disabled={!hasAccess || isBuying || isAdding}
                    className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-[0.25em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3.5 text-[11px] border-2 ${
                      hasAccess 
                        ? 'bg-white dark:bg-slate-900/50 border-indigo-600/30 hover:border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/10 dark:hover:bg-slate-800/40 hover:scale-[1.02]' 
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-none cursor-not-allowed'
                    }`}
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        {t('checkout.adding')}
                      </>
                    ) : (
                      <>
                        <span>{isItemInCart ? t('checkout.add_more') : t('checkout.add_to_cart')}</span>
                        <Ticket className="w-4 h-4 shrink-0" />
                      </>
                    )}
                  </button>
                </div>

                {!hasAccess && (
                  <div className="mt-10 p-8 bg-slate-50 dark:bg-slate-800/30 rounded-[2rem] border border-slate-100 dark:border-slate-800 relative z-10">
                     <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] leading-relaxed mb-6">Elite tier membership mandatory for this classification.</p>
                     <Link to="/membership" className="w-full text-center block py-4 bg-amber-400 hover:bg-amber-500 text-amber-950 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all">
                        Upgrade Strategy
                     </Link>
                  </div>
                )}
             </div>
          </div>
        </div>
      </main>

      {/* MOBILE BOTTOM CTA PANE */}
      <div className="lg:hidden fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] left-6 right-6 p-6 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] z-50 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
           <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                 <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] block mb-1 leading-none italic">Investment Sum</span>
                    <p className="text-lg font-display font-black text-white uppercase italic tracking-tighter leading-none">
                       {isPremiumEvent && !hasAccess ? 'Locked' : formatCurrency(effectivePrice)}
                    </p>
                 </div>
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">SECURE PASS GATEWAY</span>
              </div>
              
              <div className="flex flex-col gap-2.5 w-full">
                 <button 
                    onClick={handleBuyNow}
                    disabled={!hasAccess || isBuying || isAdding}
                    className={`w-full py-4 rounded-xl text-center font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-2xl ${
                       hasAccess 
                         ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-indigo-600/30' 
                         : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                 >
                    {isBuying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {t('checkout.processing').toUpperCase()}
                      </>
                    ) : (
                      <>
                        <span>{hasAccess ? t('checkout.buy_now').toUpperCase() : t('checkout.denied').toUpperCase()}</span>
                        {hasAccess ? <Zap className="w-3.5 h-3.5 fill-current" /> : <Lock className="w-3.5 h-3.5 shrink-0" />}
                      </>
                    )}
                 </button>

                 <button 
                    onClick={handleAddToCart}
                    disabled={!hasAccess || isBuying || isAdding}
                    className={`w-full py-4 rounded-xl text-center font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 flex items-center justify-center gap-2 border ${
                       hasAccess 
                         ? 'bg-slate-950/40 backdrop-blur-md border-white/10 text-slate-200 shadow-xl' 
                         : 'bg-slate-800 text-slate-500 border-none'
                    }`}
                 >
                    {isAdding ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {t('checkout.adding').toUpperCase()}
                      </>
                    ) : (
                      <>
                        <span>{isItemInCart ? t('checkout.add_more').toUpperCase() : t('checkout.add_to_cart').toUpperCase()}</span>
                        <Ticket className="w-3.5 h-3.5" />
                      </>
                    )}
                 </button>
              </div>
           </div>
      </div>
    </Layout>
  );
}
