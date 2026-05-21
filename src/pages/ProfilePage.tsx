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

  const isOrganizer = user?.role === 'ORGANIZER';
  const isAdmin = user?.role === 'ADMIN';

  const stats = [
    { label: t('profile.booked'), value: tickets.filter(t => t.ticketStatus === 'ACTIVE').length.toString(), icon: Ticket, color: 'text-indigo-500' },
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
      <main className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 py-12 lg:py-24">
        
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
          
          {/* PROFILE SIDEBAR (4 cols) */}
          <aside className="lg:col-span-12 xl:col-span-4 flex flex-col gap-10">
            <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-12 lg:p-16 border border-slate-100 dark:border-slate-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] flex flex-col items-center text-center relative overflow-hidden group">
               {/* Decorative background */}
               <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-br from-indigo-600/10 via-indigo-600/5 to-transparent"></div>
               
               <div className="relative mt-4">
                  <div className="w-40 h-40 rounded-[3rem] border-8 border-white dark:border-slate-900 shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-700">
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
                  <button onClick={() => navigate('/settings')} className="absolute -bottom-2 -right-2 w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-2xl border-4 border-white dark:border-slate-900 flex items-center justify-center hover:bg-slate-900 transition-all active:scale-90 z-20">
                    <Edit2 className="h-6 w-6" />
                  </button>
               </div>

               <div className="mt-12 w-full">
                  <div className="flex flex-col items-center gap-4 mb-4">
                     <div className="flex items-center gap-4">
                        <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">{user?.name}</h1>
                        {user?.role === 'ADMIN' && (
                          <div className="w-8 h-8 bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-500 border border-rose-500/20">
                            <Shield className="w-5 h-5" />
                          </div>
                        )}
                     </div>
                     <span className={`text-[9px] font-black px-5 py-2 rounded-xl uppercase tracking-[0.3em] shadow-lg border border-white/10 ${
                       (user?.membershipExpiredAt && new Date(user.membershipExpiredAt) > new Date()) 
                       ? 'bg-amber-400 text-amber-950 shadow-amber-400/20' 
                       : (user?.membershipExpiredAt && new Date(user.membershipExpiredAt) <= new Date())
                       ? 'bg-rose-600 text-white shadow-rose-600/20'
                       : user?.membership === 'PENDING'
                       ? 'bg-amber-500 text-white shadow-amber-500/20'
                       : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                     }`}>
                       {(user?.membershipExpiredAt && new Date(user.membershipExpiredAt) > new Date()) ? 'Elite Status' : 
                        (user?.membershipExpiredAt && new Date(user.membershipExpiredAt) <= new Date()) ? 'Terminated' :
                        user?.membership || 'Standard'}
                     </span>
                  </div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic opacity-60">{user?.email}</p>
               </div>

               <div className="w-full grid grid-cols-2 gap-6 mt-12">
                  <button onClick={() => navigate('/settings')} className="py-5 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/20 active:scale-95 transition-all">
                    Update Profile
                  </button>
                  <button onClick={handleLogout} className="py-5 bg-slate-50 dark:bg-slate-800/50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] border border-slate-100 dark:border-slate-800 active:scale-95 transition-all hover:bg-rose-50/50 hover:text-rose-600 hover:border-rose-100">
                    Terminate Session
                  </button>
               </div>

               {(isAdmin || isOrganizer) && (
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="w-full mt-6 py-6 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl shadow-slate-900/10 active:scale-95 transition-all flex items-center justify-center gap-3 italic"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    {isAdmin ? 'System Terminal' : 'Merchant Console'}
                  </button>
               )}
            </div>

            <div className={`rounded-[3.5rem] p-12 text-white relative overflow-hidden group shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] ${
              (user?.membershipExpiredAt && new Date(user.membershipExpiredAt) > new Date()) ? 'bg-slate-900 border border-amber-500/30 shadow-amber-500/10' : 
              (user?.membershipExpiredAt && new Date(user.membershipExpiredAt) <= new Date()) ? 'bg-rose-950 border border-rose-500/30' : 'premium-gradient shadow-indigo-600/20'
            }`}>
               <div className="absolute top-0 right-0 p-10 transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 opacity-20">
                  <Crown className={`w-28 h-28 ${(user?.membershipExpiredAt && new Date(user.membershipExpiredAt) > new Date()) ? 'text-amber-300' : 'text-white'}`} />
               </div>
               
               <div className="relative z-10">
                 <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em] mb-4 block leading-none">Elite Access Portal</span>
                 <h3 className="text-3xl font-display font-black uppercase italic tracking-tighter mb-6 leading-none">
                   {(user?.membershipExpiredAt && new Date(user.membershipExpiredAt) > new Date()) ? 'Access Active' : 
                    (user?.membershipExpiredAt && new Date(user.membershipExpiredAt) <= new Date()) ? 'Access Revoked' :
                    user?.membership === 'PENDING' ? 'Clearing...' : 'Premium Protocol'}
                 </h3>
                 <p className="text-[11px] font-medium text-white/60 uppercase tracking-[0.05em] mb-12 leading-relaxed italic">
                   {(user?.membershipExpiredAt && new Date(user.membershipExpiredAt) > new Date()) 
                     ? `Tactical access verified until ${formatDate(user.membershipExpiredAt)}. Priority command active.` 
                     : (user?.membershipExpiredAt && new Date(user.membershipExpiredAt) <= new Date())
                     ? 'Executive session expired. Intelligence access restricted. Restore immediately.'
                     : user?.membership === 'PENDING'
                     ? 'Validation parameters in progress. Internal systems checking transaction integrity.'
                     : 'Unlock elite pre-sales, zero-fee acquisition, and senior-tier priority access.'}
                 </p>
                 <button 
                   onClick={() => navigate('/membership')}
                   className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                 >
                   {(user?.membershipExpiredAt && new Date(user.membershipExpiredAt) > new Date()) ? 'Analyze Benefits' : 
                    (user?.membershipExpiredAt && new Date(user.membershipExpiredAt) <= new Date()) ? 'Restore Strategy' :
                    user?.membership === 'PENDING' ? 'View Status' : 'Request Clearance'}
                 </button>
               </div>
            </div>

            {/* ORGANIZER UPGRADE CARD */}
            {!isAdmin && !isOrganizer && (
              <div className="rounded-[3.5rem] p-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden relative group">
                 <div className="absolute top-0 right-0 p-8 transform rotate-12 opacity-5 text-indigo-600">
                    <Calendar className="w-24 h-24" />
                 </div>
                 <div className="relative z-10">
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-4 block">Merchant Expansion</span>
                    <h3 className="text-2xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4 leading-none">Become an Organizer</h3>
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-tight leading-relaxed mb-8 italic">
                      Launch your own events, verify tickets on-site, and access real-time ecosystem analytics with 90% revenue splitting.
                    </p>
                    <button 
                      onClick={() => navigate('/settings?tab=ORGANIZER')}
                      className="w-full py-5 border-2 border-indigo-600 text-indigo-600 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                    >
                      Acquire Status
                    </button>
                 </div>
              </div>
            )}
          </aside>

          {/* MAIN CONTENT (8 cols) */}
          <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-12">
             
             {/* STATS GRID */}
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {stats.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="bg-white dark:bg-slate-950 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col items-center text-center group hover:border-indigo-500/50 transition-all group hover:shadow-indigo-500/5">
                       <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner border border-slate-100 dark:border-slate-800">
                          <Icon className={`w-7 h-7 ${stat.color} group-hover:text-white transition-colors`} />
                       </div>
                       <p className="text-4xl font-display font-black text-slate-900 dark:text-white italic leading-none tracking-tighter">{stat.value}</p>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-5 italic opacity-60 leading-none">{stat.label}</p>
                    </div>
                  );
                })}
             </div>

             {/* SETTINGS MENU */}
             <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden">
                <div className="p-12 lg:p-16 pb-6 lg:pb-10 flex items-center gap-4">
                   <div className="w-2 h-10 bg-indigo-600 rounded-full"></div>
                   <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Intelligence Hub</h2>
                </div>
                
                <div className="grid sm:grid-cols-2 p-6 lg:p-10 gap-4">
                {menuItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <Link 
                      key={i} 
                      to={item.path} 
                      className="flex items-center gap-8 p-10 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all rounded-[2.5rem] group border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                    >
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner border border-slate-100 dark:border-slate-800">
                        <Icon className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white mb-2 leading-none">{item.label}</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 opacity-60 leading-none">{item.desc}</p>
                      </div>
                      <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-indigo-600 transition-all group-hover:translate-x-2" />
                    </Link>
                  );
                })}
                </div>
             </div>

             {/* RECENT ACTIVITY MOCK */}
             <div className="bg-slate-50 dark:bg-slate-950 rounded-[3.5rem] p-12 lg:p-16 border border-slate-100 dark:border-slate-800 shadow-inner">
                <div className="flex items-center justify-between mb-12">
                   <div className="flex items-center gap-4">
                      <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                      <h2 className="text-xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Strategic Milestones</h2>
                   </div>
                   <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-800">
                      <Star className="w-6 h-6 animate-pulse" />
                   </div>
                </div>
                <div className="space-y-10">
                   <div className="flex gap-8 group">
                      <div className="w-4 h-4 rounded-full border-2 border-indigo-600 bg-white dark:bg-slate-900 mt-2 flex items-center justify-center group-hover:scale-125 transition-transform">
                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                      </div>
                      <div className="flex-1 pb-10 border-b border-slate-100 dark:border-slate-900">
                         <p className="text-xs font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none mb-3">Pass Secured: Digital Frontier Summit</p>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-60">Verified 2 Nodes ago • Identification XJ992</p>
                      </div>
                   </div>
                   <div className="flex gap-8 group">
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 mt-2 flex items-center justify-center group-hover:scale-125 transition-transform">
                         <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-800"></div>
                      </div>
                      <div>
                         <p className="text-xs font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none mb-3">Tactical Shield Verified</p>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-60">Verification Cycle Alpha • System Stable</p>
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
