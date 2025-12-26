import React from 'react';
import { FeatureAccordion, FeatureAccordionItem } from '../components/FeatureAccordion';
import { PageContainer } from '../components/PageContainer';

const SuperComingSoonContent: React.FC = () => {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900 shadow-sm dark:border-indigo-900/30 dark:bg-indigo-950/20 dark:text-indigo-100">
        <p className="font-semibold">Super calculators are under development</p>
        <p className="mt-1 text-xs text-indigo-800 dark:text-indigo-200">
          We're aligning product assumptions, compliance reviews, and data sources before releasing the new superannuation tools.
        </p>
      </div>

      <div className="rounded-3xl border-2 border-dashed border-slate-400 bg-white/80 p-8 text-center text-slate-700 shadow-lg backdrop-blur dark:border-dark-border dark:bg-dark-surfaceAlt/80 dark:text-dark-text">
        <p className="text-sm font-semibold text-slate-500 dark:text-dark-muted">🚧 (Under Construction)</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-dark-text">🚧 Super tools coming soon</h1>
        <div className="mt-6 rounded-2xl border border-slate-200/80 p-5 text-left text-sm dark:border-dark-border">
          <p className="text-sm font-semibold text-brand-500 dark:text-brand-accentBright">🚧 Coming soon</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>Super Guarantee (11.5%) checker</li>
            <li>Concessional &amp; non-concessional caps</li>
            <li>Carry-forward unused caps tracker</li>
            <li>Division 293 tax calculator</li>
          </ul>
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200/80 p-5 text-left text-sm dark:border-dark-border">
          <p className="text-sm font-semibold text-brand-500 dark:text-brand-accentBright">ETA</p>
          <p className="mt-2">Early 2026</p>
          <p className="mt-1 text-slate-500">Thanks for your patience. We&apos;ll be live before EOFY.</p>
        </div>
        <p className="mt-6 text-sm text-slate-500 dark:text-dark-muted">— Super Calc Team</p>
      </div>
    </div>
  );
};

const items: FeatureAccordionItem[] = [
  {
    badge: 'Super',
    title: '🚧 Super tools (in development)',
    content: <SuperComingSoonContent />,
  },
];

export const SuperPage: React.FC = () => {
  return (
    <PageContainer borderColor="bg-green-500">
      <FeatureAccordion items={items} initialOpen={null} />
    </PageContainer>
  );
};
