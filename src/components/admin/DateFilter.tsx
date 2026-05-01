import React, { useState, useRef, useEffect } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { 
  format, 
  parseISO, 
  isSameMonth, 
  isValid, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  startOfToday,
  startOfYesterday,
  isSameDay
} from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  X, 
  ChevronDown, 
  Zap,
  Clock,
  LayoutGrid,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Premium SaaS styling for range connection and professional look
const calendarStyles = `
  .rdp {
    --rdp-cell-size: 36px;
    --rdp-accent-color: #6366f1;
    --rdp-background-color: #f1f5fe;
    --rdp-accent-color-dark: #818cf8;
    --rdp-background-color-dark: #1e1b4b;
    margin: 0;
  }
  .rdp-months { justify-content: center; }
  .rdp-caption_label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; }
  .rdp-nav_button { color: #cbd5e1; border-radius: 10px; transition: all 0.2s; background: transparent; border: none; }
  .rdp-nav_button:hover { background: #f1f5f9; color: #6366f1; }
  .rdp-head_cell { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #cbd5e1; padding-bottom: 12px; }
  .rdp-day { font-size: 11px; font-weight: 700; border-radius: 8px; transition: all 0.15s; position: relative; }
  
  /* Range Highlighting - Precision CSS */
  .rdp-day_range_start:not(.rdp-day_range_end) { 
    border-top-right-radius: 0 !important; 
    border-bottom-right-radius: 0 !important; 
  }
  .rdp-day_range_end:not(.rdp-day_range_start) { 
    border-top-left-radius: 0 !important; 
    border-bottom-left-radius: 0 !important; 
  }
  .rdp-day_range_middle { 
    border-radius: 0 !important;
    background-color: var(--rdp-background-color) !important;
    color: var(--rdp-accent-color) !important;
  }
  .dark .rdp-day_range_middle { 
    background-color: var(--rdp-background-color-dark) !important;
    color: var(--rdp-accent-color-dark) !important;
  }
  
  .rdp-day_selected {
    background-color: var(--rdp-accent-color) !important;
    color: white !important;
  }
  
  .rdp-day:hover:not(.rdp-day_selected) { 
    background: #f8fafc !important; 
    color: #6366f1 !important; 
  }
  .dark .rdp-day:hover:not(.rdp-day_selected) { 
    background: #1e293b !important; 
  }
`;

export type DateFilterValue = {
  mode: 'RANGE' | 'MONTH';
  start?: string; // YYYY-MM-DD
  end?: string;   // YYYY-MM-DD
  month?: string; // YYYY-MM
};

interface DateFilterProps {
  value: DateFilterValue;
  onChange: (val: DateFilterValue) => void;
}

