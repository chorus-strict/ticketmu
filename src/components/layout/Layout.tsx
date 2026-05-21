import React from 'react';
import Navbar from './Navbar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen selection:bg-indigo-500/30 transition-colors duration-300">
      <Navbar />
      <main className="lg:pt-20 pt-16 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8 min-h-screen">
        <div className="max-w-[1440px] mx-auto min-h-[calc(100vh-5rem)]">
          {children}
        </div>
      </main>
    </div>
  );
}
