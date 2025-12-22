import React from 'react';
import { PageContainer } from '../components/PageContainer';

export const SuperPage: React.FC = () => {
  return (
    <PageContainer>
      <div className="rounded-3xl border-2 border-dashed border-slate-400 bg-white/80 p-8 text-center text-slate-700 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-brand-800/70 dark:text-slate-200">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">(Under Construction)</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Super tools coming soon</h1>
        <div className="mt-6 rounded-2xl border border-slate-200/80 p-5 text-left text-sm dark:border-slate-800/80">
          <p className="text-sm font-semibold text-brand-500">Coming soon</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>Super Guarantee (11.5%) checker</li>
            <li>Concessional &amp; non-concessional caps</li>
            <li>Carry-forward unused caps tracker</li>
            <li>Division 293 tax calculator</li>
          </ul>
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200/80 p-5 text-left text-sm dark:border-slate-800/80">
          <p className="text-sm font-semibold text-brand-500">ETA</p>
          <p className="mt-2">Early 2026</p>
          <p className="mt-1 text-slate-500">Thanks for your patience. We&apos;ll be live before EOFY.</p>
        </div>
        <p className="mt-6 text-sm text-slate-500">— Super Calc Team</p>
      </div>
    </PageContainer>
  );
};
