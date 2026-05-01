import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Ticket, 
  User, 
  ShoppingBag, 
  Menu,
  LayoutDashboard,
  Bell,
  Settings,
  Loader2,
  X,
  MapPin,
  Calendar,
  CheckCircle2,
  LogIn,
  LogOut,
  Crown,
  Heart
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useManagement } from '../../contexts/ManagementContext';
import { useSettings } from '../../contexts/SettingsContext';
import { formatDate, formatDateTime, formatTimeAgo, getAvatar } from '../../lib/utils';
import { getFallbackImage } from '../../lib/imageSync';
import { motion, AnimatePresence } from 'motion/react';
import NotificationPanel from './NotificationPanel';

export default function Navbar() {
  const { user } = useAuth();
  const { cart, searchEvents, backendNotifications, markNotificationsRead, markNotificationsReadById } = useManagement();
  const unreadCount = Array.isArray(backendNotifications) ? backendNotifications.filter(n => !n.isRead).length : 0;
  const { t } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { name: t('nav.explore'), path: '/', icon: Home },
    { name: t('nav.tickets'), path: '/tickets', icon: Ticket },
    { name: 'Favorites', path: '/favorites', icon: Heart },
    ...(user?.role === 'ADMIN' ? [{ name: t('nav.manage'), path: '/dashboard', icon: LayoutDashboard }] : []),
    { name: t('nav.profile'), path: '/profile', icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Debounced search logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true);
        // Analytics: Track search usage
        console.log('GA4: Search Event - query:', searchQuery);
        
        const results = await searchEvents(searchQuery);
        setSearchResults(results.slice(0, 5)); // Show top 5
        setIsSearching(false);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, searchEvents]);

  // Click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (eventId: string) => {
    // Analytics: Track search result click
    console.log('GA4: Search Result Click - eventId:', eventId);
    setSearchQuery('');
    setShowResults(false);
    navigate(`/event/${eventId}`);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <span key={i} className="text-indigo-600 dark:text-indigo-400 font-black">{part}</span> 
        : part
    );
  };

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationTriggerRef = useRef<HTMLButtonElement>(null);

  const { logout } = useAuth();

  const menuItems = [
    { name: t('nav.explore'), path: '/', icon: Home },
    { name: t('nav.tickets'), path: '/tickets', icon: Ticket },
    { name: 'Favorites', path: '/favorites', icon: Heart },
    { name: 'Membership', path: '/membership', icon: Crown },
    ...(user ? [{ name: t('nav.profile'), path: '/profile', icon: User }] : []),
    ...(user?.role === 'ADMIN' ? [{ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }] : []),
  ];

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white dark:bg-slate-900 z-[250] lg:hidden flex flex-col"
          >
            {/* Menu Header */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800">
               <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-xl font-display font-extrabold tracking-tight text-indigo-600 uppercase">
                 tiketmu
               </Link>
               <button 
                 onClick={() => setIsMenuOpen(false)}
                 className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl"
               >
                 <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
               </button>
            </div>

            {/* Menu Content */}
            <div className="flex-1 overflow-y-auto py-8 px-6 space-y-8">
              {/* User Profile Summary (Mobile) */}
              {user && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-indigo-600 relative">
                      <img 
                        src={getAvatar(user.avatar)} 
                        alt={user.name} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getAvatar(null);
                        }}
                      />
                      {user.membershipExpiredAt && new Date(user.membershipExpiredAt) > new Date() && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center">
                          <Crown className="w-3 h-3 text-amber-900" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase italic">{user.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.email}</p>
                    </div>
                  </div>
                    <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${
                      (user?.membershipExpiredAt && new Date(user.membershipExpiredAt) > new Date()) 
                      ? 'bg-amber-100 text-amber-700' 
                      : (user?.membershipExpiredAt && new Date(user.membershipExpiredAt) <= new Date())
                      ? 'bg-rose-100 text-rose-700'
                      : user.membership === 'PENDING'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {(user?.membershipExpiredAt && new Date(user.membershipExpiredAt) > new Date()) ? 'PREMIUM' : 
                       (user?.membershipExpiredAt && new Date(user.membershipExpiredAt) <= new Date()) ? 'EXPIRED' :
                       user.membership} TIER
                    </span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{user.role}</span>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <div className="grid gap-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-2">Navigation</p>
                {menuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsMenuOpen(false);
                    }}
                    className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all ${
                      isActive(item.path)
                      ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">{item.name}</span>
                  </button>
                ))}
              </div>

              {/* Auth Controls */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                {!user ? (
                  <>
                    <button
                      onClick={() => { navigate('/login'); setIsMenuOpen(false); }}
                      className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em]"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => { navigate('/signup'); setIsMenuOpen(false); }}
                      className="w-full py-4 border-2 border-indigo-600 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em]"
                    >
                      Create Account
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="w-full py-4 bg-rose-50 dark:bg-rose-900/10 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-rose-100 dark:border-rose-900/20 flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                )}
              </div>
            </div>

            {/* Menu Footer */}
            <div className="p-8 text-center opacity-40">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Tiketmu © 2026 • Premium Ticketing</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Overlay (Mobile) */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white dark:bg-slate-900 z-[200] lg:hidden flex flex-col"
          >
            <div className="h-20 flex items-center gap-4 px-5 border-b border-slate-200 dark:border-slate-800">
               <button onClick={() => { setIsMobileSearchOpen(false); setSearchQuery(''); }} className="p-2 -ml-2">
                 <X className="w-6 h-6 text-slate-500" />
               </button>
               <div className="flex-1 relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search events, categories..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-sm focus:outline-none"
                 />
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5">
               {isSearching ? (
                 <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Searching...</p>
                 </div>
               ) : searchQuery.length > 1 ? (
                 searchResults.length > 0 ? (
                    <div className="space-y-4">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Top Matches</p>
                       {searchResults.map((event) => (
                         <button
                          key={event.id}
                          onClick={() => { handleResultClick(event.id); setIsMobileSearchOpen(false); }}
                          className="flex items-center gap-4 w-full text-left bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl"
                         >
                            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                               <img 
                                src={event.image} 
                                alt="" 
                                className="w-full h-full object-cover" 
                                onError={(e) => (e.currentTarget.src = getFallbackImage(event.category))}
                               />
                            </div>
                            <div className="flex-1 min-w-0">
                               <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase italic truncate">
                                 {highlightMatch(event.title, searchQuery)}
                               </h4>
                               <div className="space-y-1 mt-2">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                    {formatDate(event.date)}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
                                    <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                                    {event.location}
                                  </div>
                               </div>
                            </div>
                         </button>
                       ))}
                    </div>
                 ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                       <Search className="w-12 h-12 mb-4" />
                       <p className="text-xs font-bold uppercase tracking-widest">No results found</p>
                    </div>
                 )
               ) : (
                 <div className="text-center py-20 opacity-40">
                   <p className="text-xs font-bold uppercase tracking-widest">Start typing to discover events</p>
                 </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Navigation */}
      <header className="hidden lg:flex fixed top-0 w-full h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 z-[100] transition-colors duration-300">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-8">
          <div className="flex items-center gap-12">
            <Link to="/" className="text-2xl font-display font-extrabold tracking-tighter text-indigo-600 uppercase">
              tiketmu
            </Link>
            
            <nav className="flex items-center gap-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.path} 
                  to={link.path}
                  className={`text-sm font-bold uppercase tracking-widest transition-all hover:text-indigo-600 flex items-center gap-2 ${
                    isActive(link.path) ? 'text-indigo-600' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <link.icon className={`w-4 h-4 ${isActive(link.path) ? 'stroke-[2.5px]' : ''}`} />
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group hidden xl:block w-72" ref={searchRef}>
               {isSearching ? (
                 <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-600 animate-spin" />
               ) : (
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
               )}
               <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length > 1 && setShowResults(true)}
                  placeholder={t('nav.search') + "..."}
                  className="w-full pl-11 pr-10 py-2.5 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 border focus:border-indigo-600 rounded-xl focus:outline-none transition-all font-medium text-sm"
               />
               {searchQuery && (
                 <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                 >
                   <X className="w-4 h-4" />
                 </button>
               )}

               {/* Dropdown Results */}
               <AnimatePresence>
                 {showResults && (
                   <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full mt-3 w-[400px] right-0 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-2 overflow-hidden z-[110]"
                   >
                     {searchResults.length > 0 ? (
                       <div className="flex flex-col">
                         <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Quick Results</p>
                         </div>
                         {searchResults.map((event) => (
                           <button
                            key={event.id}
                            onClick={() => handleResultClick(event.id)}
                            className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all text-left group"
                           >
                             <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                               <img 
                                src={event.image} 
                                alt="" 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                onError={(e) => (e.currentTarget.src = getFallbackImage(event.category))}
                               />
                             </div>
                             <div className="flex-1 min-w-0">
                               <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase italic truncate">
                                 {highlightMatch(event.title, searchQuery)}
                               </h4>
                               <div className="flex items-center gap-3 mt-1 opacity-60">
                                  <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {formatDate(event.date)}
                                  </div>
                                  <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest truncate">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {event.location}
                                  </div>
                               </div>
                             </div>
                           </button>
                         ))}
                         <div className="p-3 bg-slate-50 dark:bg-slate-800/50 flex justify-center">
                            <button className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline">
                              View all results
                            </button>
                         </div>
                       </div>
                     ) : (
                       <div className="p-8 text-center">
                         <Search className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                         <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No events found for "{searchQuery}"</p>
                       </div>
                     )}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMobileSearchOpen(true)}
                className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all xl:hidden"
              >
                <Search className="w-5 h-5" />
              </button>
              <div className="relative">
                <button 
                  ref={notificationTriggerRef}
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className={`p-2.5 rounded-xl transition-all relative ${
                    isNotificationOpen 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className={`absolute -top-1 -right-1 min-w-[1.2rem] h-[1.2rem] flex items-center justify-center text-[9px] font-bold rounded-full border-2 px-1 animate-in zoom-in duration-300 ${
                      isNotificationOpen ? 'bg-white text-indigo-600 border-indigo-600' : 'bg-indigo-600 text-white border-white dark:border-slate-900'
                    }`}>
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                <NotificationPanel 
                  isOpen={isNotificationOpen} 
                  onClose={() => setIsNotificationOpen(false)}
                  triggerRef={notificationTriggerRef}
                />
              </div>
              <Link to="/cart" className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all relative">
                <ShoppingBag className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                    {cart.length}
                  </span>
                )}
              </Link>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
              
              {user ? (
                <Link to="/profile" className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-transparent group-hover:border-indigo-600 transition-all relative">
                    <img 
                      src={getAvatar(user?.avatar)} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getAvatar(null);
                      }}
                    />
                    {user?.membershipExpiredAt && new Date(user.membershipExpiredAt) > new Date() && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                        <Crown className="w-2.5 h-2.5 text-amber-900" />
                      </div>
                    )}
                  </div>
                  <div className="hidden xl:block">
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-none mb-1">{user.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-[0.1em] ${
                        (user?.membershipExpiredAt && new Date(user.membershipExpiredAt) > new Date()) 
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' 
                        : (user?.membershipExpiredAt && new Date(user.membershipExpiredAt) <= new Date())
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30'
                        : user.membership === 'PENDING'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                      }`}>
                        {(user?.membershipExpiredAt && new Date(user.membershipExpiredAt) > new Date()) ? 'PREMIUM' : 
                         (user?.membershipExpiredAt && new Date(user.membershipExpiredAt) <= new Date()) ? 'EXPIRED' :
                         user.membership}
                      </span>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{user.role}</span>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-3">
                  <Link 
                    to="/login" 
                    className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 font-bold text-[10px] uppercase tracking-widest transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Link>
                  <Link 
                    to="/signup" 
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all active:scale-95"
                  >
                    Join Now
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 w-full h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 z-[100] flex justify-between items-center px-5 transition-colors duration-300">
        <Link to="/" className="text-xl font-display font-extrabold tracking-tight text-indigo-600 uppercase">
          tiketmu
        </Link>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMobileSearchOpen(true)}
            className="p-2 text-slate-500 dark:text-slate-400"
          >
            <Search className="h-5 w-5" />
          </button>
          <button 
            onClick={() => setIsNotificationOpen(true)}
            className="p-2 text-slate-500 dark:text-slate-400 relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <div className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-[8px] font-bold text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                {unreadCount}
              </div>
            )}
          </button>
          <Link to="/cart" className="p-2 text-slate-500 dark:text-slate-400 relative">
            <ShoppingBag className="h-5 w-5" />
            {cart.length > 0 && (
              <div className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-[8px] font-bold text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                {cart.length}
              </div>
            )}
          </Link>
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 -mr-2 text-slate-600 dark:text-slate-400"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[100] flex justify-around items-center h-16 bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/20">
        {navLinks.map((link) => (
          <Link 
            key={link.path} 
            to={link.path}
            className={`flex flex-col items-center justify-center transition-all px-4 py-2 rounded-xl ${
              isActive(link.path) ? 'text-white' : 'text-slate-400'
            }`}
          >
            <link.icon className={`w-5 h-5 ${isActive(link.path) ? 'stroke-[2.5px]' : ''}`} />
            {isActive(link.path) && (
              <span className="text-[8px] font-bold uppercase tracking-widest mt-1">{link.name}</span>
            )}
          </Link>
        ))}
      </nav>
    </>
  );
}
