import { useState, useEffect } from 'react';
import { 
  Building2,
  BarChart3, 
  Users,
  Package,
  Ticket as TicketIcon,
  QrCode,
  Bell,
  ArrowRight,
  TrendingUp,
  LayoutDashboard,
  Crown,
  Settings2,
  Coins
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Overview from '../components/admin/Overview';
import UserManagement from '../components/admin/UserManagement';
import EventManagement from '../components/admin/EventManagement';
import TicketValidation from '../components/admin/TicketValidation';
import TicketManagement from '../components/admin/TicketManagement';
import PaymentManagement from '../components/admin/PaymentManagement';
import MembershipManagement from '../components/admin/MembershipManagement';
import OrganizerRequestManagement from '../components/admin/OrganizerRequestManagement';
import PaymentSettings from '../components/admin/PaymentSettings';
import RewardsManagement from '../components/admin/RewardsManagement';
import { motion, AnimatePresence } from 'motion/react';
import Layout from '../components/layout/Layout';

type AdminTab = 'OVERVIEW' | 'USERS' | 'EVENTS' | 'TICKETS' | 'VALIDATE' | 'PAYMENTS' | 'MEMBERSHIP' | 'ORGANIZERS' | 'SETTINGS' | 'REWARDS';

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');

  const allTabs = [
    { id: 'OVERVIEW', label: 'Analytics', icon: BarChart3, desc: 'Real-time performance', roles: ['ADMIN', 'ORGANIZER'] },
    { id: 'USERS', label: 'Audience', icon: Users, desc: 'User demographics', roles: ['ADMIN'] },
    { id: 'EVENTS', label: 'Inventory', icon: Package, desc: 'Event management', roles: ['ADMIN', 'ORGANIZER'] },
    { id: 'PAYMENTS', label: 'Orders', icon: BarChart3, desc: 'Payment verification', roles: ['ADMIN', 'ORGANIZER'] },
    { id: 'ORGANIZERS', label: 'Merchants', icon: Building2, desc: 'Organizer requests', roles: ['ADMIN'] },
    { id: 'MEMBERSHIP', label: 'Membership', icon: Crown, desc: 'Premium requests', roles: ['ADMIN'] },
    { id: 'TICKETS', label: 'Passes', icon: TicketIcon, desc: 'Ticket management', roles: ['ADMIN', 'ORGANIZER'] },
    { id: 'REWARDS', label: 'Rewards', icon: Coins, desc: 'Loyalty system logic', roles: ['ADMIN'] },
    { id: 'SETTINGS', label: 'Finance', icon: Settings2, desc: 'Payment nodes', roles: ['ADMIN'] },
    { id: 'VALIDATE', label: 'Validator', icon: QrCode, desc: 'Ticket scanner', roles: ['ADMIN', 'ORGANIZER'] }
  ];

  const tabs = allTabs.filter(tab => user && tab.roles.includes(user.role));

  useEffect(() => {
    const tabParam = searchParams.get('tab') as AdminTab;
    if (tabParam && tabs.some(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    } else if (tabs.length > 0 && (!tabParam || !tabs.some(t => t.id === activeTab))) {
      setActiveTab(tabs[0].id as AdminTab);
    }
  }, [searchParams, user]);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <Layout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-10">
        
        {/* DASHBOARD HEADER */}
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-600/30">
                 <LayoutDashboard className="w-8 h-8 text-white" />
              </div>
              <div>
                 <h1 className="text-4xl font-display font-extrabold text-slate-900 dark:text-white uppercase italic tracking-tighter">Partner Portal</h1>
                 <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Operational • Live Data</span>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col text-right mr-4">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Signed in as</span>
                 <span className="text-xs font-black text-slate-900 dark:text-white uppercase italic">{user?.name}</span>
              </div>
              <button className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm relative group transition-all hover:border-indigo-600">
                 <Bell className="w-5 h-5 text-slate-500 group-hover:text-indigo-600" />
                 <div className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></div>
              </button>
           </div>
        </section>

        <div className="grid lg:grid-cols-12 gap-10">
          
          {/* Sub-Navigation (Sidebar on desktop) */}
          <aside className="lg:col-span-3 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as AdminTab)}
                  className={`w-full group flex items-center p-4 rounded-3xl transition-all duration-300 border ${
                    isActive 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20 translate-x-1' 
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-indigo-300 dark:hover:border-indigo-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mr-4 transition-colors ${
                    isActive ? 'bg-white/20' : 'bg-slate-50 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30'
                  }`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                  </div>
                  <div className="text-left flex-1">
                    <p className={`text-[11px] font-black uppercase tracking-widest leading-none mb-1 ${isActive ? 'text-white' : 'text-slate-900 dark:text-slate-200 group-hover:text-indigo-600'}`}>
                      {tab.label}
                    </p>
                    <p className={`text-[9px] font-bold uppercase tracking-widest opacity-60 ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                      {tab.desc}
                    </p>
                  </div>
                  {isActive && <motion.div layoutId="arrow" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}><ArrowRight className="w-4 h-4 text-white" /></motion.div>}
                </button>
              );
            })}

            <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
               <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Growth Boost</span>
               </div>
               <p className="text-[9px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest mb-4">Your ticket retention is up 12% this month.</p>
               <button className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors">
                  View Insights
               </button>
            </div>
          </aside>

          {/* DASHBOARD CONTENT (9 cols) */}
          <div className="lg:col-span-9 animate-in fade-in slide-in-from-right-4 duration-700">
             <div className="min-h-[600px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                     {activeTab === 'OVERVIEW' && <Overview />}
                     {activeTab === 'USERS' && <UserManagement />}
                     {activeTab === 'EVENTS' && <EventManagement />}
                     {activeTab === 'PAYMENTS' && <PaymentManagement />}
                     {activeTab === 'MEMBERSHIP' && <MembershipManagement />}
                     {activeTab === 'ORGANIZERS' && <OrganizerRequestManagement />}
                     {activeTab === 'TICKETS' && <TicketManagement />}
                     {activeTab === 'REWARDS' && <RewardsManagement />}
                     {activeTab === 'SETTINGS' && <PaymentSettings />}
                     {activeTab === 'VALIDATE' && <TicketValidation />}
                  </motion.div>
                </AnimatePresence>
             </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
