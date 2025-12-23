import React from 'react';
import { PageContainer } from '../components/PageContainer';

export const PayTaxPage: React.FC = () => {
  return (
    <PageContainer>
      <div className="rounded-3xl border-2 border-dashed border-slate-400 bg-white/80 p-8 text-center text-slate-700 shadow-lg backdrop-blur dark:border-dark-border dark:bg-dark-surfaceAlt/80 dark:text-dark-text">
        <p className="text-sm font-semibold text-slate-500 dark:text-dark-muted">
          Under Construction – Sorry, we’re still untangling the tax office’s red tape
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
          Pay &amp; Tax hub coming soon-ish
        </h1>
        <div className="mt-6 grid gap-4 text-left text-sm sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-dark-border">
            <p className="text-sm font-semibold text-brand-500 dark:text-brand-accentBright">What’s cooking</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>
                <strong>Payroll system:</strong> trying to teach it that overtime isn’t a myth
              </li>
              <li>
                <strong>Tax withholding calculator:</strong> currently thinks everyone’s a tradie with 17 ABNs
              </li>
              <li>
                <strong>Payslips &amp; summaries:</strong> redesigning them to be less cryptic, more human
              </li>
              <li>
                <strong>End-of-year bits:</strong> payment summaries, tax returns… once the printer stops striking
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-dark-border">
            <p className="text-sm font-semibold text-brand-500 dark:text-brand-accentBright">ETA &amp; vibes</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>
                <strong>ETA:</strong> “Sometime before EOFY 2026… we hope”
              </li>
              <li>
                Loading spinner doing its best
              </li>
              <li>
                Accountants quietly weeping into their flat whites
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-6 text-sm text-slate-500 dark:text-dark-muted">
          Thanks for not smashing your phone yet.<br />— The Pay &amp; Tax Crew (currently hiding from the ATO)
        </p>
      </div>
    </PageContainer>
  );
};
