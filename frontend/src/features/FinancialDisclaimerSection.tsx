import React from 'react';

export const FinancialDisclaimerSection: React.FC = () => {
  return (
    <div className="space-y-4 py-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-xs text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-200">
        <h3 className="mb-3 text-sm font-semibold">Financial Disclaimer</h3>

        <div className="space-y-2">
          <p>
            The information and calculators provided on this website are for{' '}
            <strong>general information and educational purposes only</strong>. They do not constitute{' '}
            <strong>financial, legal, tax, or investment advice</strong> and should not be relied upon as such.
          </p>

          <p>
            <strong>Calculations, projections, and results are estimates only</strong> and are based on the
            information you provide, together with assumptions that may not reflect your personal
            circumstances. Actual outcomes may differ materially due to changes in{' '}
            <strong>market conditions, legislation, interest rates, fees, taxes, or other factors</strong>.
          </p>

          <p>
            This website does not take into account your{' '}
            <strong>objectives, financial situation, or needs</strong>. Before making any financial decision, you
            should consider the appropriateness of the information in light of your own circumstances
            and, where necessary, seek advice from a{' '}
            <strong>licensed Australian financial adviser, accountant, or tax professional</strong>.
          </p>

          <p>
            <strong>While reasonable care has been taken</strong> to ensure the accuracy of the information, no
            guarantee is given as to its completeness, reliability, or currency. To the extent
            permitted by law, the website operator <strong>disclaims all liability</strong> for any loss or damage
            arising from reliance on the information or calculations provided.
          </p>
        </div>
      </div>
    </div>
  );
};
