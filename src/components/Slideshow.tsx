import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Sparkles } from 'lucide-react';
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
      className="relative w-full h-[400px] lg:h-[450px] overflow-hidden rounded-[2.5rem] group bg-slate-900"
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
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.4 },
            scale: { duration: 0.4 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
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
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <img 
              src={getImageUrl(currentEvent.image, currentEvent.category)} 
              alt={currentEvent.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = getImageUrl(null, currentEvent.category);
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent hidden lg:block" />
          </div>

          {/* Content */}
          <div className="absolute inset-0 p-8 lg:p-12 flex flex-col justify-end">
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="max-w-2xl"
             >
                <div className="flex items-center gap-2 mb-4">
                   <div className="bg-indigo-600/90 backdrop-blur-md text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-[0.2em] flex items-center gap-1.5 border border-white/10 shadow-lg">
                      <Sparkles className="w-3 h-3" />
                      Featured Event
                   </div>
                   <div className="bg-white/10 backdrop-blur-md text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-[0.2em] border border-white/10">
                      {currentEvent.category}
                   </div>
                </div>

                <h2 className="text-3xl lg:text-5xl font-display font-black text-white uppercase italic leading-tight mb-6 tracking-tighter">
                   {currentEvent.title}
                </h2>

                <div className="flex flex-wrap items-center gap-6 mb-8">
                   <div className="flex items-center gap-2.5 text-slate-200">
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                         <Calendar className="w-4 h-4 text-indigo-400" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest">{formatDate(currentEvent.date)}</span>
                   </div>
                   <div className="flex items-center gap-2.5 text-slate-200">
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                         <MapPin className="w-4 h-4 text-indigo-400" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest">{currentEvent.location}</span>
                   </div>
                </div>

                <div className="flex items-center gap-4">
                   <Link 
                     to={`/event/${currentEvent.id}`}
                     className="bg-white text-slate-950 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 hover:text-white transition-all shadow-xl active:scale-95"
                   >
                      Get Tickets - {formatCurrency(currentEvent.price)}
                   </Link>
                </div>
             </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
         <button 
           onClick={(e) => { e.stopPropagation(); prevSlide(); }}
           className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all pointer-events-auto active:scale-90"
         >
            <ChevronLeft className="w-6 h-6" />
         </button>
         <button 
           onClick={(e) => { e.stopPropagation(); nextSlide(); }}
           className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all pointer-events-auto active:scale-90"
         >
            <ChevronRight className="w-6 h-6" />
         </button>
      </div>

      {/* Pagination Dots */}
      <div className="absolute bottom-10 right-10 flex gap-2.5 z-10">
         {events.map((_, idx) => (
           <button 
             key={idx}
             onClick={() => {
               setDirection(idx > currentIndex ? 1 : -1);
               setCurrentIndex(idx);
             }}
             className={`h-1.5 rounded-full transition-all duration-300 ${
               currentIndex === idx ? 'w-8 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50'
             }`}
           />
         ))}
      </div>

      {/* Progress Bar */}
      {!isPaused && events.length > 1 && (
        <div className="absolute bottom-0 left-0 h-1 bg-indigo-600/50 z-20 w-full overflow-hidden">
          <motion.div 
            key={currentIndex}
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            transition={{ duration: autoPlayInterval / 1000, ease: "linear" }}
            className="h-full bg-indigo-600 w-full"
          />
        </div>
      )}
    </div>
  );
}
