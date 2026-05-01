import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Check } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export default function ConnectedAccountsPage() {
  const navigate = useNavigate();
  const { t } = useSettings();

  const [connected, setConnected] = useState({
    google: true,
    apple: false
  });

  const providers = [
    { 
      id: 'google', 
      name: 'Google', 
      icon: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png', 
      email: 'sarah.w@gmail.com' 
    },
    { 
      id: 'apple', 
      name: 'Apple', 
      icon: 'https://cdn-icons-png.flaticon.com/512/0/747.png' 
    }
  ];

  const handleToggle = (id: string) => {
    setConnected(prev => ({ ...prev, [id]: !prev[id as keyof typeof prev] }));
  };

  return (
    <div className="bg-surface dark:bg-dark-surface min-h-screen pb-10 transition-colors duration-300">
      <header className="nav-blur sticky top-0 z-50 h-16 flex items-center px-5 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-900 dark:text-white" />
        </button>
        <h1 className="ml-4 text-lg font-display font-bold text-slate-900 dark:text-white uppercase">{t('account.connected_accounts')}</h1>
      </header>

      <main className="max-w-lg mx-auto p-5 space-y-6">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
          <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium leading-relaxed">
            Connect your social accounts to sign in faster and keep your event bookings synced across devices.
          </p>
        </div>

        <div className="premium-card overflow-hidden bg-white dark:bg-slate-800/50">
          {providers.map((provider, i) => (
            <div 
              key={provider.id}
              className={`p-5 flex items-center justify-between ${i < providers.length - 1 ? 'border-b border-slate-100 dark:border-slate-700/50' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-2.5 border border-slate-100 dark:border-slate-800">
                  <img src={provider.icon} alt={provider.name} className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{provider.name}</h3>
                  {connected[provider.id as keyof typeof connected] ? (
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{provider.email || 'Connected'}</p>
                  ) : (
                    <p className="text-xs font-semibold text-slate-400 font-medium">Not connected</p>
                  )}
                </div>
              </div>

              <button 
                onClick={() => handleToggle(provider.id)}
                className={`px-6 py-2 rounded-xl font-bold text-xs transition-all ${
                  connected[provider.id as keyof typeof connected]
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 transition-colors'
                    : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95'
                }`}
              >
                {connected[provider.id as keyof typeof connected] ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 p-2">
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
          <p className="text-xs font-semibold text-slate-500">Your accounts are secured with encrypted tokens.</p>
        </div>
      </main>
    </div>
  );
}
