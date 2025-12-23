import React from 'react';
import { CollapsibleContainer } from '../components/CollapsibleContainer';
import { BorrowingPowerCard } from './BorrowingPowerCard';

const BorrowingPowerArticle: React.FC = () => (
  <div className="space-y-4 text-sm text-slate-600 dark:text-dark-muted">
    <p>
      This guide shares the simplified approach behind our calculator. We take your household income, apply
      a conservative shading factor, subtract a floor for living expenses, then test repayments at a buffered
      interest rate that sits above today&apos;s market.
    </p>
    <ul className="list-disc space-y-1 pl-5 text-xs text-slate-500 dark:text-dark-muted">
      <li>
        Income is shaded (usually 70-90%) to factor in variability and overtime risk.
      </li>
      <li>
        We floor expenses at a minimum benchmark, even if you enter a lower number.
      </li>
      <li>
        Credit cards and other loans consume capacity using standard assessment repayments.
      </li>
      <li>
        Assessment rate = base rate + buffer (default 3%).
      </li>
      <li>
        Deposit percentage translates borrowing power into indicative purchase price.
      </li>
    </ul>
    <p>
      Actual lender assessments will include more detailed policy checks, but this framework mirrors the
      main inputs brokers review when providing guidance.
    </p>
  </div>
);

export const BorrowingPowerSection: React.FC = () => (
  <div className="space-y-5">
    <CollapsibleContainer title="Simple Calculator" collapsible defaultOpen>
      <BorrowingPowerCard />
    </CollapsibleContainer>
    <CollapsibleContainer title="How we calculate it" collapsible defaultOpen={false}>
      <BorrowingPowerArticle />
    </CollapsibleContainer>
  </div>
);
