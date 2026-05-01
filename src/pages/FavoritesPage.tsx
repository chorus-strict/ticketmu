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

  const filteredFavorites = favorites.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <header className="mb-12">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-600">
                 <Heart className="w-6 h-6 fill-current" />
              </div>
              <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-slate-900 dark:text-white uppercase italic tracking-tighter">My Favorites</h1>
           </div>
           <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl">
             Explore and keep track of all the exclusive events and experiences you've marked as favorites. Ready to secure your pass?
           </p>
        </header>

        {/* Search and Filters */}
        <div className="mb-10 max-w-2xl">
           <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Search within your favorites..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-bold text-sm shadow-sm"
              />
           </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[400px] bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] animate-pulse" />
            ))}
          </div>
        ) : filteredFavorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredFavorites.map((event: ManagedEvent) => (
              <EventCard 
                key={event.id}
                id={event.id}
                title={event.title}
                date={formatDate(event.date)}
                image={event.image}
                location={event.location}
                price={event.price}
                category={event.category}
                isPremium={event.visibility === 'PREMIUM'}
              />
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
             <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-800">
                <Heart className="w-10 h-10 text-slate-200" />
             </div>
             <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 uppercase italic">No Favorites Found</h3>
             <p className="text-slate-500 font-medium max-w-xs mb-8">
               {searchTerm ? "We couldn't find any favorites matching your search." : "You haven't added any events to your favorites yet."}
             </p>
             <Link 
               to="/" 
               className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-3"
             >
               Explore Events
               <ArrowRight className="w-4 h-4" />
             </Link>
          </motion.div>
        )}
      </main>
    </Layout>
  );
}
