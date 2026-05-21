import React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface TicketViewSwitcherProps {
  viewMode: 'list' | 'grid';
  onViewChange: (mode: 'list' | 'grid') => void;
}

export default function TicketViewSwitcher({ viewMode, onViewChange }: TicketViewSwitcherProps) {
  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-inner relative h-[52px]">
      <button
        onClick={() => onViewChange('list')}
        className={cn(
          "relative z-10 flex items-center gap-2 px-6 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500",
          viewMode === 'list' ? "text-white" : "text-slate-400 dark:text-slate-600 hover:text-indigo-600"
        )}
      >
        <List className="w-4 h-4" />
        <span className="hidden sm:inline">List</span>
        {viewMode === 'list' && (
          <motion.div
            layoutId="view-active-bg"
            className="absolute inset-0 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/30 -z-10"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}
      </button>

      <button
        onClick={() => onViewChange('grid')}
        className={cn(
          "relative z-10 flex items-center gap-2 px-6 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500",
          viewMode === 'grid' ? "text-white" : "text-slate-400 dark:text-slate-600 hover:text-indigo-600"
        )}
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="hidden sm:inline">Grid</span>
        {viewMode === 'grid' && (
          <motion.div
            layoutId="view-active-bg"
            className="absolute inset-0 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/30 -z-10"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}
      </button>
    </div>
  );
}
