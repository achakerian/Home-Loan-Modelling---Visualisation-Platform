import React from 'react';

export const TaxChecklistSection: React.FC = () => {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-100">
        <p className="font-semibold">Tax checklist & deductions are under development</p>
        <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
          We're reviewing ATO guidance and building comprehensive deduction categories before releasing this tool.
        </p>
      </div>

      <div className="rounded-3xl border-2 border-dashed border-slate-400 bg-white/80 p-8 text-center text-slate-700 shadow-lg backdrop-blur dark:border-dark-border dark:bg-dark-surfaceAlt/80 dark:text-dark-text">
        <p className="text-sm font-semibold text-slate-500 dark:text-dark-muted">🚧 (Under Construction)</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-dark-text">🚧 Tax tools coming soon</h1>
        <div className="mt-6 rounded-2xl border border-slate-200/80 p-5 text-left text-sm dark:border-dark-border">
          <p className="text-sm font-semibold text-brand-500 dark:text-brand-accentBright">🚧 Coming soon</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>Pre-tax return checklist</li>
            <li>Work-related deductions tracker</li>
            <li>Self-education expenses calculator</li>
            <li>Car &amp; travel claims estimator</li>
          </ul>
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200/80 p-5 text-left text-sm dark:border-dark-border">
          <p className="text-sm font-semibold text-brand-500 dark:text-brand-accentBright">ETA</p>
          <p className="mt-2">Early 2026</p>
          <p className="mt-1 text-slate-500">We'll have this ready before tax time.</p>
        </div>
        <p className="mt-6 text-sm text-slate-500 dark:text-dark-muted">— Tax Tools Team</p>
      </div>
    </div>
  );
};
