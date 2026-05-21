import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Bell, 
  CreditCard, 
  Languages, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Mail,
  Moon,
  MessageCircle,
  Info,
  Check,
  Zap,
  Link as LinkIcon,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import Layout from '../components/layout/Layout';
import { SUPPORT_WHATSAPP_NUMBER, SUPPORT_MESSAGE } from '../constants';

import { useSearchParams } from 'react-router-dom';
import OrganizerUpgrade from '../components/profile/OrganizerUpgrade';
import { AnimatePresence, motion } from 'motion/react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { logout, user } = useAuth();
  const { theme, toggleTheme, language, setLanguage, t } = useSettings();
  
  const showUpgrade = searchParams.get('tab') === 'ORGANIZER' && user?.role !== 'ADMIN' && user?.role !== 'ORGANIZER';

  const [showLangModal, setShowLangModal] = useState(false);
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    reminders: true
  });

  const sections = [
    {
      id: 'ACCOUNT',
      title: t('settings.account'),
      items: [
        { label: t('account.edit_profile'), icon: <User className="w-5 h-5" />, value: user?.name, onClick: () => navigate('/edit-profile') },
        { label: t('account.change_password'), icon: <Lock className="w-5 h-5" />, onClick: () => navigate('/change-password') },
        { label: t('account.connected_accounts'), icon: <LinkIcon className="w-5 h-5" />, onClick: () => navigate('/connected-accounts') },
      ]
    },
    ...(user?.role === 'ADMIN' ? [{
      id: 'ADMIN',
      title: 'Administrator',
      items: [
        { label: 'Admin Dashboard', icon: <LayoutDashboard className="w-5 h-5 text-rose-500" />, onClick: () => navigate('/dashboard') },
        { label: 'Manage All Events', icon: <Info className="w-5 h-5 text-rose-500" />, onClick: () => navigate('/dashboard') },
        { label: 'System Logs', icon: <ShieldCheck className="w-5 h-5 text-rose-500" />, onClick: () => {} },
      ]
    }] : []),
    ...(user?.role === 'ORGANIZER' ? [{
      id: 'ORGANIZER',
      title: 'Merchant Center',
      items: [
        { label: 'Partner Dashboard', icon: <LayoutDashboard className="w-5 h-5 text-indigo-500" />, onClick: () => navigate('/dashboard') },
        { label: 'My Events', icon: <Info className="w-5 h-5 text-indigo-500" />, onClick: () => navigate('/dashboard?tab=EVENTS') },
      ]
    }] : []),
    {
      id: 'SECURITY',
      title: t('settings.security'),
      items: [
        { label: 'Tiketmu Membership', icon: <Zap className="w-5 h-5 text-amber-500" />, value: user?.membership === 'PREMIUM' ? 'Elite Member' : 'Standard Plan', onClick: () => navigate('/membership') },
        { label: '2FA Authentication', icon: <ShieldCheck className="w-5 h-5" />, component: (
          <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full relative cursor-pointer">
            <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-all"></div>
          </div>
        )},
        { label: 'Session Management', icon: <Smartphone className="w-5 h-5" />, onClick: () => {} },
        { label: 'Logout from all devices', icon: <LogOut className="w-5 h-5 text-red-500" />, onClick: () => {} },
      ]
    },
    {
      id: 'NOTIFICATIONS',
      title: t('settings.notifications'),
      items: [
        { 
          label: 'Push Notifications', 
          icon: <Smartphone className="w-5 h-5" />, 
          component: (
            <button onClick={() => setNotifications(prev => ({ ...prev, push: !prev.push }))} className={`w-10 h-5 rounded-full relative transition-colors ${notifications.push ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${notifications.push ? 'right-1' : 'left-1'}`}></div>
            </button>
          )
        },
        { 
          label: 'Email Notifications', 
          icon: <Mail className="w-5 h-5" />, 
          component: (
            <button onClick={() => setNotifications(prev => ({ ...prev, email: !prev.email }))} className={`w-10 h-5 rounded-full relative transition-colors ${notifications.email ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${notifications.email ? 'right-1' : 'left-1'}`}></div>
            </button>
          )
        },
        { 
          label: 'Event Reminders', 
          icon: <Bell className="w-5 h-5" />, 
          component: (
            <button onClick={() => setNotifications(prev => ({ ...prev, reminders: !prev.reminders }))} className={`w-10 h-5 rounded-full relative transition-colors ${notifications.reminders ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${notifications.reminders ? 'right-1' : 'left-1'}`}></div>
            </button>
          )
        },
      ]
    },
    {
      id: 'PAYMENT',
      title: t('settings.payment'),
      items: [
        { label: 'Saved Cards', icon: <CreditCard className="w-5 h-5" />, onClick: () => {} },
        { label: 'Payment History', icon: <Info className="w-5 h-5" />, onClick: () => navigate('/payment-history') },
      ]
    },
    {
      id: 'APP',
      title: t('settings.app'),
      items: [
        { 
          label: t('settings.dark_mode'), 
          icon: <Moon className="w-5 h-5" />, 
          component: (
            <button 
              onClick={toggleTheme} 
              className={`w-11 h-6 rounded-full relative transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </button>
          )
        },
        { 
          label: t('settings.language'), 
          icon: <Languages className="w-5 h-5" />, 
          value: language === 'en' ? 'English (US)' : 'Bahasa Indonesia', 
          onClick: () => setShowLangModal(true) 
        },
      ]
    },
    {
      id: 'SUPPORT',
      title: t('settings.support'),
      items: [
        { label: 'Help Center', icon: <HelpCircle className="w-5 h-5" />, onClick: () => {} },
        { 
          label: 'Contact Support', 
          icon: <MessageCircle className="w-5 h-5" />, 
          onClick: () => {
            const url = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(SUPPORT_MESSAGE)}`;
            window.open(url, '_blank', 'noopener,noreferrer');
          } 
        },
      ]
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-10">
        <div className="flex flex-col gap-12">
          
          <section>
            <h1 className="text-4xl font-display font-extrabold text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4">{t('settings.title')}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Personalize your experience and security settings</p>
          </section>

          <div className="grid lg:grid-cols-2 gap-8">
            {sections.map((section) => (
              <div key={section.id} className="space-y-4">
                <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] ml-2 flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                   {section.title}
                </h2>
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-2 transition-colors duration-300">
                  {section.items.map((item, i) => (
                    <div 
                      key={i} 
                      onClick={item.onClick}
                      className={`flex items-center justify-between p-6 rounded-[2rem] transition-all group ${item.onClick ? 'hover:bg-indigo-50 dark:hover:bg-indigo-900/10 cursor-pointer m-1' : 'm-1'} `}
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-white dark:group-hover:bg-slate-700 transition-all shadow-sm">
                          {item.icon}
                        </div>
                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {item.value && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.value}</span>}
                        {item.component ? item.component : <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={handleLogout}
              className="w-full sm:max-w-xs py-5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold uppercase tracking-[0.2em] shadow-xl shadow-rose-500/20 active:scale-95 transition-all text-[10px] group flex items-center justify-center gap-3"
            >
              <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>{t('profile.logout')}</span>
            </button>
            <p className="mt-8 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center sm:text-left">
              App Release 2.4.0 • Enterprise Core • Tiketmu Digital Ecosystem
            </p>
          </div>
        </div>
      </main>

      {showUpgrade && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
             onClick={() => setSearchParams({})}
           />
           <motion.div 
             initial={{ scale: 0.95, opacity: 0, y: 30 }}
             animate={{ scale: 1, opacity: 1, y: 0 }}
             exit={{ scale: 0.95, opacity: 0, y: 30 }}
             className="relative w-full max-w-5xl"
           >
             <OrganizerUpgrade onClose={() => setSearchParams({})} />
           </motion.div>
        </div>
      )}

      {/* Language Modal */}
      {showLangModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 md:p-5">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowLangModal(false)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Select Language</h3>
            </div>
            <div className="p-3">
              {[
                { id: 'en', label: 'English (US)', flag: '🇺🇸' },
                { id: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' }
              ].map((lang) => (
                <button 
                  key={lang.id}
                  onClick={() => { setLanguage(lang.id as any); setShowLangModal(false); }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${language === lang.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{lang.flag}</span>
                    <span className={`text-sm font-bold ${language === lang.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {lang.label}
                    </span>
                  </div>
                  {language === lang.id && <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                </button>
              ))}
            </div>
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50">
              <button 
                onClick={() => setShowLangModal(false)}
                className="w-full py-3.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl active:scale-95 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
