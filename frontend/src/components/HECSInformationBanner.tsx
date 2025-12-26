import React, { useState } from 'react';
import { InfoIcon } from './icons';

export const HECSInformationBanner: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/20">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/20"
      >
        <div className="flex items-center gap-2">
          <InfoIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
            HECS/HELP Information
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
        <div className="space-y-4 border-t border-blue-200 px-4 py-4 text-sm text-blue-800 dark:border-blue-900/30 dark:text-blue-200">
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
              HECS/HELP – How this calculator works
            </h4>
            <p className="mt-2">
              HECS-HELP is an Australian Government student loan that helps eligible students pay
              university fees. You don't make repayments until your repayment income exceeds the
              minimum threshold.
            </p>
            <p className="mt-2">
              This calculator estimates your compulsory HELP repayment based on your income and the
              applicable repayment rules for the selected financial year. Results are indicative
              only.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
              How HELP repayments work
            </h4>
            <ul className="mt-2 space-y-2 pl-4">
              <li className="flex gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Repayments are based on your income, not how much you owe.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>If your income is below the threshold, no repayment is required.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>
                  Repayments are assessed by the ATO when you lodge your tax return.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>
                  You can make voluntary repayments at any time to reduce your balance sooner.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>
                  HELP debts don't charge interest, but they are indexed annually to keep pace with
                  cost-of-living changes. This means your balance can increase if repayments don't
                  exceed indexation.
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
