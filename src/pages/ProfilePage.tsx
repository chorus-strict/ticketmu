import { Link, useNavigate } from 'react-router-dom';
import { 
  Ticket, 
  Settings, 
  Bell, 
  CreditCard, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  Edit2, 
  Calendar, 
  Heart, 
  Shield,
  Zap,
  Star,
  Crown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useManagement } from '../contexts/ManagementContext';
import Layout from '../components/layout/Layout';

import { formatDate, getAvatar } from '../lib/utils';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useSettings();
  const { userPoints, tickets, favoriteEventIds } = useManagement();

  const stats = [
    { label: t('profile.booked'), value: tickets.filter(t => t.status === 'ACTIVE').length.toString(), icon: Ticket, color: 'text-indigo-500' },
    { label: t('profile.favorites'), value: favoriteEventIds.size.toString(), icon: Heart, color: 'text-rose-500' },
    { label: 'POINTS', value: userPoints.toString(), icon: Star, color: 'text-amber-500', isPoints: true }
  ];

  const menuItems = [
    { label: t('profile.menu.tickets'), icon: Ticket, path: '/tickets', desc: 'Active passes & history' },
    { label: 'REWARDS HUB', icon: Star, path: '/rewards', desc: 'Redeem points for prizes' },
    { label: t('profile.menu.payment'), icon: CreditCard, path: '/settings', desc: 'Secure billing methods' },
    { label: t('profile.menu.settings'), icon: Settings, path: '/settings', desc: 'Account privacy' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-10">
        
        <div className="grid lg:grid-cols-12 gap-10">
          
          {/* PROFILE SIDEBAR (4 cols) */}
          <aside className="lg:col-span-4 flex flex-col gap-8">
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
               {/* Decorative background */}
               <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-600/10 to-transparent"></div>
               
               <div className="relative mt-8">
                  <div className="w-32 h-32 rounded-[2.5rem] border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                    <img 
                      src={getAvatar(user?.avatar)} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getAvatar(null);
                      }}
                    />
                  </div>
                  <button onClick={() => navigate('/settings')} className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 text-white rounded-xl shadow-lg border-4 border-white dark:border-slate-800 flex items-center justify-center hover:bg-slate-900 transition-colors">
                    <Edit2 className="h-4 w-4" />
                  </button>
               </div>

               <div className="mt-8">
                  <div className="flex items-center justify-center gap-2 mb-2">
                     <h1 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white uppercase italic tracking-tighter">{user?.name}</h1>
                     {user?.role === 'ADMIN' && <Shield className="w-5 h-5 text-rose-500" />}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                      (user?.membershipExpiredAt && new Date(user.membershipExpiredAt) > new Date()) 
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' 
                      : (user?.membershipExpiredAt && new Date(user.membershipExpiredAt) <= new Date())
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30'
                      : user?.membership === 'PENDING'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                    }`}>
                      {(user?.membershipExpiredAt && new Date(user.membershipExpiredAt) > new Date()) ? 'PREMIUM' : 
                       (user?.membershipExpiredAt && new Date(user.membershipExpiredAt) <= new Date()) ? 'EXPIRED' :
                       user?.membership || 'FREE'} Tier
                    </span>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{user?.email}</p>
                  </div>
               </div>

               <div className="w-full grid grid-cols-2 gap-4 mt-10">
                  <button onClick={() => navigate('/settings')} className="py-4 bg-indigo-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
                    Edit Details
                  </button>
                  <button onClick={handleLogout} className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all hover:bg-rose-50 hover:text-rose-600">
                    Logout
                  </button>
               </div>
            </div>

            <div className={`rounded-[3rem] p-8 text-white relative overflow-hidden group ${
              (user?.membershipExpiredAt && new Date(user.membershipExpiredAt) > new Date()) ? 'bg-slate-900 border border-amber-500/30' : 
              (user?.membershipExpiredAt && new Date(user.membershipExpiredAt) <= new Date()) ? 'bg-rose-950 border border-rose-500/30' : 'premium-gradient'
            }`}>
               <div className="absolute top-0 right-0 p-8 transform group-hover:scale-110 transition-transform">
                  <Crown className={`w-16 h-16 ${(user?.membershipExpiredAt && new Date(user.membershipExpiredAt) > new Date()) ? 'text-amber-300' : 'text-white'} opacity-20`} />
               </div>
               <h3 className="text-xl font-display font-extrabold uppercase italic tracking-tighter mb-2">
                 {(user?.membershipExpiredAt && new Date(user.membershipExpiredAt) > new Date()) ? 'Elite Member' : 
                  (user?.membershipExpiredAt && new Date(user.membershipExpiredAt) <= new Date()) ? 'Expired' :
                  user?.membership === 'PENDING' ? 'Verification' : 'Tiketmu Premium'}
               </h3>
               <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mb-8 leading-[1.8] opacity-80">
                 {(user?.membershipExpiredAt && new Date(user.membershipExpiredAt) > new Date()) 
                   ? `Valid until ${formatDate(user.membershipExpiredAt)}. Enjoy all exclusive benefits.` 
                   : (user?.membershipExpiredAt && new Date(user.membershipExpiredAt) <= new Date())
                   ? 'Your premium access has expired. Renew now to restore benefits.'
                   : user?.membership === 'PENDING'
                   ? 'We are currently verifying your upgrade request. This usually takes less than 24 hours.'
                   : 'Access exclusive pre-sales and zero-fee bookings forever.'}
               </p>
               <button 
                 onClick={() => navigate('/membership')}
                 className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-900 hover:text-white transition-all active:scale-95"
               >
                 {(user?.membershipExpiredAt && new Date(user.membershipExpiredAt) > new Date()) ? 'View Benefits' : 
                  (user?.membershipExpiredAt && new Date(user.membershipExpiredAt) <= new Date()) ? 'Renew Now' :
                  user?.membership === 'PENDING' ? 'Check Status' : 'Upgrade to Elite'}
               </button>
            </div>
          </aside>

          {/* MAIN CONTENT (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-10">
             
             {/* STATS GRID */}
             <div className="grid grid-cols-3 gap-6">
                {stats.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center group hover:border-indigo-300 dark:hover:border-indigo-900 transition-all">
                       <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Icon className={`w-5 h-5 ${stat.color}`} />
                       </div>
                       <p className="text-3xl font-display font-black text-slate-900 dark:text-white italic leading-none">{stat.value}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-3">{stat.label}</p>
                    </div>
                  );
                })}
             </div>

             {/* SETTINGS MENU */}
             <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-2">
                <div className="p-8 pb-4">
                   <h2 className="text-xl font-display font-extrabold text-slate-900 dark:text-white uppercase italic tracking-tighter">Account Hub</h2>
                </div>
                
                <div className="grid sm:grid-cols-2">
                {menuItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <Link 
                      key={i} 
                      to={item.path} 
                      className={`flex items-center gap-6 p-8 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all rounded-[2rem] m-2 group`}
                    >
                      <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-indigo-600 transition-all shadow-sm">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1">{item.label}</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{item.desc}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
                    </Link>
                  );
                })}
                </div>
             </div>

             {/* RECENT ACTIVITY MOCK */}
             <div className="bg-indigo-600/5 dark:bg-indigo-900/10 rounded-[3rem] p-10 border border-indigo-100 dark:border-indigo-900/20">
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-xl font-display font-extrabold text-slate-900 dark:text-white uppercase italic tracking-tighter">Latest Milestones</h2>
                   <Star className="w-5 h-5 text-indigo-600 animate-pulse" />
                </div>
                <div className="space-y-6">
                   <div className="flex gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2"></div>
                      <div>
                         <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest leading-none mb-1">Pass Secured: Jazz Night Indo</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">2 Days Ago • Ref #XJ992</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2"></div>
                      <div>
                         <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest leading-none mb-1">Account Shield Verified</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">1 Week Ago • System Alert</p>
                      </div>
                   </div>
                </div>
             </div>

          </div>
        </div>
      </main>
    </Layout>
  );
}
