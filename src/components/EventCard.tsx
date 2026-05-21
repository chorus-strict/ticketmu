import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, Lock, ArrowRight, Star, Heart, Crown, Loader2 } from 'lucide-react';
import { formatDate, formatCurrency, getImageUrl } from '../lib/utils';
import { useManagement } from '../contexts/ManagementContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

import { getFallbackImage } from '../lib/imageSync';

interface EventCardProps {
  id: string;
  slug?: string;
  title: string;
  date: string;
  image: string;
  location?: string;
  price?: string | number;
  category?: string;
  isPremium?: boolean;
  isFeatured?: boolean;
  variant?: 'compact' | 'featured' | 'grid';
  capacity?: number;
  sold?: number;
  key?: string | number;
  event?: any;
}

export default function EventCard({ 
  id, 
  slug,
  title = 'Untitled Event', 
  date = '', 
  image = '', 
  location = 'Global', 
  price = 0, 
  category = 'General', 
  isPremium = false, 
  isFeatured = false,
  variant = 'grid',
  capacity = 0,
  sold = 0,
  event
}: EventCardProps) {
  const { toggleFavorite, isFavorited, buyNow } = useManagement();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isBuying, setIsBuying] = useState(false);
  
  if (!id) return null;

  const favorited = typeof isFavorited === 'function' ? isFavorited(id) : false;
  const mergedIsFeatured = isFeatured || event?.isFeatured || false;

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    
    await toggleFavorite(id);
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please log in to finalize your purchase');
      return;
    }

    if (capacity > 0 && sold >= capacity) {
      toast.error('This event is completely sold out!');
      return;
    }

    setIsBuying(true);
    try {
      const eventToBuy = event || {
        id,
        slug,
        title,
        date,
        image,
        location,
        price: typeof price === 'number' ? price : 0,
        capacity,
        sold,
        category,
        visibility: isPremium ? 'PREMIUM' : 'PUBLIC',
        status: 'UPCOMING',
        description: ''
      };

      const res = await buyNow(eventToBuy);
      if (res?.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else if (res?.orderId) {
        navigate('/payment', { state: { orderId: res.orderId } });
      }
    } catch (err: any) {
      console.error('Buy Now click failure:', err);
      toast.error(err.response?.data?.message || 'Failed to initialize purchase.');
    } finally {
      setIsBuying(false);
    }
  };

  const FavoriteButton = () => (
    <button 
      onClick={handleToggleFavorite}
      className={`p-2 rounded-xl backdrop-blur-md transition-all active:scale-90 shadow-lg border ${
        favorited 
          ? 'bg-rose-500 text-white border-rose-500 shadow-rose-500/20' 
          : 'bg-white/90 dark:bg-slate-900/90 text-slate-400 border-slate-200 dark:border-slate-800 hover:text-rose-500'
      }`}
    >
      <Heart className={`w-3.5 h-3.5 ${favorited ? 'fill-current' : ''}`} />
    </button>
  );

  if (variant === 'compact') {
    return (
      <Link 
        to={`/event/${slug || id}`} 
        className="flex items-center bg-white dark:bg-slate-900 rounded-[2rem] p-3 border border-slate-100 dark:border-slate-800 gap-4 active:scale-[0.98] transition-all hover:border-indigo-400 group relative overflow-hidden"
      >
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex-none border border-slate-100 dark:border-slate-800 relative">
          <img 
            src={getImageUrl(image, category)} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
            alt={title}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getImageUrl(null, category);
            }}
          />
          {isPremium && (
            <div className="absolute top-1 right-1 p-1 bg-amber-400 rounded-lg shadow-lg">
              <Crown className="w-2.5 h-2.5 text-amber-900" />
            </div>
          )}
          {mergedIsFeatured && (
            <div className="absolute top-1 left-1 p-1 bg-amber-500 rounded-lg shadow-l">
              <Star className="w-2.5 h-2.5 text-white fill-current animate-pulse" />
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center flex-1 min-w-0 py-0.5">
          <h4 className="font-black text-slate-900 dark:text-white leading-[1.1] mb-2 uppercase italic text-xs sm:text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {title}
          </h4>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 opacity-60">
             <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-600 shrink-0">
               <Calendar className="h-3 w-3" />
               <span className="whitespace-nowrap">{date}</span>
             </div>
             <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 min-w-0">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{location}</span>
             </div>
          </div>
        </div>
        <div className="pr-2 flex flex-col items-end gap-2">
           {user && <FavoriteButton />}
           {price && (
             <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">
               {typeof price === 'number' ? formatCurrency(price) : price}
             </span>
           )}
        </div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link to={`/event/${slug || id}`} className="block relative h-[350px] sm:h-[500px] w-full rounded-[3rem] overflow-hidden group shadow-2xl">
        <motion.img 
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 1.5, ease: [0.33, 1, 0.68, 1] }}
          src={getImageUrl(image, category)} 
          className="w-full h-full object-cover" 
          alt={title} 
          onError={(e: any) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = getImageUrl(null, category);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
        <div className="absolute top-8 right-8 z-10 flex gap-3">
           {user && <FavoriteButton />}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-16">
          <div className="flex flex-wrap gap-2 mb-6">
            {category && (
              <span className="px-5 py-2 bg-white/10 backdrop-blur-xl text-white border border-white/20 rounded-full text-[9px] font-black uppercase tracking-[0.25em]">
                {category}
              </span>
            )}
            {isPremium && (
              <span className="px-5 py-2 bg-amber-400 text-slate-900 rounded-full text-[9px] font-black uppercase tracking-[0.25em] flex items-center gap-2">
                <Crown className="w-3.5 h-3.5" />
                Elite Access
              </span>
            )}
            {mergedIsFeatured && (
              <span className="px-5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 rounded-full text-[9px] font-black uppercase tracking-[0.25em] flex items-center gap-2 shadow-lg shadow-amber-500/20 ring-1 ring-amber-300/30">
                <Star className="w-3.5 h-3.5 fill-current animate-pulse" />
                Featured Event
              </span>
            )}
          </div>
          <h2 className="text-3xl sm:text-6xl font-display font-black text-white leading-[0.95] uppercase italic mb-8 max-w-3xl line-clamp-2 tracking-tighter">
            {title}
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10 text-white/80">
            <div className="flex items-center gap-3 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] shrink-0">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md shrink-0">
                 <Calendar className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                 <span className="text-white/40 text-[8px] whitespace-nowrap">Date & Time</span>
                 <span className="whitespace-nowrap">{date}</span>
              </div>
            </div>
            {location && (
              <div className="flex items-center gap-3 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] min-w-0">
                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md shrink-0">
                   <MapPin className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col min-w-0 pr-4">
                   <span className="text-white/40 text-[8px] whitespace-nowrap">Location</span>
                   <span className="truncate">{location}</span>
                </div>
              </div>
            )}
            <div className="hidden sm:flex items-center gap-4 bg-white/10 hover:bg-white text-white hover:text-slate-900 px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] backdrop-blur-xl transition-all cursor-pointer group/pass">
              <span>Secure Pass</span>
              <ArrowRight className="w-4 h-4 group-hover/pass:translate-x-2 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/event/${slug || id}`} className="group active:scale-[0.99] transition-all block h-full">
      <div className="bg-white dark:bg-slate-900/50 rounded-3xl h-full flex flex-col border border-slate-100 dark:border-slate-800/80 hover:border-indigo-500/40 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 p-2 sm:p-2.5">
        
        {/* [ Event Image ] */}
        <div className="aspect-[16/10] relative overflow-hidden rounded-2xl shrink-0 bg-slate-100 dark:bg-slate-800">
          <motion.img 
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
            src={getImageUrl(image, category)} 
            className="w-full h-full object-cover"
            alt={title}
            onError={(e: any) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getImageUrl(null, category);
            }}
          />
          
          {/* Subtle bottom gradient on image */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent opacity-60"></div>

          {/* Favorite Button Overlay (Top-Right) */}
          <div className="absolute top-2 right-2 z-10">
            {user && <FavoriteButton />}
          </div>

          {/* Featured Badge Overlay (Top-Left) */}
          {mergedIsFeatured && (
            <div className="absolute top-2 left-2 bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950 px-2.5 py-1 rounded-lg font-black text-[8px] uppercase tracking-[0.15em] shadow-md flex items-center gap-1 backdrop-blur-md border border-amber-400/30">
              <Star className="w-2.5 h-2.5 text-amber-950 fill-amber-950 animate-pulse" />
              Featured
            </div>
          )}

          {/* Elite Premium Badge Overlay (Bottom-Left) */}
          {isPremium && (
            <div className="absolute bottom-2.5 left-2.5 bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950 px-2.5 py-0.5 rounded-lg font-black text-[8px] uppercase tracking-[0.15em] shadow-md flex items-center gap-1 backdrop-blur-md border border-amber-300/30">
              <Crown className="w-2.5 h-2.5 text-amber-950 fill-amber-950" />
              Elite Pass
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-3.5 flex-1 flex flex-col justify-between gap-4">
          
          <div className="space-y-2 flex-1">
            {/* [ Category Badge ] */}
            <div className="flex items-center">
              <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-lg font-black text-[8px] uppercase tracking-wider border border-indigo-500/20">
                {category || 'Experience'}
              </span>
            </div>

            {/* [ Event Title ] */}
            <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors uppercase italic leading-tight line-clamp-2 min-h-[2.5rem] tracking-tight">
              {title}
            </h3>
            
            {/* [ Event Meta ] */}
            <div className="space-y-1.5 pt-1 text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider">{date}</span>
              </div>

              {location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider truncate">{location}</span>
                </div>
              )}
            </div>
          </div>

          {/* [ Bottom Section ] */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2">
            <div className="flex flex-col min-w-0">
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pass Value</span>
               <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tighter truncate">
                 {typeof price === 'number' ? (price === 0 ? 'Complimentary' : formatCurrency(price)) : price || 'Complimentary'}
               </span>
            </div>
            
            {/* BUY NOW Button */}
            <button 
              type="button"
              disabled={isBuying || (capacity > 0 && sold >= capacity)}
              onClick={handleBuyNow}
              className="px-3 py-2 bg-indigo-600 hover:bg-slate-900 dark:hover:bg-white dark:hover:text-slate-900 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white font-black text-[9px] uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/10 group-hover:shadow-indigo-600/25 transition-all text-center flex items-center justify-center gap-1 shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
               {isBuying ? (
                 <>
                   <Loader2 className="w-3 h-3 animate-spin" />
                   <span>Processing</span>
                 </>
               ) : (capacity > 0 && sold >= capacity) ? (
                 <span>Sold Out</span>
               ) : (
                 <>
                   <span>Buy Now</span>
                   <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                 </>
               )}
            </button>
          </div>

        </div>

      </div>
    </Link>
  );
}
