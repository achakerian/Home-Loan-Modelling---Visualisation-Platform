import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { TitleHeading } from '../components/TitleHeading';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 pb-20 text-slate-900 transition-colors dark:bg-dark-base dark:text-dark-text">
      <TitleHeading />
      <main>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};
