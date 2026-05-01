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
  ShieldCheck,
  Zap,
  Info,
  Navigation
} from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../contexts/AuthContext';
import { useManagement } from '../contexts/ManagementContext';
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
  const { events, cart, addToCart, toggleFavorite, isFavorited } = useManagement();
  
  const event = events.find(e => e.id === id);
  console.log('Event details:', event);
  const isLiked = isFavorited(id || '');
  const [expandedSection, setExpandedSection] = useState<string | null>('about');

  // isFavorited is now reactive to favoriteEventIds in context, no useEffect needed here for isLiked state


  if (!event) {
    return (
      <div className="bg-surface min-h-screen flex flex-col items-center justify-center p-5 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <Calendar className="h-10 w-10 text-slate-400" />
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-900 mb-2">Event Not Found</h1>
        <p className="text-slate-500 mb-8 max-w-xs">The event you are looking for might have been removed or the link is incorrect.</p>
        <button onClick={() => navigate('/')} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">
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
    if (id) await toggleFavorite(id);
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

  const handleBooking = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (hasAccess) {
      addToCart(event);
    }
  };

  return (
    <Layout>
      {/* MOBILE NAV OVERLAY (Hidden on Desktop) */}
      <div className="lg:hidden fixed top-4 left-4 z-50 flex gap-2">
         <button onClick={() => navigate(-1)} className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-xl flex items-center justify-center text-white active:scale-90 transition-all">
            <ArrowLeft className="w-5 h-5" />
         </button>
      </div>

      <main className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 lg:py-10">
        
        {/* DESKTOP BREADCRUMB */}
        <div className="hidden lg:flex items-center gap-2 mb-8 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
           <Link to="/" className="hover:text-indigo-600">Home</Link>
           <span className="opacity-50">/</span>
           <span className="hover:text-indigo-600">{event.category}</span>
           <span className="opacity-50">/</span>
           <span className="text-slate-900 dark:text-white">{event.title}</span>
        </div>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* LEFT CONTENT COLUMN (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* HERO IMAGE SECTION */}
            <div className="relative w-full aspect-video sm:aspect-[16/7] lg:rounded-[3rem] overflow-hidden group shadow-2xl">
              <img 
                src={getImageUrl(event.image, event.category)} 
                alt={event.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getImageUrl(null, event.category);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
              
              <div className="absolute top-6 right-6 flex gap-3">
                 <button onClick={handleToggleFavorite} className={`w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/20 transition-all active:scale-90 ${isLiked ? 'bg-red-500 text-white border-red-500' : 'bg-black/30 text-white hover:bg-black/50'}`}>
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                 </button>
                 <button className="w-12 h-12 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-black/50 active:scale-90 transition-all">
                    <Share2 className="w-5 h-5" />
                 </button>
              </div>

              <div className="absolute bottom-10 left-10 hidden sm:block">
                 <div className="flex gap-3 mb-4">
                    <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-bold uppercase tracking-widest">{event.category}</span>
                    {isPremiumEvent && (
                      <span className="px-4 py-1.5 bg-amber-400 text-slate-900 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                        <Lock className="w-3 h-3" />
                        Premium Pass Only
                      </span>
                    )}
                 </div>
                 <h1 className="text-4xl lg:text-5xl font-display font-extrabold text-white uppercase italic leading-[1.1] tracking-tighter max-w-2xl drop-shadow-2xl">
                   {event.title}
                 </h1>
              </div>
            </div>

            {/* MOBILE TITLE SECTION */}
            <div className="lg:hidden px-5 -mt-16 relative z-10">
               <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-2xl shadow-indigo-900/5 border border-slate-100 dark:border-slate-800">
                  <div className="flex gap-2 mb-4">
                     <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 text-[9px] font-bold uppercase tracking-widest rounded-lg">{event.category}</span>
                     {isPremiumEvent && <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-[9px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-1.5"><Lock className="w-2.5 h-2.5" /> Premium</span>}
                  </div>
                  <h1 className="text-3xl font-display font-extrabold uppercase italic leading-none truncate">{event.title}</h1>
               </div>
            </div>

            {/* QUICK INFO GRID */}
            <div className="px-5 lg:px-0 grid grid-cols-2 md:grid-cols-3 gap-4">
               <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center group hover:border-indigo-400 transition-colors">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                     <Calendar className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Event Date</span>
                  <p className="text-xs font-bold text-slate-900 dark:text-white uppercase italic">{formatDate(event.date)}</p>
               </div>
               <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center group hover:border-indigo-400 transition-colors">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                     <MapPin className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Venue Location</span>
                  <p className="text-xs font-bold text-slate-900 dark:text-white uppercase italic truncate max-w-full">{event.location}</p>
               </div>
               <div className="hidden md:flex bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center group hover:border-indigo-400 transition-colors">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                     <Star className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Accessibility</span>
                  <p className="text-xs font-bold text-slate-900 dark:text-white uppercase italic">{event.visibility === 'public' ? 'Public Pass' : 'Exclusive Access'}</p>
               </div>
            </div>

            {/* SECTIONS */}
            <div className="px-5 lg:px-0 space-y-6">
              {/* About */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <button onClick={() => toggleSection('about')} className="w-full flex justify-between items-center p-8 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase italic tracking-tight">Experience Description</h3>
                  <ChevronDown className={`h-6 w-6 text-slate-400 transition-transform ${expandedSection === 'about' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {expandedSection === 'about' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-8 pb-8 text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-4xl">
                      {event.description}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

               {/* Venue / Location Details */}
               <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <button onClick={() => toggleSection('location')} className="w-full flex justify-between items-center p-8 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase italic tracking-tight">Location Details</h3>
                  <ChevronDown className={`h-6 w-6 text-slate-400 transition-transform ${expandedSection === 'location' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {expandedSection === 'location' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-8 pb-8">
                       <div 
                         onClick={openNavigation}
                         className={`w-full h-80 rounded-[2rem] overflow-hidden relative border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 z-0 shadow-inner group/map cursor-pointer`}
                       >
                          <div className="absolute inset-0 bg-black/0 group-hover/map:bg-black/5 transition-colors z-[5] pointer-events-none" />
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
                                  <div className="p-1">
                                    <p className="font-bold text-xs">{event.title}</p>
                                    <p className="text-[10px] text-slate-500">{event.location}</p>
                                  </div>
                                </Popup>
                              </Marker>
                            </MapContainer>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                               <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center animate-pulse">
                                  <MapPin className="w-10 h-10" />
                               </div>
                               <p className="text-xs font-bold uppercase tracking-widest">No detailed map available</p>
                            </div>
                          )}
                          
                          {event.latitude && event.longitude && (
                            <div className="absolute bottom-6 right-6 z-[10] pointer-events-auto">
                               <button 
                                 onClick={openNavigation}
                                 className="bg-indigo-600 hover:bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 transition-all active:scale-95 group border-2 border-white/20"
                               >
                                  <Navigation className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest">Get Directions</span>
                               </button>
                            </div>
                          )}
                       </div>
                       <div 
                         onClick={openNavigation}
                         className="mt-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group/address"
                       >
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-200 dark:border-slate-700 group-hover/address:scale-110 transition-transform">
                                <MapPin className="w-5 h-5" />
                             </div>
                             <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-none mb-1">Venue Address</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white uppercase italic">{event.location}</p>
                             </div>
                          </div>
                          {event.latitude && event.longitude && (
                            <div className="flex gap-4">
                               <div className="text-center">
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block leading-none mb-1">Lat</span>
                                  <p className="text-[10px] font-bold text-slate-900 dark:text-white">{event.latitude.toFixed(4)}</p>
                               </div>
                               <div className="text-center">
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block leading-none mb-1">Lng</span>
                                  <p className="text-[10px] font-bold text-slate-900 dark:text-white">{event.longitude.toFixed(4)}</p>
                               </div>
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
             <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border-2 border-indigo-600/5 dark:border-indigo-500/10 shadow-2xl shadow-indigo-900/10">
                
                <div className="flex justify-between items-start mb-8">
                   <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">Investment</span>
                      <h4 className="text-3xl font-display font-extrabold text-indigo-600 italic">
                        {isPremiumEvent && !hasAccess ? 'Access Locked' : formatCurrency(event.price)}
                      </h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Per Ticket Pass</p>
                   </div>
                   <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
                      <Zap className="w-6 h-6 fill-current" />
                   </div>
                </div>

                <div className="space-y-4 mb-8">
                   <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      100% Secure Checkout
                   </div>
                   <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                      <Ticket className="w-4 h-4 text-indigo-400" />
                      Instant Ticket Delivery
                   </div>
                   <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                      <Info className="w-4 h-4 text-amber-500" />
                      Non-Refundable Asset
                   </div>
                </div>

                <button 
                  onClick={handleBooking}
                  disabled={!hasAccess}
                  className={`w-full py-5 rounded-2xl font-bold uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-4 text-xs ${
                    hasAccess 
                      ? 'bg-indigo-600 hover:bg-slate-900 dark:hover:bg-white dark:hover:text-black text-white shadow-indigo-600/20' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border-2 border-dashed border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {hasAccess ? (isItemInCart ? 'Increase Quantity' : 'Secure Your Pass') : 'Locked Content'}
                  {hasAccess ? <ArrowLeft className="w-4 h-4 text-white rotate-180" /> : <Lock className="w-4 h-4" />}
                </button>

                {!hasAccess && (
                  <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                     <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-relaxed mb-4">You need a Premium Membership to access this exclusive event tier.</p>
                     <Link to="/membership" className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-2 group">
                        UPGRADE NOW <ArrowLeft className="w-3.5 h-3.5 rotate-180 group-hover:translate-x-1 transition-transform" />
                     </Link>
                  </div>
                )}
             </div>
          </div>
        </div>
      </main>

      {/* MOBILE BOTTOM CTA PANE */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-slate-200 dark:border-slate-800 z-50">
          {!hasAccess && (
            <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl flex items-center justify-between border border-amber-100 dark:border-amber-900/20 mb-4">
              <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest leading-none">Membership Required</span>
              <Link to="/membership" className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-widest">Upgrade</Link>
            </div>
          )}
          <div className="flex items-center gap-6">
             <div className="flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Ticket Price</span>
                <p className="text-xl font-display font-extrabold text-slate-900 dark:text-white uppercase italic">
                   {isPremiumEvent && !hasAccess ? 'Locked' : formatCurrency(event.price)}
                </p>
             </div>
             <button 
                onClick={handleBooking}
                disabled={!hasAccess}
                className={`flex-[2] py-4 rounded-xl text-center font-bold uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center justify-center gap-3 ${
                   hasAccess ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
             >
                {hasAccess ? (isItemInCart ? 'Add More' : 'Secure Pass') : 'Locked'}
                {hasAccess ? <Ticket className="w-5 h-5 opacity-70" /> : <Lock className="w-4 h-4 opacity-40" />}
             </button>
          </div>
      </div>
    </Layout>
  );
}
