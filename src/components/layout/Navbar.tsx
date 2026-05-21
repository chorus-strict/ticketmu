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
    ...(user?.role === 'ADMIN' || user?.role === 'ORGANIZER' ? [{ name: t('nav.manage'), path: '/dashboard', icon: LayoutDashboard }] : []),
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

  const handleResultClick = (idOrSlug: string) => {
    // Analytics: Track search result click
    console.log('GA4: Search Result Click - identifier:', idOrSlug);
    setSearchQuery('');
    setShowResults(false);
    navigate(`/event/${idOrSlug}`);
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
    ...(user?.role === 'ADMIN' || user?.role === 'ORGANIZER' ? [{ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }] : []),
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
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[240] lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white dark:bg-slate-900 z-[250] lg:hidden flex flex-col shadow-2xl"
            >
              {/* Menu Header */}
              <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
                 <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-2xl font-display font-extrabold tracking-tight text-indigo-600 uppercase">
                   tiketmu
                 </Link>
                 <button 
                   onClick={() => setIsMenuOpen(false)}
                   className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 active:scale-90 transition-transform"
                 >
                   <X className="w-5 h-5" />
                 </button>
              </div>

              {/* Menu Content */}
              <div className="flex-1 overflow-y-auto pt-8 pb-12 px-6 space-y-10 custom-scrollbar">
                {/* User Profile Summary (Mobile) */}
                {user && (
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform">
                       <Crown className="w-20 h-20" />
                    </div>
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-indigo-600 relative shrink-0 shadow-lg shadow-indigo-500/20">
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
                      <div className="min-w-0">
                        <h4 className="text-base font-black text-slate-900 dark:text-white uppercase italic truncate leading-tight">{user.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate mt-1">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 relative z-10">
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${
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
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">{user.role}</span>
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <div className="grid gap-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2 px-1">Navigation</p>
                  {menuItems.map((item, idx) => (
                    <motion.button
                      key={item.path}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => {
                        navigate(item.path);
                        setIsMenuOpen(false);
                      }}
                      className={`flex items-center gap-4 w-full p-4.5 rounded-2xl transition-all group ${
                        isActive(item.path)
                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30'
                        : 'bg-slate-50 dark:bg-slate-800/20 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.98]'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'stroke-[2.5px]' : 'group-hover:text-indigo-600'}`} />
                      <span className="text-xs font-black uppercase tracking-[0.15em]">{item.name}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Auth Controls */}
                <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                  {!user ? (
                    <div className="grid grid-cols-1 gap-3">
                      <button
                        onClick={() => { navigate('/login'); setIsMenuOpen(false); }}
                        className="w-full py-4.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-transform"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => { navigate('/signup'); setIsMenuOpen(false); }}
                        className="w-full py-4.5 border-2 border-indigo-600 text-indigo-600 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] active:scale-[0.98] transition-transform"
                      >
                        Create Account
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleLogout}
                      className="w-full py-4.5 bg-rose-50 dark:bg-rose-900/10 text-rose-600 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] border border-rose-100 dark:border-rose-900/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </button>
                  )}
                </div>
              </div>

              {/* Menu Footer */}
              <div className="p-8 text-center border-t border-slate-50 dark:border-slate-800/50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] opacity-30">Tiketmu Premium Exclusive</p>
              </div>
            </motion.div>
          </>
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
                          onClick={() => { handleResultClick(event.slug || event.id); setIsMobileSearchOpen(false); }}
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
      <header className="hidden lg:flex fixed top-0 w-full h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 z-[100] transition-all duration-300">
        <div className="max-w-[1440px] mx-auto w-full flex items-center justify-between px-6 xl:px-12">
          <div className="flex items-center gap-8 xl:gap-16">
            <Link to="/" className="text-2xl xl:text-3xl font-display font-black tracking-tighter text-indigo-600 uppercase italic">
              tiketmu
            </Link>
            
            <nav className="flex items-center gap-4 xl:gap-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.path} 
                  to={link.path}
                  className={`text-[10px] xl:text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 group relative py-2 ${
                    isActive(link.path) ? 'text-indigo-600' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600'
                  }`}
                >
                  <link.icon className={`w-4 h-4 ${isActive(link.path) ? 'stroke-[2.5px]' : 'group-hover:scale-110 transition-transform'}`} />
                  <span className="hidden sm:inline-block">{link.name}</span>
                  {isActive(link.path) && (
                    <motion.div 
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"
                    />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4 xl:gap-8">
            <div className="relative group hidden lg:block w-48 xl:w-80" ref={searchRef}>
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
                  placeholder={t('nav.search')}
                  className="w-full pl-11 pr-10 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-900 border focus:border-indigo-600 rounded-xl focus:outline-none transition-all font-bold text-[11px] uppercase tracking-wider"
               />
               <AnimatePresence>
                 {searchQuery && (
                   <motion.button 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                   >
                     <X className="w-3.5 h-3.5" />
                   </motion.button>
                 )}
               </AnimatePresence>

               {/* Dropdown Results */}
               <AnimatePresence>
                 {showResults && (
                   <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full mt-4 w-[450px] right-0 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-slate-800 p-3 overflow-hidden z-[110]"
                   >
                     {searchResults.length > 0 ? (
                       <div className="flex flex-col">
                         <div className="p-4 border-b border-slate-50 dark:border-slate-800/50 flex justify-between items-center">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Direct Matches</p>
                           <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">{searchResults.length} found</span>
                         </div>
                         <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                           {searchResults.map((event) => (
                             <button
                              key={event.id}
                              onClick={() => handleResultClick(event.slug || event.id)}
                              className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-2xl transition-all text-left group"
                             >
                               <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800 relative">
                                 <img 
                                  src={event.image} 
                                  alt="" 
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                  onError={(e) => (e.currentTarget.src = getFallbackImage(event.category))}
                                 />
                                 <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                               </div>
                               <div className="flex-1 min-w-0">
                                 <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase italic truncate">
                                   {highlightMatch(event.title, searchQuery)}
                                 </h4>
                                 <div className="flex items-center gap-4 mt-2 opacity-60">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                      {formatDate(event.date)}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest truncate">
                                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                                      {event.location}
                                    </div>
                                 </div>
                               </div>
                             </button>
                           ))}
                         </div>
                         <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30">
                            <button className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-slate-900 transition-all">
                               View All Experiences
                            </button>
                         </div>
                       </div>
                     ) : (
                       <div className="p-12 text-center">
                         <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Search className="w-8 h-8 text-slate-300" />
                         </div>
                         <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-relaxed">No events found matching<br/>"<span className="text-indigo-600">{searchQuery}</span>"</p>
                       </div>
                     )}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 xl:gap-4">
              <div className="relative">
                <button 
                  ref={notificationTriggerRef}
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className={`p-3 rounded-xl transition-all relative group ${
                    isNotificationOpen 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  {unreadCount > 0 && (
                    <span className={`absolute -top-1 -right-1 min-w-[1.2rem] h-[1.2rem] flex items-center justify-center text-[9px] font-black rounded-full border-2 px-1 animate-in zoom-in duration-300 ${
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

              <Link to="/cart" className="p-3 text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all relative group">
                <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[1.2rem] h-[1.2rem] bg-indigo-600 text-[9px] font-black text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 px-1">
                    {cart.length}
                  </span>
                )}
              </Link>

              <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-2"></div>
              
              {user ? (
                <Link to="/profile" className="flex items-center gap-4 group bg-slate-50 dark:bg-slate-800/40 pl-1 pr-6 py-1 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                  <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-transparent group-hover:border-indigo-600 transition-all relative shrink-0">
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
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                        <Crown className="w-3 h-3 text-amber-900" />
                      </div>
                    )}
                  </div>
                  <div className="hidden xl:block min-w-0">
                    <p className="text-xs font-black text-slate-900 dark:text-white leading-none mb-1.5 uppercase italic truncate">{user.name}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                        (user?.membershipExpiredAt && new Date(user.membershipExpiredAt) > new Date()) 
                        ? 'bg-amber-100 text-amber-700' 
                        : (user?.membershipExpiredAt && new Date(user.membershipExpiredAt) <= new Date())
                        ? 'bg-rose-100 text-rose-700'
                        : user.membership === 'PENDING'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-slate-200 text-slate-500 dark:bg-slate-700'
                      }`}>
                        {(user?.membershipExpiredAt && new Date(user.membershipExpiredAt) > new Date()) ? 'PREMIUM' : 
                         (user?.membershipExpiredAt && new Date(user.membershipExpiredAt) <= new Date()) ? 'EXPIRED' :
                         user.membership}
                      </span>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-3">
                  <Link 
                    to="/login" 
                    className="flex items-center gap-2 px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] transition-all"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/signup" 
                    className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                  >
                    Join
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 w-full h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 z-[100] flex justify-between items-center px-4 transition-all">
        <Link to="/" className="text-xl font-display font-black tracking-tight text-indigo-600 uppercase italic">
          tiketmu
        </Link>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMobileSearchOpen(true)}
            className="p-2.5 text-slate-500 dark:text-slate-400 active:scale-90 transition-transform"
          >
            <Search className="h-5 w-5" />
          </button>
          
          <Link to="/cart" className="p-2.5 text-slate-500 dark:text-slate-400 relative active:scale-90 transition-transform">
            <ShoppingBag className="h-5 w-5" />
            {cart.length > 0 && (
              <div className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-indigo-600 text-[8px] font-black text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                {cart.length}
              </div>
            )}
          </Link>
          
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2.5 text-slate-900 dark:text-white active:scale-90 transition-transform"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation - Floating pill style */}
      <nav className="lg:hidden fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 w-[92%] max-w-md z-[100]">
        <div className="flex items-center h-16 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] px-1">
            {navLinks.map((link) => {
              const isLinkActive = isActive(link.path);
              return (
                <Link 
                  key={link.path} 
                  to={link.path}
                  className={`flex-1 flex flex-col items-center justify-center transition-all h-12 rounded-2xl relative ${
                    isLinkActive ? 'text-indigo-400 scale-110' : 'text-slate-500'
                  }`}
                >
                  <link.icon className={`w-5 h-5 ${isLinkActive ? 'stroke-[2.5px]' : ''}`} />
                  {isLinkActive && (
                    <motion.div 
                      layoutId="mobile-nav-dot"
                      className="absolute -bottom-1 w-1 h-1 bg-indigo-400 rounded-full"
                    />
                  )}
                  <span className={`text-[7px] font-black uppercase tracking-[0.2em] mt-1 ${isLinkActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                    {link.name}
                  </span>
                </Link>
              );
            })}
        </div>
      </nav>
    </>
  );
}
