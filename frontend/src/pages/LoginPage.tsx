import React from 'react';

export const LoginPage: React.FC = () => {
  return (
    <div className="px-6 pb-32 pt-6">
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-slate-700 shadow-inner backdrop-blur dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
          Under construction
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
          Sign-in hub coming soon
        </h1>
        <p className="mt-4 text-sm">
          We’re exploring best-practice cyber security patterns, progressive authentication, and implementation partners to keep your data safe.
        </p>
        <div className="mt-6 grid gap-4 text-left sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800/80">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
              Research focus
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
              <li>Modern passwordless experiences</li>
              <li>Risk-based MFA support</li>
              <li>Audit-friendly user management</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800/80">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
              Implementation next</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
              <li>Vendor selection for secure auth</li>
              <li>Compliance + penetration testing</li>
              <li>User data privacy review</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