export default function DateFilter({ value, onChange }: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'RANGE' | 'MONTH'>(value.mode);
  const containerRef = useRef<HTMLDivElement>(null);

  const rangeValue: DateRange | undefined = value.mode === 'RANGE' ? {
    from: value.start ? parseISO(value.start) : undefined,
    to: value.end ? parseISO(value.end) : undefined
  } : undefined;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (range) {
      const newVal: DateFilterValue = {
        mode: 'RANGE',
        start: range.from ? format(range.from, 'yyyy-MM-dd') : undefined,
        end: range.to ? format(range.to, 'yyyy-MM-dd') : undefined
      };
      onChange(newVal);
      
      // Auto-close if both are selected
      if (range.from && range.to) {
        setTimeout(() => setIsOpen(false), 300);
      }
    }
  };

  const handleMonthSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal: DateFilterValue = {
      mode: 'MONTH',
      month: e.target.value
    };
    onChange(newVal);
    // Auto-close on month selection 
    setTimeout(() => setIsOpen(false), 300);
  };

  const setPreset = (type: 'TODAY' | 'YESTERDAY' | 'LAST_7' | 'THIS_MONTH' | 'LAST_MONTH') => {
    let start: Date;
    let end: Date = startOfToday();

    switch(type) {
      case 'TODAY':
        start = end = startOfToday();
        break;
      case 'YESTERDAY':
        start = end = startOfYesterday();
        break;
      case 'LAST_7':
        start = subDays(end, 6);
        break;
      case 'THIS_MONTH':
        start = startOfMonth(end);
        end = endOfMonth(end);
        break;
      case 'LAST_MONTH':
        const lastMonth = subDays(startOfMonth(end), 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
    }

    onChange({
      mode: 'RANGE',
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    });
    setIsOpen(false);
  };

  const getLabel = () => {
    if (value.mode === 'MONTH' && value.month) {
      const date = parseISO(`${value.month}-01`);
      if (isValid(date)) return format(date, 'MMMM yyyy');
    }
    
    if (value.mode === 'RANGE' && value.start && value.end) {
      const from = parseISO(value.start);
      const to = parseISO(value.end);
      if (isSameDay(from, to)) return format(from, 'dd MMM yyyy');
      if (isSameMonth(from, to)) return `${format(from, 'dd')}–${format(to, 'dd MMM yyyy')}`;
      return `${format(from, 'dd MMM')} – ${format(to, 'dd MMM yyyy')}`;
    }

    if (value.start) return `From ${format(parseISO(value.start), 'dd MMM yyyy')}`;
    
    return 'Select Period';
  };

  const clearFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Default to this month instead of empty
    const thisMonth = format(new Date(), 'yyyy-MM');
    onChange({ mode: 'MONTH', month: thisMonth });
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <style>{calendarStyles}</style>

      {/* Modern Unified Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-3 px-4 h-11 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border ${isOpen ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-slate-200 dark:border-slate-800'} rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md hover:border-indigo-300 cursor-pointer`}
      >
        <div className="flex items-center gap-2.5">
          <CalendarIcon className={`w-4 h-4 ${isOpen ? 'text-indigo-500' : 'text-slate-400'}`} />
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
            {getLabel()}
          </span>
        </div>

        <div className="flex items-center gap-2 ml-4 border-l border-slate-100 dark:border-slate-800 pl-3">
          <button 
            onClick={clearFilter}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
        </div>
      </div>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="absolute top-full mt-4 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden min-w-[320px] sm:min-w-[550px]"
          >
            {/* Left: Quick Filters */}
            <div className="w-full md:w-52 p-6 bg-slate-50/50 dark:bg-slate-800/30 border-r border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center gap-2 mb-4 px-2">
                <Zap className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Presets</span>
              </div>
              
              <div className="space-y-1">
                {[
                  { id: 'TODAY', label: 'Today', icon: <Clock /> },
                  { id: 'YESTERDAY', label: 'Yesterday', icon: <Clock /> },
                  { id: 'LAST_7', label: 'Last 7 Days', icon: <CalendarIcon /> },
                  { id: 'THIS_MONTH', label: 'This Month', icon: <LayoutGrid /> },
                  { id: 'LAST_MONTH', label: 'Last Month', icon: <LayoutGrid /> },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setPreset(preset.id as any)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-bold text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 transition-all text-left"
                  >
                    <span className="w-3.5 h-3.5 opacity-50">{preset.icon}</span>
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setActiveTab('RANGE')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'RANGE' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-100'}`}
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    Range Selection
                  </button>
                  <button
                    onClick={() => setActiveTab('MONTH')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'MONTH' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-100'}`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    Full Month
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Interactive Area */}
            <div className="flex-1 p-8 flex flex-col items-center justify-center min-w-[320px]">
              {activeTab === 'RANGE' ? (
                <div className="animate-in fade-in zoom-in duration-300">
                  <DayPicker
                    mode="range"
                    selected={rangeValue}
                    onSelect={handleRangeSelect}
                    className="border-none"
                    showOutsideDays
                  />
                  <div className="mt-6 flex items-center justify-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">
                    <span>Click start</span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <span>Click end</span>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center gap-6 py-10 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="text-center">
                    <h4 className="text-xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Monthly Insight</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Select a full month period</p>
                  </div>
                  
                  <input 
                    type="month" 
                    value={value.month || format(new Date(), 'yyyy-MM')}
                    onChange={handleMonthSelect}
                    className="w-full max-w-[260px] px-8 py-5 bg-indigo-50/50 dark:bg-slate-800 border-2 border-indigo-100 dark:border-slate-700 rounded-3xl text-2xl font-display font-black text-indigo-600 outline-none focus:border-indigo-500 text-center transition-all shadow-inner"
                  />
                  
                  <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-2xl max-w-[300px]">
                    <Zap className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed uppercase">Monthly view aggregates performance across the entire 30-day cycle.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
