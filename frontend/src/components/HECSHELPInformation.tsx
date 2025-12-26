import React, { useState } from 'react';
import { InfoIcon } from './icons';

export const HECSHELPInformation: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6 shadow-sm dark:border-blue-900/30 dark:bg-blue-950/20">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-left transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/20"
      >
        <div className="flex items-center gap-2">
          <InfoIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
            HECS/HELP – How it works in this calculator
          </h3>
        </div>
        <svg
          className={`h-5 w-5 text-blue-600 transition-transform dark:text-blue-400 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <p>
              HECS-HELP is an Australian Government student loan that lets eligible students defer university fees. You only start repaying it once your repayment income exceeds the minimum threshold.
            </p>
            <p className="mt-2">
              This calculator estimates your compulsory HECS/HELP repayment based on your income and the rules for the selected financial year. Your actual repayment is calculated by the Australian Taxation Office when you lodge your tax return.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
              How repayments are calculated
            </h4>
            <ul className="mt-2 space-y-2 pl-4">
              <li className="flex gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Repayments are based on your income, not how much you owe</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>If your income is below the threshold, no repayment is required</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Repayments are assessed annually through the tax system</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>You can make voluntary repayments at any time, but they don't reduce the compulsory amount</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>
                  HELP debts don't charge interest, but they are indexed each year to keep pace with cost-of-living changes. Your balance can increase if repayments don't exceed indexation.
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
              Repayment rates used by this app
            </h4>

            <div className="mt-3">
              <p className="font-semibold">2025–26 (current year – marginal system)</p>
              <p className="mt-1 text-xs">You only repay on the portion of income above $67,000.</p>
              <ul className="mt-2 space-y-1 pl-4 font-mono text-xs">
                <li>$0 – $67,000 → <span className="font-semibold">0%</span></li>
                <li>$67,001 – $125,000 → <span className="font-semibold">15% of income above $67,000</span></li>
                <li>$125,001 – $179,285 → <span className="font-semibold">$8,700 + 17% above $125,000</span></li>
                <li>$179,286+ → <span className="font-semibold">10% of total income (cap)</span></li>
              </ul>
              <p className="mt-2 text-xs italic">
                Example: Income of $70,000 → 15% of $3,000 = <span className="font-semibold">$450</span>
              </p>
            </div>

            <div className="mt-3">
              <p className="font-semibold">2024–25 (previous year – whole-income system)</p>
              <p className="mt-1 text-xs">Once the threshold was reached, the rate applied to your entire income.</p>
              <ul className="mt-2 space-y-1 pl-4 font-mono text-xs">
                <li>Below $54,435 → <span className="font-semibold">0%</span></li>
                <li>$54,435 – $62,850 → <span className="font-semibold">1%</span></li>
                <li>$62,851 – $66,620 → <span className="font-semibold">2%</span></li>
                <li>$66,621 – $70,618 → <span className="font-semibold">2.5%</span></li>
                <li>$70,619 – $74,855 → <span className="font-semibold">3%</span></li>
                <li className="italic">(rates increased gradually)</li>
                <li>$159,664+ → <span className="font-semibold">10%</span></li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
              How the app uses this
            </h4>
            <ul className="mt-2 space-y-2 pl-4">
              <li className="flex gap-2">
                <span className="text-blue-600 dark:text-blue-400">✓</span>
                <span>Applies the correct year's thresholds and percentages</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 dark:text-blue-400">✓</span>
                <span>Uses the marginal system for 2025–26</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 dark:text-blue-400">✓</span>
                <span>Uses the whole-income system for 2024–25</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 dark:text-blue-400">✓</span>
                <span>Estimates repayments only — final amounts are set at tax time</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
