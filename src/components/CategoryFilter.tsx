import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LucideIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface Category {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function CategoryFilter({ categories, selectedId, onSelect }: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!Array.isArray(categories)) {
    console.error('CategoryFilter received invalid categories prop');
    return null;
  }
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Handle scroll arrows visibility
  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 20);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      checkScroll();
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, []);

  // Auto-scroll selected into view
  useEffect(() => {
    const activeEl = scrollRef.current?.querySelector(`[data-active="true"]`);
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [selectedId]);

  // Mouse drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Multiplier for scroll speed
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth'
    });
  };

  return (
    <div className="relative group/categories px-4 sm:px-0">
      {/* Edge Gradients */}
      <div className={`absolute left-0 top-0 bottom-6 w-32 bg-gradient-to-r from-white dark:from-slate-950 to-transparent z-10 pointer-events-none transition-opacity duration-500 ${showLeftArrow ? 'opacity-100' : 'opacity-0'}`} />
      <div className={`absolute right-0 top-0 bottom-6 w-32 bg-gradient-to-l from-white dark:from-slate-950 to-transparent z-10 pointer-events-none transition-opacity duration-500 ${showRightArrow ? 'opacity-100' : 'opacity-0'}`} />

      {/* Navigation Arrows (Desktop Only) */}
      <AnimatePresence>
        {showLeftArrow && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onClick={() => scroll('left')}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors hidden md:flex"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
        )}
        {showRightArrow && (
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            onClick={() => scroll('right')}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors hidden md:flex"
          >
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <div 
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={`flex items-center gap-3 sm:gap-4 overflow-x-auto pb-6 hide-scrollbar snap-x snap-proximity scroll-smooth select-none ${isDragging ? 'cursor-grabbing scale-[0.99]' : 'cursor-grab'} transition-transform duration-500`}
      >
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedId === cat.id;
          return (
            <motion.button 
              key={cat.id}
              data-active={isActive}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (!isDragging) onSelect(cat.id);
              }}
              className={`flex-none flex items-center gap-4 pl-4 pr-7 py-4 rounded-[2rem] snap-start transition-all duration-500 border relative overflow-hidden group/item ${
                isActive 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xl shadow-indigo-600/40' 
                  : 'bg-white dark:bg-slate-900/40 backdrop-blur-md border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-sm'
              }`}
            >
              {isActive && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -right-4 -top-4 w-12 h-12 bg-white/10 rounded-full blur-xl"
                />
              )}
              
              <div className={`p-3 rounded-2xl transition-all duration-500 flex items-center justify-center ${
                isActive 
                  ? 'bg-white/20 rotate-12 scale-110 shadow-lg shadow-white/10' 
                  : 'bg-slate-50 dark:bg-slate-800 group-hover/item:bg-indigo-50 dark:group-hover/item:bg-slate-700 group-hover/item:rotate-12 group-hover/item:scale-110 transition-transform'
              }`}>
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-500'}`} />
              </div>

              <div className="flex flex-col items-start text-left relative z-10">
                <span className={`font-black text-[10px] uppercase tracking-[0.2em] leading-none mb-1.5 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                }`}>
                  {cat.label}
                </span>
                <span className={`text-[8px] font-bold uppercase tracking-widest opacity-60 transition-colors ${
                  isActive ? 'text-indigo-100' : 'text-slate-400'
                }`}>
                  {cat.description}
                </span>
              </div>
              
              {!isActive && (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
