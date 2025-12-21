import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { TitleHeading } from '../components/TitleHeading';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-900 transition-colors dark:bg-brand-950 dark:text-slate-50">
      <div className="mx-auto max-w-screen-sm">
        <TitleHeading />
        <main>
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
};
