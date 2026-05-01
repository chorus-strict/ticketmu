import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  X, 
  CheckCircle2, 
  Trash2, 
  CheckSquare, 
  Inbox,
  ArrowLeft,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useManagement } from '../../contexts/ManagementContext';
import { formatTimeAgo } from '../../lib/utils';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

export default function NotificationPanel({ isOpen, onClose, triggerRef }: NotificationPanelProps) {
  const navigate = useNavigate();
  const { 
    backendNotifications, 
    markNotificationsRead, 
    markNotificationsReadById,
    deleteNotification,
    clearAllNotifications 
  } = useManagement();

  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const unreadCount = Array.isArray(backendNotifications) ? backendNotifications.filter(n => !n.isRead).length : 0;

  // Handle click outside to close (desktop only)
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current && 
        !triggerRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('.notification-panel')
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  const handleClearAll = async () => {
    setIsDeletingAll(true);
    await clearAllNotifications();
    setIsDeletingAll(false);
    setShowConfirmClear(false);
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
        <Bell className="w-10 h-10 text-slate-300 dark:text-slate-600" />
      </div>
      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase italic mb-2">You're all caught up</h3>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px] leading-relaxed">
        No new notifications at the moment. We'll let you know when something happens.
      </p>
    </div>
  );

  const NotificationItem = ({ notif }: { notif: any, key?: string }) => (
    <motion.div 
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginTop: 0, marginBottom: 0, padding: 0 }}
      className={`group relative p-4 rounded-2xl flex gap-4 transition-all cursor-pointer ${
        notif.isRead 
        ? 'opacity-60 hover:bg-slate-50 dark:hover:bg-slate-800/50' 
        : 'bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/20'
      }`}
      onClick={() => {
        if (!notif.isRead) markNotificationsReadById(notif.id);
        if (notif.link) {
          navigate(notif.link);
          onClose();
        }
      }}
    >
      {/* Type Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
        notif.message.toLowerCase().includes('rejected') || notif.message.toLowerCase().includes('failed')
        ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30' 
        : notif.message.toLowerCase().includes('approved') || notif.message.toLowerCase().includes('success')
        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'
        : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30'
      }`}>
        {notif.message.toLowerCase().includes('rejected') || notif.message.toLowerCase().includes('failed') 
          ? <X className="w-5 h-5" /> 
          : notif.message.toLowerCase().includes('approved') || notif.message.toLowerCase().includes('success')
          ? <CheckCircle2 className="w-5 h-5" />
          : <Bell className="w-5 h-5" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest truncate">
            {notif.title || 'System Update'}
          </p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
            {formatTimeAgo(notif.createdAt)}
          </p>
        </div>
        <p className={`text-xs leading-relaxed ${notif.isRead ? 'text-slate-500 dark:text-slate-400 font-medium' : 'text-slate-900 dark:text-slate-100 font-black'}`}>
          {notif.message}
        </p>
      </div>

      {/* Unread Indicator */}
      {!notif.isRead && (
        <div className="absolute top-4 right-4 w-2 h-2 bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/50"></div>
      )}

      {/* Delete Button (Desktop: Hover, Mobile: Always) */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          deleteNotification(notif.id);
        }}
        className="lg:opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile/Tablet Drawer Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] lg:hidden"
          />

          {/* Panel Container */}
          <motion.div
            initial={{ 
              opacity: 0, 
              y: window.innerWidth < 1024 ? '100%' : 10,
              x: window.innerWidth < 1024 ? 0 : 0,
              scale: window.innerWidth < 1024 ? 1 : 0.95 
            }}
            animate={{ 
              opacity: 1, 
              y: 0,
              x: 0,
              scale: 1 
            }}
            exit={{ 
                opacity: 0, 
                y: window.innerWidth < 1024 ? '100%' : 10,
                scale: window.innerWidth < 1024 ? 1 : 0.95 
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`notification-panel fixed lg:absolute bottom-0 lg:bottom-auto lg:top-full lg:right-0 left-0 right-0 lg:left-auto w-full lg:w-[420px] max-h-[90vh] lg:max-h-[600px] bg-white dark:bg-slate-900 rounded-t-[2.5rem] lg:rounded-[2rem] shadow-2xl border-t lg:border border-slate-200 dark:border-slate-800 z-[210] lg:z-[110] lg:mt-3 flex flex-col overflow-hidden`}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-20">
              <div className="flex items-center gap-3">
                <button 
                  onClick={onClose}
                  className="p-2 -ml-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 lg:hidden"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Notifications</h2>
                  {unreadCount > 0 && (
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">{unreadCount} unread message{unreadCount > 1 ? 's' : ''}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {Array.isArray(backendNotifications) && backendNotifications.length > 0 && (
                  <>
                    <button 
                      onClick={markNotificationsRead}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                      title="Mark all as read"
                    >
                      <CheckSquare className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setShowConfirmClear(true)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                      title="Clear all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
                <button 
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all hidden lg:block"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Clear All Confirmation Overlay */}
            <AnimatePresence>
              {showConfirmClear && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 z-30 flex flex-col items-center justify-center p-8 text-center"
                >
                  <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-4">
                    <Trash2 className="w-8 h-8 text-rose-600" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase italic mb-2">Clear all notifications?</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">This action cannot be undone.</p>
                  <div className="flex items-center gap-3 w-full">
                    <button 
                      onClick={() => setShowConfirmClear(false)}
                      className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-[10px] uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleClearAll}
                      disabled={isDeletingAll}
                      className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center"
                    >
                      {isDeletingAll ? 'Clearing...' : 'Yes, Clear All'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-[300px]">
              {Array.isArray(backendNotifications) && backendNotifications.length > 0 ? (
                <motion.div layout className="space-y-2">
                  <AnimatePresence initial={false}>
                    {backendNotifications.map((notif) => (
                      <NotificationItem key={notif.id} notif={notif} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <EmptyState />
              )}
            </div>

            {/* Footer / Mobile Safety Area */}
            <div className="p-4 py-8 lg:py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 lg:bg-transparent">
               <button 
                onClick={onClose}
                className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] lg:hidden"
               >
                 Close
               </button>
               <p className="hidden lg:block text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                 Tiketmu Intelligent Notification System
               </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
