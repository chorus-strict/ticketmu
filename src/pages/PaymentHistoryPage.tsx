import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Layout from '../components/layout/Layout';
import PaymentHistory from '../components/settings/PaymentHistory';

export default function PaymentHistoryPage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <button 
            onClick={() => navigate(-1)}
            className="group flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-indigo-600 transition-colors mb-6"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 group-hover:text-indigo-600 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Settings
          </button>
          
          <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none mb-4">
            Security & <span className="text-indigo-600">Transactions</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-xl">
            Monitor all your purchases and payment status in real-time. Transparent tracking for your peace of mind.
          </p>
        </div>

        <PaymentHistory />
      </main>
    </Layout>
  );
}
