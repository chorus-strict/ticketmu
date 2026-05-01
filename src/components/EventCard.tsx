import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, Lock, ArrowRight, Star, Heart } from 'lucide-react';
import { formatDate, formatCurrency, getImageUrl } from '../lib/utils';
import { useManagement } from '../contexts/ManagementContext';
import { useAuth } from '../contexts/AuthContext';

import { getFallbackImage } from '../lib/imageSync';

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  image: string;
  location?: string;
  price?: string | number;
  category?: string;
  isPremium?: boolean;
  variant?: 'compact' | 'featured' | 'grid';
  key?: string | number;
}

export default function EventCard({ 
  id, 
  title, 
  date, 
  image, 
  location, 
  price, 
  category, 
  isPremium, 
  variant = 'grid' 
}: EventCardProps) {
  const { toggleFavorite, isFavorited } = useManagement();
  const { user } = useAuth();
  const favorited = isFavorited(id);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    
    await toggleFavorite(id);
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
        to={`/event/${id}`} 
        className="flex bg-white dark:bg-slate-800/50 rounded-2xl p-3 shadow-sm border border-slate-200 dark:border-slate-700 gap-4 active:bg-slate-50 dark:active:bg-slate-800 transition-all hover:border-indigo-400 group"
      >
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-none border border-slate-100 dark:border-slate-700">
          <img 
            src={getImageUrl(image, category)} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
            alt={title}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getImageUrl(null, category);
            }}
          />
        </div>
        <div className="flex flex-col justify-between flex-1 py-0.5">
          <div>
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 leading-tight mb-1 uppercase italic text-xs sm:text-sm line-clamp-2">{title}</h4>
              {isPremium && <Lock className="w-3.5 h-3.5 text-amber-500 flex-none ml-2" />}
            </div>
            <p className="text-[10px] sm:text-xs font-bold text-indigo-600 uppercase tracking-wider">{date}</p>
          </div>
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-widest">
              <MapPin className="h-3 w-3 text-slate-400" />
              <span className="truncate max-w-[100px]">{location}</span>
            </div>
            <div className="flex items-center gap-2">
               {price && (
                 <span className="text-[10px] font-bold text-slate-900 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">{typeof price === 'number' ? formatCurrency(price) : price}</span>
               )}
               {user && <FavoriteButton />}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link to={`/event/${id}`} className="block relative h-[400px] w-full rounded-[2.5rem] overflow-hidden group shadow-2xl">
        <motion.img 
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
          src={getImageUrl(image, category)} 
          className="w-full h-full object-cover" 
          alt={title} 
          onError={(e: any) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = getImageUrl(null, category);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
        <div className="absolute top-6 right-6 z-10 flex gap-3">
           {user && <FavoriteButton />}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
          <div className="flex gap-2 mb-4">
            {category && (
              <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-full text-[10px] font-bold uppercase tracking-[0.2em]">
                {category}
              </span>
            )}
            {isPremium && (
              <span className="px-4 py-1.5 bg-amber-400 text-slate-900 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                Premium
              </span>
            )}
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white leading-tight uppercase italic mb-4 max-w-2xl line-clamp-2">
            {title}
          </h2>
          <div className="flex flex-wrap items-center gap-6 text-slate-200">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <span>{date}</span>
            </div>
            {location && (
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                <MapPin className="w-5 h-5 text-indigo-400" />
                <span>{location}</span>
              </div>
            )}
            <div className="hidden sm:flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-widest text-sm hover:translate-x-2 transition-transform">
              <span>View Pass</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/event/${id}`} className="group active:scale-[0.98] transition-all">
      <div className="premium-card overflow-hidden bg-white dark:bg-slate-900 rounded-3xl h-full flex flex-col">
        <div className="h-48 sm:h-56 relative overflow-hidden">
          <motion.img 
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.8 }}
            src={getImageUrl(image, category)} 
            className="w-full h-full object-cover"
            alt={title}
            onError={(e: any) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getImageUrl(null, category);
            }}
          />
          <div className="absolute top-4 right-4 flex gap-2">
            {user && <FavoriteButton />}
          </div>
          <div className="absolute top-4 left-4 flex gap-2">
            {isPremium && (
              <div className="bg-amber-400 text-slate-900 px-3 py-1.5 rounded-xl font-bold text-[9px] uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                <Lock className="w-2.5 h-2.5" />
                Premium
              </div>
            )}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-900 dark:text-white px-3 py-1.5 rounded-xl font-bold text-[9px] uppercase tracking-wider shadow-lg">
              {category || 'Event'}
            </div>
          </div>
        </div>
        <div className="p-6 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-display font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 transition-colors uppercase italic leading-tight mb-2">
              {title}
            </h3>
            <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
                <Calendar className="h-4 w-4 text-indigo-500" />
                <span>{date}</span>
              </div>
              {location && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider truncate">
                  <MapPin className="h-4 w-4 text-indigo-500" />
                  <span className="truncate">{location}</span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
               {typeof price === 'number' ? formatCurrency(price) : price || 'Free'}
            </span>
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest group-hover:translate-x-1 transition-transform">Details</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
