import React from 'react';
import Navbar from './Navbar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface dark:bg-dark-surface min-h-screen transition-colors duration-300">
      <Navbar />
      <div className="lg:pt-20 pt-16 pb-32 lg:pb-12">
        {children}
      </div>
    </div>
  );
}
