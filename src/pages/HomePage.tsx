import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  MapPin, 
  ArrowRight,
  Plus,
  Zap,
  Crown,
  Sparkles,
  Calendar,
  Coins
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useManagement, ManagedEvent } from '../contexts/ManagementContext';
import { formatDate } from '../lib/utils';
import Layout from '../components/layout/Layout';
import EventCard from '../components/EventCard';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Slideshow from '../components/Slideshow';
import MembershipCard from '../components/MembershipCard';

export default function HomePage() {
  const { t } = useSettings();
  const { user } = useAuth();
  const { events, trendingEvents, userPoints } = useManagement();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [spotlight, setSpotlight] = useState<{ type: 'TODAY' | 'UPCOMING', events: ManagedEvent[] } | null>(null);
  
  const categories = ['All', 'Music', 'Tech', 'Art', 'Sports', 'Theater'];

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

  const featuredEventsList = events
    .filter(e => e.isFeatured && e.status === 'LIVE')
    .slice(0, 5);

  const upcomingEventsList = events
    .filter(e => e.status === 'LIVE' && (selectedCategory === 'All' || e.category === selectedCategory));

  const spotlightEvent = spotlight?.events[0];
  const spotlightTitle = spotlight?.type === 'TODAY' ? "Today's Spotlight" : "Upcoming Events";

  return (
    <Layout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        
        {/* WELCOME SECTION (Desktop Only) */}
        <div className="hidden lg:flex items-center justify-between mb-10">
          <div>
             <h1 className="text-4xl font-display font-extrabold text-slate-900 dark:text-white uppercase tracking-tight italic">
               {t('home.title')}
             </h1>
             <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">
               Discover unique experiences tailored for you
             </p>
          </div>
          <div className="flex gap-4">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Status</span>
                <div className="flex items-center gap-1.5 mt-1.5 text-xs font-extrabold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  LIVE UPDATES
                </div>
             </div>
          </div>
        </div>

        {/* TOP SECTION: HERO + SIDEBAR */}
        <div className="grid lg:grid-cols-12 gap-8 mb-12">
          {/* Main Hero Card (8 cols) */}
          <div className="lg:col-span-8">
            {featuredEventsList.length > 0 ? (
              <Slideshow events={featuredEventsList} />
            ) : (
              <div className="h-[400px] bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                 <p className="text-slate-400 font-bold uppercase tracking-widest">No featured events found</p>
              </div>
            )}
          </div>

          {/* Sidebar Section (4 cols) */}
          <div className="hidden lg:flex lg:col-span-4 flex-col gap-6">
            <MembershipCard />

            {/* Daily Promo Card / Spotlight */}
            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] h-1/2 flex flex-col justify-between border border-white/5 relative overflow-hidden group">
               <div className="absolute -top-4 -right-4 w-32 h-32 bg-indigo-600/20 blur-3xl rounded-full"></div>
               {spotlightEvent ? (
                 <>
                   <div>
                     <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-5 h-5 text-indigo-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{spotlightTitle}</span>
                     </div>
                     <h3 className="text-2xl font-display font-extrabold uppercase italic leading-tight truncate">
                       {spotlightEvent.title}
                     </h3>
                     <div className="flex flex-col gap-2 mt-4">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">{formatDate(spotlightEvent.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-widest truncate">{spotlightEvent.location}</span>
                        </div>
                     </div>
                   </div>
                   <Link 
                     to={`/event/${spotlightEvent.id}`}
                     className="mt-8 flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] group hover:text-white transition-colors"
                   >
                      Check Schedule <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                   </Link>
                 </>
               ) : (
                 <div>
                    <div className="flex items-center gap-2 mb-4">
                       <Zap className="w-5 h-5 text-indigo-400" />
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Daily Spotlight</span>
                    </div>
                    <h3 className="text-2xl font-display font-extrabold uppercase italic leading-tight">
                      No Events <br/> Scheduled
                    </h3>
                    <p className="text-slate-400 text-xs font-medium mt-4 leading-relaxed">
                      Check back later for curated events and exclusive offers.
                    </p>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* FEED SECTION */}
        <div className="grid lg:grid-cols-12 gap-12">
          
          {/* Main Feed (8 columns on Desktop, full on Mobile) */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-display font-extrabold uppercase italic tracking-tighter text-slate-900 dark:text-white">
                Upcoming Feed
              </h2>
              <div className="w-12 h-px bg-slate-200 dark:bg-slate-800"></div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-8 mb-4">
              {categories.map((cat) => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex-none px-6 py-2.5 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all border ${
                    selectedCategory === cat 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Grid of Events */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {upcomingEventsList.map((event) => (
                <EventCard 
                  key={event.id}
                  variant="grid"
                  {...event}
                  date={formatDate(event.date)}
                  isPremium={event.visibility === 'PREMIUM'}
                />
              ))}
            </div>
          </div>

          {/* Sidebar Extra (4 columns on Desktop) - HIDDEN ON MOBILE */}
          <div className="hidden lg:flex lg:col-span-4 flex-col gap-10 sticky top-28 self-start">
            
            {/* Trending Stats */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                 <TrendingUp className="w-5 h-5 text-indigo-600" />
                 <h3 className="text-lg font-display font-bold uppercase italic tracking-tight">Trending Now</h3>
              </div>
              <div className="space-y-4">
                 {trendingEvents.length > 0 ? (
                   trendingEvents.map((event, idx) => (
                    <Link to={`/event/${event.id}`} key={event.id} className="flex items-center gap-4 group">
                       <span className="text-2xl font-display font-black text-slate-200 dark:text-slate-800 group-hover:text-indigo-600 transition-colors">0{idx + 1}</span>
                       <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase italic truncate group-hover:text-indigo-600 transition-colors">{event.title}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{formatDate(event.date)}</p>
                       </div>
                       <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))
                 ) : (
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Calculating trends...</p>
                 )}
              </div>
            </div>

            {/* Rewards & Points */}
            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/30">
               <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-yellow-500/20">
                  <Coins className="w-6 h-6 text-white" />
               </div>
               <h3 className="text-xl font-display font-bold text-indigo-900 dark:text-indigo-100 uppercase italic leading-tight mb-3">Rewards & Points</h3>
               
               <div className="flex items-end gap-2 mb-2">
                 <span className="text-3xl font-display font-black text-indigo-600 leading-none">{userPoints}</span>
                 <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Total Points</span>
               </div>

               <p className="text-indigo-700/70 dark:text-indigo-300/70 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-6">
                 Earn 1 point per ticket purchase. Redeem for exclusive rewards and vouchers.
               </p>

               <Link 
                 to="/rewards"
                 className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
               >
                 Redeem Rewards <ArrowRight className="w-4 h-4" />
               </Link>
            </div>
          </div>
        </div>
      </main>

      {/* MOBILE ONLY FLOATING CTA (Admin) */}
      {user?.role === 'ADMIN' && (
        <div className="lg:hidden fixed bottom-28 right-6 z-[110]">
          <Link to="/dashboard" className="w-14 h-14 bg-indigo-600 rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center active:scale-90 transition-transform hover:bg-indigo-700">
            <Plus className="text-white h-7 w-7" />
          </Link>
        </div>
      )}
    </Layout>
  );
}
