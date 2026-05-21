import React, { useState, useEffect } from 'react';
import { Heart, Search, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useManagement, ManagedEvent } from '../contexts/ManagementContext';
import EventCard from '../components/EventCard';
import Layout from '../components/layout/Layout';
import { formatDate } from '../lib/utils';

export default function FavoritesPage() {
  const { fetchUserFavorites } = useManagement();
  const [favorites, setFavorites] = useState<ManagedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setIsLoading(true);
    const data = await fetchUserFavorites();
    setFavorites(data);
    setIsLoading(false);
  };

  const filteredFavorites = (favorites ?? []).filter(event => 
    (event?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event?.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event?.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <main className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 py-12 lg:py-24">
        <header className="mb-20">
           <div className="flex items-center gap-6 mb-8">
              <div className="w-16 h-16 bg-rose-500/10 rounded-[1.5rem] flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-2xl shadow-rose-500/10">
                 <Heart className="w-8 h-8 fill-current" />
              </div>
              <h1 className="text-4xl sm:text-6xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Curated Vault</h1>
           </div>
           <p className="text-slate-400 dark:text-slate-500 font-black text-[11px] uppercase tracking-[0.4em] max-w-xl italic opacity-60 leading-relaxed">
             Access your high-priority interests and saved tactical experiences. Strategic planning for your next premium engagement starting here.
           </p>
        </header>

        {/* Search and Filters */}
        <div className="mb-16 max-w-3xl">
           <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 group-focus-within:text-indigo-600 transition-all duration-500" />
              <input 
                type="text" 
                placeholder="INTEL SEARCH WITHIN VAULT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-8 py-5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[2rem] focus:outline-none focus:ring-0 focus:border-indigo-600 transition-all font-black text-xs shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] placeholder:text-slate-200 dark:placeholder:text-slate-800 tracking-[0.2em] uppercase italic"
              />
           </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-[320px] bg-slate-50 dark:bg-slate-900 rounded-3xl animate-pulse border border-slate-100 dark:border-slate-800" />
            ))}
          </div>
        ) : filteredFavorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFavorites.map((event: ManagedEvent) => (
               <EventCard 
                key={event.id}
                id={event.id}
                slug={event.slug}
                title={event.title}
                date={formatDate(event.date)}
                image={event.image}
                location={event.location}
                price={event.price}
                category={event.category}
                isPremium={event.visibility === 'PREMIUM'}
                event={event}
              />
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
             <div className="w-32 h-32 bg-slate-50 dark:bg-slate-950 rounded-[3.5rem] flex items-center justify-center mb-10 border border-slate-100 dark:border-slate-800 shadow-inner group transition-all duration-700 hover:rotate-12">
                <Heart className="w-12 h-12 text-slate-100 dark:text-slate-900" />
             </div>
             <h3 className="text-3xl font-display font-black text-slate-900 dark:text-white mb-6 uppercase italic tracking-tighter">Vault Empty</h3>
             <p className="text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] max-w-sm mb-12 italic opacity-60 leading-loose">
               {searchTerm ? "Negative results on current intel parameters. Readjust search criteria." : "Your curated asset collection is currently zeroed. Begin acquisition."}
             </p>
             <Link 
               to="/" 
               className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all flex items-center gap-4 hover:bg-slate-900"
             >
               Scout Events
               <ArrowRight className="w-4 h-4" />
             </Link>
          </motion.div>
        )}
      </main>
    </Layout>
  );
}
