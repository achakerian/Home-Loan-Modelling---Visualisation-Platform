import { useState } from 'react';
import RepaymentsView from '../repayments/RepaymentsView.tsx';

const MortgagePage = () => {
  const [openPanel, setOpenPanel] = useState<'repayment' | 'borrowing' | null>('repayment');

  return (
    <section className="space-y-4 pb-24">
      <article className="rounded-3xl bg-white shadow-sm">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-3xl px-4 py-3 text-left"
          onClick={() => setOpenPanel((prev) => (prev === 'repayment' ? null : 'repayment'))}
        >
          <div>
            <p className="text-xs uppercase tracking-wide text-accent">Mortgage</p>
            <h2 className="text-lg font-semibold text-secondary">Repayment Calculator</h2>
          </div>
          <span className="text-2xl text-secondary">{openPanel === 'repayment' ? '−' : '+'}</span>
        </button>
        {openPanel === 'repayment' && (
          <div className="border-t border-surface-light px-4 py-3">
            <RepaymentsView />
          </div>
        )}
      </article>

      <article className="rounded-3xl bg-white shadow-sm">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-3xl px-4 py-3 text-left"
          onClick={() => setOpenPanel((prev) => (prev === 'borrowing' ? null : 'borrowing'))}
        >
          <div>
            <p className="text-xs uppercase tracking-wide text-accent">Mortgage</p>
            <h2 className="text-lg font-semibold text-secondary">Borrowing Power</h2>
          </div>
          <span className="text-2xl text-secondary">{openPanel === 'borrowing' ? '−' : '+'}</span>
        </button>
        {openPanel === 'borrowing' && (
          <div className="border-t border-surface-light px-4 py-3 text-sm text-slate-600">
            <p className="mb-2 font-semibold text-secondary">Estimate your maximum loan with confidence.</p>
            <p>
              Input your income, ongoing expenses and interest rate buffer to see how lenders might size your borrowing limit. Advanced inputs such as DTI and
              household spending metrics are coming soon.
            </p>
          </div>
        )}
      </article>
    </section>
  );
};

export default MortgagePage;
