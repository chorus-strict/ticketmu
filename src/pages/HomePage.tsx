import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp,
  Music, 
  MapPin, 
  ArrowRight,
  Plus,
  Zap,
  Crown,
  Sparkles,
  Calendar,
  Coins,
  Search,
  LayoutGrid
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useManagement, ManagedEvent } from '../contexts/ManagementContext';
import { formatDate, getImageUrl } from '../lib/utils';
import Layout from '../components/layout/Layout';
import EventCard from '../components/EventCard';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Slideshow from '../components/Slideshow';
import MembershipCard from '../components/MembershipCard';
import CategoryFilter from '../components/CategoryFilter';
import { EVENT_CATEGORIES } from '../constants';

import GlobalErrorBoundary from '../components/GlobalErrorBoundary';

import { filterAndSortEvents } from '../lib/eventFilters';

export default function HomePage() {
  const { t } = useSettings();
  const { user } = useAuth();
  const { events, trendingEvents, userPoints } = useManagement();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterType, setFilterType] = useState<'FEATURED' | 'TRENDING' | 'NEW'>('FEATURED');
  const [spotlight, setSpotlight] = useState<{ type: 'TODAY' | 'UPCOMING' | 'FEATURED', events: ManagedEvent[] } | null>(null);
  
  const categoriesList = [
    { id: 'All', label: 'All', icon: LayoutGrid, description: 'Complete collection' },
    ...EVENT_CATEGORIES
  ];

  useEffect(() => {
    const fetchSpotlight = async () => {
      try {
        const res = await api.get('/events/spotlight');
        setSpotlight(res.data);
      } catch (err) {
        console.error('Failed to fetch spotlight:', err);
      }
    };
    fetchSpotlight();
  }, []);

  const featuredEventsList = useMemo(() => {
    return filterAndSortEvents(events, { type: 'FEATURED', status: 'LIVE' }).slice(0, 5);
  }, [events]);

  const upcomingEventsList = useMemo(() => {
    return filterAndSortEvents(events, { 
      category: selectedCategory, 
      type: filterType,
      status: 'LIVE' 
    });
  }, [events, selectedCategory, filterType]);

  const spotlightEvent = spotlight?.events[0];
  const spotlightTitle = spotlight?.type === 'FEATURED' 
    ? "⭐ Featured Spotlight" 
    : spotlight?.type === 'TODAY' 
      ? "Today's Spotlight" 
      : "Upcoming Events";

  return (
    <Layout>
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-12">
        
        {/* WELCOME SECTION - Responsive */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-16 gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600/10 rounded-full border border-indigo-600/20">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em]">{t('home.tagline') || 'Tiketmu Exclusive'}</span>
             </div>
             <h1 className="text-3xl sm:text-4xl lg:text-6xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">
               {t('home.title')}
             </h1>
             <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.25em] text-[10px] sm:text-xs max-w-lg">
               Indulge in a world of premium experiences curated specifically for your taste.
             </p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-start sm:items-end w-full sm:w-auto"
          >
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Live Network</span>
             <div className="flex items-center gap-3 text-[10px] font-black text-emerald-500 bg-emerald-500/5 px-5 py-2.5 rounded-2xl border border-emerald-500/20 w-full sm:w-auto justify-center sm:justify-start">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></div>
               SYSTEM ONLINE
             </div>
          </motion.div>
        </div>

        {/* TOP SECTION: HERO + SIDEBAR - Responsive Grid */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-8 mb-4 sm:mb-6">
          {/* Main Hero Card */}
          <div className="lg:col-span-8 order-1">
            {featuredEventsList.length > 0 ? (
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-slate-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl">
                   <Slideshow events={featuredEventsList} />
                </div>
              </div>
            ) : (
              <div className="h-[300px] sm:h-[450px] bg-slate-100 dark:bg-slate-900/50 rounded-[2.5rem] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 transition-all">
                 <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                    <Sparkles className="w-8 h-8 text-slate-300" />
                 </div>
                 <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Curating Exclusive Content</p>
              </div>
            )}
          </div>

          {/* Sidebar Section - Stacks on Mobile */}
          <div className="lg:col-span-4 order-2 flex flex-col gap-6 sm:gap-10">
            <MembershipCard />

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-950 text-white p-8 sm:p-10 rounded-[3rem] min-h-[340px] sm:h-auto flex flex-col justify-between border-2 border-indigo-500/20 relative overflow-hidden group shadow-[0_20px_50px_rgba(99,102,241,0.15)] hover:shadow-[0_25px_60px_rgba(99,102,241,0.3)] duration-500 transition-all"
            >
               <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-600/10 blur-[80px] rounded-full group-hover:bg-indigo-600/20 transition-all duration-1000 pointer-events-none z-[1]"></div>

                {/* Background Event Image Cover */}
                {spotlightEvent?.image && (
                  <div className="absolute inset-0 z-0 overflow-hidden rounded-[3rem]">
                    <img 
                      src={getImageUrl(spotlightEvent.image, spotlightEvent.category)} 
                      alt={spotlightEvent.title}
                      className="w-full h-full object-cover filter blur-[2px] opacity-45 scale-100 group-hover:scale-105 group-hover:blur-0 transition-all duration-1000 ease-out"
                    />
                  </div>
                )}
                
                {/* Advanced Multi-Layer Gradients for Infinite Readability (Dark Overlays & Vignette) */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/50 z-[1] pointer-events-none"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,transparent_25%,rgba(15,23,42,0.95)_100%)] z-[1] pointer-events-none"></div>
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none z-[1]"></div>
               
               {spotlightEvent ? (
                 <>
                   <div>
                     <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                          <Zap className="w-4 h-4 text-indigo-400" />
                        </div>
                        <span className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.3em] bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30 backdrop-blur-md">{spotlightTitle}</span>
                     </div>
                     <h3 className="text-3xl sm:text-4xl font-display font-black uppercase italic leading-[1.1] mb-6 relative z-10 text-white tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] group-hover:text-indigo-200 transition-colors duration-300">
                       {spotlightEvent.title}
                     </h3>
                     <div className="flex flex-col gap-3 relative z-10">
                        <div className="flex items-center gap-3 text-white p-3.5 rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-indigo-500/30">
                          <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span className="text-xs font-black uppercase tracking-widest">{formatDate(spotlightEvent.date)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-white p-3.5 rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-indigo-500/30">
                          <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span className="text-xs font-black uppercase tracking-widest truncate">{spotlightEvent.location}</span>
                        </div>
                     </div>
                   </div>
                   <Link 
                     to={`/event/${spotlightEvent.slug || spotlightEvent.id}`}
                     className="mt-10 group/btn relative z-10"
                   >
                     <div className="flex items-center justify-between p-5 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transform active:scale-95 transition-all">
                        Check Schedule 
                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                     </div>
                   </Link>
                 </>
               ) : (
                 <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                       <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-indigo-400" />
                       </div>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Daily Spotlight</span>
                    </div>
                    <h3 className="text-3xl font-display font-black uppercase italic leading-[1.1] mb-6">
                      No Events <br/> Scheduled
                    </h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
                      Check back later for curated events and exclusive offers.
                    </p>
                 </div>
               )}
            </motion.div>
          </div>
        </div>

        {/* FEED SECTION - Main Layout */}
        <section className="relative mt-4 sm:mt-6">
          {/* Subtle Background Layering */}
          <div className="absolute inset-x-0 -top-16 -bottom-16 bg-slate-50/50 dark:bg-slate-900/20 -z-10 rounded-[4rem] pointer-events-none"></div>
          
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-10">
            
            {/* Main Feed */}
            <div className="lg:col-span-8 order-1">
              <div className="flex flex-col space-y-6 mb-6">
                {/* Discovery Header Redesign */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-1 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
                      <h2 className="text-2xl sm:text-4xl font-display font-black uppercase italic tracking-tighter text-slate-900 dark:text-white leading-none">
                        Discovery Feed
                      </h2>
                    </div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.25em] ml-4">
                      Curated experiences for the elite collection
                    </p>
                  </div>

                  <div className="flex items-center gap-4 ml-4 md:ml-0 overflow-x-auto pb-2 md:pb-0 hide-scrollbar scroll-smooth">
                    <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-inner">
                      {[
                        { id: 'FEATURED', label: 'Featured' },
                        { id: 'TRENDING', label: 'Trending' },
                        { id: 'NEW', label: 'New' }
                      ].map((type) => (
                        <button 
                          key={`filter-type-${type.id}`}
                          onClick={() => setFilterType(type.id as any)}
                          className={`relative px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                            filterType === type.id 
                              ? 'text-white' 
                              : 'text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                          }`}
                        >
                          {filterType === type.id && (
                            <motion.div 
                              layoutId="activeFilter"
                              className="absolute inset-0 bg-indigo-600 rounded-xl shadow-[0_8px_20px_-6px_rgba(79,70,229,0.6)]"
                              transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
                            />
                          )}
                          <span className="relative z-10">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <GlobalErrorBoundary name="CategoryFilter">
                  {/* Modern Category Filter System */}
                  <CategoryFilter 
                    categories={categoriesList}
                    selectedId={selectedCategory}
                    onSelect={(id) => setSelectedCategory(id || 'All')}
                  />
                </GlobalErrorBoundary>
              </div>

              <GlobalErrorBoundary name="DiscoveryFeed">
                {/* Grid of Events - Adaptive columns */}
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={`${selectedCategory}-${filterType}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-6"
                  >
                    {upcomingEventsList.length > 0 ? (
                      upcomingEventsList.map((event, index) => (
                        <motion.div
                          key={`event-${event.id}-${index}`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <EventCard 
                            variant="grid"
                            {...event}
                            event={event}
                            date={formatDate(event.date)}
                            isPremium={event.visibility === 'PREMIUM'}
                          />
                        </motion.div>
                      ))
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="col-span-full py-32 text-center bg-white dark:bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800"
                      >
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                           <Search className="w-8 h-8 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">No Experiences Found</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Join the waitlist for {selectedCategory} {filterType.toLowerCase()} events</p>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </GlobalErrorBoundary>
            </div>

            {/* Sidebar Extra - Hidden on small mobile, shown on Tablet/Desktop as secondary column */}
            <div className="lg:col-span-4 order-2 flex flex-col gap-12 sm:gap-16">
              
              {/* Trending Stats */}
              <div className="bg-white dark:bg-slate-950 p-8 sm:p-10 rounded-[3rem] border border-slate-100 dark:border-slate-900/50 shadow-xl">
                <div className="flex items-center gap-4 mb-10">
                   <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                     <TrendingUp className="w-5 h-5" />
                   </div>
                   <div>
                     <h3 className="text-xl font-display font-black uppercase italic tracking-tight text-slate-900 dark:text-white">Trending Now</h3>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Activity</span>
                   </div>
                </div>
                <div className="space-y-8">
                   {trendingEvents && trendingEvents.length > 0 ? (
                     trendingEvents.slice(0, 5).map((event, idx) => (
                      <Link to={`/event/${event.slug || event.id}`} key={`trending-${event.id}-${idx}`} className="flex items-center gap-6 group relative">
                         <span className="text-4xl sm:text-5xl font-display font-black text-slate-50 dark:text-slate-900/50 absolute -left-4 -top-2 z-0 group-hover:text-indigo-600/10 transition-colors">0{idx + 1}</span>
                         <div className="flex-1 min-w-0 relative z-10 pl-10">
                            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase italic truncate group-hover:text-indigo-600 transition-colors leading-tight">{event.title}</h4>
                            <div className="flex items-center gap-2 mt-2 opacity-60">
                               <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{event.category}</span>
                               <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{formatDate(event.date)}</p>
                            </div>
                         </div>
                         <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                           <ArrowRight className="w-4 h-4 text-indigo-600" />
                         </div>
                      </Link>
                    ))
                   ) : (
                     <div className="flex items-center gap-3 py-6 animate-pulse">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-2xl"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-2/3 bg-slate-100 dark:bg-slate-900 rounded-lg"></div>
                          <div className="h-2 w-1/3 bg-slate-100 dark:bg-slate-900 rounded-lg"></div>
                        </div>
                     </div>
                   )}
                </div>
              </div>

              {/* Rewards & Points Card */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-indigo-600 text-white p-10 rounded-[3rem] relative overflow-hidden flex flex-col group shadow-[0_30px_60px_-15px_rgba(79,70,229,0.4)]"
              >
                 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-700">
                    <Coins className="w-40 h-40" />
                 </div>
                 
                 <div className="flex items-center gap-4 mb-10">
                   <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-inner">
                      <Coins className="w-7 h-7 text-white" />
                   </div>
                   <div>
                     <h3 className="text-xl font-display font-black uppercase italic leading-none mb-1">Rewards</h3>
                     <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Collector Tier</span>
                   </div>
                 </div>
                 
                 <div className="flex items-end gap-3 mb-6 bg-white/10 p-6 rounded-[2rem] backdrop-blur-sm border border-white/10">
                   <span className="text-5xl font-display font-black leading-none">{userPoints}</span>
                   <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-[0.2em]">Total Points</span>
                     <div className="flex items-center gap-1.5 mt-1 text-indigo-200">
                       <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                       <span className="text-[9px] font-black uppercase tracking-widest">Ready to redeem</span>
                     </div>
                   </div>
                 </div>

                 <p className="text-indigo-100/60 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed mb-10 px-2">
                   Earn 1 point per ticket purchase. High-tier members unlock exclusive premium lounges.
                 </p>

                 <Link 
                   to="/rewards"
                   className="w-full flex items-center justify-between p-5 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                 >
                   Redeem Store <ArrowRight className="w-5 h-5" />
                 </Link>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* MOBILE ONLY FLOATING CTA (Admin & Organizer) */}
      {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
        <div className="lg:hidden fixed bottom-[calc(7.5rem+env(safe-area-inset-bottom,0px))] right-6 z-[110]">
          <Link to="/dashboard" className="w-14 h-14 bg-indigo-600 rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center active:scale-90 transition-transform hover:bg-indigo-700">
            <Plus className="text-white h-7 w-7" />
          </Link>
        </div>
      )}
    </Layout>
  );
}
