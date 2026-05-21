import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ManagedEvent } from '../contexts/ManagementContext';
import { formatDate, formatCurrency, getImageUrl } from '../lib/utils';
import { getFallbackImage } from '../lib/imageSync';

interface SlideshowProps {
  events: ManagedEvent[];
  autoPlayInterval?: number;
}

export default function Slideshow({ events, autoPlayInterval = 5000 }: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev === events.length - 1 ? 0 : prev + 1));
  }, [events.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? events.length - 1 : prev - 1));
  }, [events.length]);

  useEffect(() => {
    if (isPaused || events.length <= 1) return;
    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [nextSlide, autoPlayInterval, isPaused, events.length]);

  if (events.length === 0) return null;

  const currentEvent = events[currentIndex];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95
    })
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[350px] sm:h-[500px] lg:h-[600px] overflow-hidden rounded-[3rem] group bg-slate-900 shadow-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
           key={currentIndex}
           custom={direction}
           variants={variants}
           initial="enter"
           animate="center"
           exit="exit"
           transition={{
             x: { type: "spring", stiffness: 200, damping: 25 },
             opacity: { duration: 0.5 },
             scale: { duration: 0.5 }
           }}
           drag="x"
           dragConstraints={{ left: 0, right: 0 }}
           dragElastic={0.5}
           onDragEnd={(e, { offset, velocity }) => {
             const swipe = Math.abs(offset.x) > 50 || Math.abs(velocity.x) > 500;
             if (swipe && offset.x > 0) {
               prevSlide();
             } else if (swipe && offset.x < 0) {
               nextSlide();
             }
           }}
           className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        >
          {/* Background Image with Depth Overlay */}
          <div className="absolute inset-0">
            <motion.img 
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 10, ease: "linear" }}
              src={getImageUrl(currentEvent.image, currentEvent.category)} 
              alt={currentEvent.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = getImageUrl(null, currentEvent.category);
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-transparent hidden sm:block" />
          </div>

          {/* Luxury Content Layout */}
          <div className="absolute inset-0 p-8 sm:p-16 flex flex-col justify-end">
             <div className="max-w-4xl">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                   <div className="flex flex-wrap items-center gap-3 mb-6">
                      <div className="bg-indigo-600 text-white text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-[0.3em] flex items-center gap-2 shadow-xl shadow-indigo-600/20 border border-white/10">
                         <Sparkles className="w-3.5 h-3.5" />
                         Elite Selection
                      </div>
                      <div className="bg-white/10 backdrop-blur-xl text-white text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-[0.3em] border border-white/10">
                         {currentEvent.category}
                      </div>
                   </div>

                   <h2 className="text-3xl sm:text-5xl lg:text-7xl font-display font-black text-white uppercase italic leading-[0.95] mb-8 tracking-tighter max-w-2xl">
                      {currentEvent.title}
                   </h2>

                   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-12 mb-10 text-white/80">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                            <Calendar className="w-5 h-5 text-indigo-400" />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Premiere Date</span>
                            <span className="text-xs sm:text-sm font-black uppercase tracking-widest">{formatDate(currentEvent.date)}</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                            <MapPin className="w-5 h-5 text-indigo-400" />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Exclusive Venue</span>
                            <span className="text-xs sm:text-sm font-black uppercase tracking-widest truncate max-w-[150px] sm:max-w-xs">{currentEvent.location}</span>
                         </div>
                      </div>
                   </div>

                   <div className="flex items-center gap-5">
                      <Link 
                        to={`/event/${currentEvent.slug || currentEvent.id}`}
                        className="bg-white text-slate-950 px-8 sm:px-12 py-5 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] hover:bg-indigo-600 hover:text-white transition-all shadow-2xl active:scale-95 group/btn flex items-center gap-3"
                      >
                         Secure Access - {formatCurrency(currentEvent.price)}
                         <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                      </Link>
                   </div>
                </motion.div>
             </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Luxury Navigation Buttons - Better tap regions */}
      <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
         <button 
           onClick={(e) => { e.stopPropagation(); prevSlide(); }}
           className="w-14 h-14 sm:w-16 sm:h-16 rounded-[1.5rem] bg-slate-950/20 hover:bg-white text-white hover:text-slate-950 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all pointer-events-auto active:scale-90 shadow-2xl opacity-0 group-hover:opacity-100 -translate-x-10 group-hover:translate-x-0 group-hover:duration-500"
         >
            <ChevronLeft className="w-7 h-7 sm:w-8 h-8" />
         </button>
         <button 
           onClick={(e) => { e.stopPropagation(); nextSlide(); }}
           className="w-14 h-14 sm:w-16 sm:h-16 rounded-[1.5rem] bg-slate-950/20 hover:bg-white text-white hover:text-slate-950 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all pointer-events-auto active:scale-90 shadow-2xl opacity-0 group-hover:opacity-100 translate-x-10 group-hover:translate-x-0 group-hover:duration-500"
         >
            <ChevronRight className="w-7 h-7 sm:w-8 h-8" />
         </button>
      </div>

      {/* Minimalist Pagination */}
      <div className="absolute bottom-16 right-8 sm:right-16 flex flex-col gap-3 z-10">
         {events.map((_, idx) => (
           <button 
             key={idx}
             onClick={() => {
               setDirection(idx > currentIndex ? 1 : -1);
               setCurrentIndex(idx);
             }}
             className={`w-1.5 transition-all duration-500 ${
               currentIndex === idx ? 'h-10 bg-indigo-500' : 'h-4 bg-white/20 hover:bg-white/40'
             }`}
           />
         ))}
      </div>

      {/* Subtle Progress Bar */}
      {!isPaused && events.length > 1 && (
        <div className="absolute bottom-0 left-0 h-1 bg-white/10 z-20 w-full">
          <motion.div 
            key={currentIndex}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: autoPlayInterval / 1000, ease: "linear" }}
            className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"
          />
        </div>
      )}
    </div>
  );
}
