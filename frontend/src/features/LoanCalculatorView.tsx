import React from 'react';
import { BalanceChart } from '../graphs/RepaymentCharts';
import { CollapsibleContainer } from '../components/CollapsibleContainer';
import { ToggleGroup, ToggleOption } from '../components/ToggleGroup';
import { NumberInput, PercentInput } from '../components/inputs';
import { PeriodRow } from 'calc-engine';
import { formatCurrency, toNumberOrZero, stripLeadingZeros } from '../lib/formatters';

export type RepaymentFrequency = 'weekly' | 'fortnightly' | 'monthly';
export type AdditionalRepaymentFrequency = RepaymentFrequency | 'oneOff' | 'customMonths';
export type BreakdownView = 'monthly' | 'yearly';
type RepaymentType = 'principal' | 'interestOnly';

export interface RatePaymentSummary {
  id: string;
  label: string;
  startMonth: number;
  payment: number;
  rate: number;
}

export interface AdditionalRepayment {
  id: string;
  frequency: AdditionalRepaymentFrequency;
  startMonth: number;
  endMonth: number;
  amount: number;
  intervalMonths?: number;
}

export interface RateChange {
  id: string;
  startMonth: number;
  newRate: number;
}

const frequencies: { id: RepaymentFrequency; label: string; short: string }[] = [
  { id: 'weekly', label: 'Weekly', short: 'wk' },
  { id: 'fortnightly', label: 'Fortnightly', short: 'ftn' },
  { id: 'monthly', label: 'Monthly', short: 'mth' },
];

const frequencyOptions = frequencies.map(({ id, label }) => ({ value: id, label }));
const repaymentTypeOptions = [
  { value: 'principal' as const, label: 'Principal & Interest' },
  { value: 'interestOnly' as const, label: 'Interest Only' },
];

const additionalFrequencyOptions: { id: AdditionalRepaymentFrequency; label: string }[] = [
  ...frequencies.map(({ id, label }) => ({ id, label })),
  { id: 'oneOff', label: 'One off' },
  { id: 'customMonths', label: 'Custom (months)' },
];

interface LoanCalculatorViewProps {
  loanAmount: number;
  frequency: RepaymentFrequency;
  interestRate: number;
  termYears: number;
  repaymentType: RepaymentType;
  breakdownView: BreakdownView;
  repaymentPerPeriod: number;
  schedule: PeriodRow[];
  onLoanAmountChange: (value: number) => void;
  onFrequencyChange: (value: RepaymentFrequency) => void;
  onInterestRateChange: (value: number) => void;
  onTermYearsChange: (value: number) => void;
  onRepaymentTypeChange: (value: RepaymentType) => void;
  onBreakdownViewChange: (value: BreakdownView) => void;
  additionalRepayments: AdditionalRepayment[];
  onAddAdditional: () => void;
  onUpdateAdditional: (id: string, update: Partial<AdditionalRepayment>) => void;
  onRemoveAdditional: (id: string) => void;
  rateChanges: RateChange[];
  onAddRateChange: () => void;
  onUpdateRateChange: (id: string, update: Partial<RateChange>) => void;
  onRemoveRateChange: (id: string) => void;
  ratePaymentSummaries: RatePaymentSummary[];
  originalCompletionDateLabel: string;
  updatedCompletionDateLabel: string;
}

export const LoanCalculatorView: React.FC<LoanCalculatorViewProps> = ({
  loanAmount,
  frequency,
  interestRate,
  termYears,
  repaymentType,
  breakdownView,
  repaymentPerPeriod,
  schedule,
  onLoanAmountChange,
  onFrequencyChange,
  onInterestRateChange,
  onTermYearsChange,
  onRepaymentTypeChange,
  onBreakdownViewChange,
  additionalRepayments,
  onAddAdditional,
  onUpdateAdditional,
  onRemoveAdditional,
  rateChanges,
  onAddRateChange,
  onUpdateRateChange,
  onRemoveRateChange,
  ratePaymentSummaries,
  originalCompletionDateLabel,
  updatedCompletionDateLabel,
}) => {
  const shortLabel = frequencies.find((option) => option.id === frequency)?.short ?? 'wk';

  const repaymentTypeOptions: ToggleOption<RepaymentType>[] = [
    { value: 'principal', label: 'Principle & Interest' },
    { value: 'interestOnly', label: 'Interest Only' },
  ];

  const frequencyOptions: ToggleOption<RepaymentFrequency>[] = frequencies.map((f) => ({
    value: f.id,
    label: f.label,
  }));

  const breakdownViewOptions: ToggleOption<BreakdownView>[] = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  const monthlyRows = React.useMemo(() => {
    return schedule.map((row) => {
      const repayment = row.interestCharged + row.principalPaid;
      const principalPct = repayment ? (row.principalPaid / repayment) * 100 : 0;
      const interestPct = repayment ? (row.interestCharged / repayment) * 100 : 0;
      const date = new Date(row.date);
      const monthLabel = date.toLocaleString('en-AU', { month: 'short' });
      const yearLabel = date.getFullYear();
      return {
        label: `${monthLabel} ${yearLabel}`,
        monthLabel,
        yearLabel,
        principal: row.principalPaid,
        interest: row.interestCharged,
        principalPct,
        interestPct,
        balance: row.closingBalance,
      };
    });
  }, [schedule]);

  const yearlyRows = React.useMemo(() => {
    const map = new Map<number, { principal: number; interest: number; balance: number }>();
    schedule.forEach((row) => {
      const year = new Date(row.date).getFullYear();
      const entry = map.get(year) ?? { principal: 0, interest: 0, balance: row.closingBalance };
      entry.principal += row.principalPaid;
      entry.interest += row.interestCharged;
      entry.balance = row.closingBalance;
      map.set(year, entry);
    });
    return Array.from(map.entries()).map(([year, entry]) => {
      const repayment = entry.principal + entry.interest;
      return {
        label: `${year}`,
        monthLabel: `${year}`,
        yearLabel: year,
        principal: entry.principal,
        interest: entry.interest,
        principalPct: repayment ? (entry.principal / repayment) * 100 : 0,
        interestPct: repayment ? (entry.interest / repayment) * 100 : 0,
        balance: entry.balance,
      };
    });
  }, [schedule]);

  const breakdownRows = breakdownView === 'monthly' ? monthlyRows : yearlyRows;

  return (
    <>
      <CollapsibleContainer title="Original Loan Details">
        <div className="flex justify-between text-sm font-semibold text-slate-500">
          <span className="w-1/2 text-center">Loan amount</span>
          <span className="w-1/2 text-center">Repayment</span>
        </div>
        <div className="flex items-center justify-between px-1 py-0">
          <div className="flex w-1/2 justify-center">
            <div className="inline-flex rounded-2xl border border-slate-300 px-3 py-2 text-base font-semibold dark:border-slate-600">
              <input
                type="text"
                value={formatCurrency(loanAmount)}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/[^0-9]/g, '');
                  const normalized = stripLeadingZeros(digitsOnly);
                  onLoanAmountChange(normalized === '' ? 0 : Number(normalized));
                }}
                className="w-full bg-transparent text-slate-900 focus:outline-none dark:text-white"
                aria-label="Loan amount"
              />
            </div>
          </div>
          <div className="w-1/2 text-center text-base font-semibold text-slate-900 dark:text-white">
            {formatCurrency(Math.round(repaymentPerPeriod))}
            <span className="ml-1 text-sm font-medium text-slate-500 dark:text-slate-400">/{shortLabel}</span>
          </div>
        </div>
        <div className="mt-4 space-y-2 text-center">
          <ToggleGroup
            options={repaymentTypeOptions}
            value={repaymentType}
            onChange={onRepaymentTypeChange}
          />
          <ToggleGroup
            label="Repayment frequency"
            options={frequencyOptions}
            value={frequency}
            onChange={onFrequencyChange}
            size="md"
          />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <PercentInput
              label="Interest rate %"
              value={interestRate}
              onChange={onInterestRateChange}
              asPercentage
              step={0.05}
            />
            <NumberInput
              label="Term (years)"
              value={termYears}
              onChange={onTermYearsChange}
            />
          </div>
        </div>
      </CollapsibleContainer>

      <div className="mt-6">
        <CollapsibleContainer
          title="Loan Balance Over Time"
          padded={false}
          collapsible
          defaultOpen={false}
          accent="blue"
        >
          <p className="text-xs text-slate-500">
            Hover over the graph to see the breakdown between principle vs interest for each month of the loan.
          </p>
          <BalanceChart schedule={schedule} height={300} />
        </CollapsibleContainer>
      </div>

      <div className="mt-6">
        <CollapsibleContainer
          title="Detailed Repayment Breakdown"
          collapsible
          defaultOpen={false}
          padded={false}
          accent="blue"
        >
          <ToggleGroup
            options={breakdownViewOptions}
            value={breakdownView}
            onChange={onBreakdownViewChange}
          />
          <div className="max-h-[360px] overflow-y-auto">
            <table className="mt-3 w-full table-fixed text-left text-xs text-slate-600 dark:text-slate-200">
              <thead>
                <tr className="text-slate-400">
                  <th className="pb-2 pr-3">{breakdownView === 'monthly' ? 'Month' : 'Year'}</th>
                  <th className="pb-2 pl-4">Principle</th>
                  <th className="pb-2 pl-4">Interest</th>
                  <th className="pb-2 text-right">Loan remaining</th>
                </tr>
              </thead>
              <tbody>
                {breakdownRows.map((row, index) => (
                  <tr key={`${row.label}-${index}`} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-2 pr-3 font-semibold">
                      {breakdownView === 'monthly' ? (
                        <>
                          <div>{row.monthLabel}</div>
                          <div className="text-[11px] text-slate-400">{row.yearLabel}</div>
                        </>
                      ) : (
                        <div>{row.label}</div>
                      )}
                    </td>
                    <td className="py-2 pl-4">
                      {formatCurrency(row.principal)}
                      <div className="text-[10px] text-slate-400">{row.principalPct?.toFixed(0)}%</div>
                    </td>
                    <td className="py-2 pl-4">
                      {formatCurrency(row.interest)}
                      <div className="text-[10px] text-slate-400">{row.interestPct?.toFixed(0)}%</div>
                    </td>
                    <td className="py-2 text-right">{formatCurrency(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleContainer>
      </div>

      <div className="mt-6">
        <CollapsibleContainer
          title="Repayments or Rate Change"
          collapsible
          defaultOpen={false}
          accent="blue"
          padded={false}
        >
          <div className="flex items-center justify-between text-sm font-semibold text-slate-600 pl-1">
            <span>Additional repayments</span>
            <button
              type="button"
              onClick={onAddAdditional}
              className="rounded-full border border-brand-500 px-3 py-1 text-xs font-semibold text-brand-500"
            >
              Add
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {additionalRepayments.length === 0 && (
              <p className="pl-3 text-xs text-slate-500 dark:text-slate-300">
                No additional repayments configured.
              </p>
            )}
            {additionalRepayments.map((entry) => {
              return (
                <div key={entry.id} className="rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700">
                  <div className="mb-2 flex items-center justify-between font-semibold text-slate-600">
                    <span>Repayment frequency</span>
                    <button
                      type="button"
                      onClick={() => onRemoveAdditional(entry.id)}
                      className="text-brand-500"
                    >
                      Remove
                    </button>
                  </div>
                  <select
                    className="mb-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none dark:border-slate-600 dark:bg-transparent dark:text-white"
                    value={entry.frequency}
                    onChange={(e) =>
                      onUpdateAdditional(entry.id, {
                        frequency: e.target.value as AdditionalRepaymentFrequency,
                      })
                    }
                  >
                    {additionalFrequencyOptions.map((freq) => (
                      <option key={freq.id} value={freq.id}>
                        {freq.label}
                      </option>
                    ))}
                  </select>

                  {entry.frequency === 'customMonths' && (
                    <label className="mb-2 block text-slate-500">
                      Every (months)
                      <input
                        type="number"
                        min={1}
                        value={entry.intervalMonths ?? 1}
                        onChange={(e) => {
                          const parsed = toNumberOrZero(e.target.value);
                          const next = Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
                          onUpdateAdditional(entry.id, { intervalMonths: next });
                        }}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 font-semibold text-slate-800 focus:outline-none dark:border-slate-600 dark:bg-transparent dark:text-white"
                      />
                    </label>
                  )}

                  {entry.frequency === 'oneOff' ? (
                    <div className="mb-2 grid grid-cols-2 gap-3">
                      <label className="text-slate-500">
                        Month
                        <input
                          type="number"
                          value={entry.startMonth}
                          onChange={(e) =>
                            onUpdateAdditional(entry.id, { startMonth: toNumberOrZero(e.target.value) })
                          }
                          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 font-semibold text-slate-800 focus:outline-none dark:border-slate-600 dark:bg-transparent dark:text-white"
                        />
                      </label>
                      <label className="text-slate-500">
                        Amount
                        <div className="mt-1 flex items-center rounded-2xl border border-slate-200 px-3 py-2 font-semibold text-slate-800 focus-within:ring dark:border-slate-600 dark:bg-transparent dark:text-white">
                          <span className="mr-1 text-slate-400">$</span>
                          <input
                            type="number"
                            value={entry.amount}
                            onChange={(e) => onUpdateAdditional(entry.id, { amount: toNumberOrZero(e.target.value) })}
                            className="w-full bg-transparent focus:outline-none"
                          />
                        </div>
                      </label>
                    </div>
                  ) : (
                    <>
                      <div className="mb-2 grid grid-cols-2 gap-3">
                        <label className="text-slate-500">
                          Start month
                          <input
                            type="number"
                            value={entry.startMonth}
                            onChange={(e) =>
                              onUpdateAdditional(entry.id, { startMonth: toNumberOrZero(e.target.value) })
                            }
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 font-semibold text-slate-800 focus:outline-none dark:border-slate-600 dark:bg-transparent dark:text-white"
                          />
                        </label>
                        <label className="text-slate-500">
                          Finish month
                          <input
                            type="number"
                            value={entry.endMonth}
                            onChange={(e) =>
                              onUpdateAdditional(entry.id, { endMonth: toNumberOrZero(e.target.value) })
                            }
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 font-semibold text-slate-800 focus:outline-none dark:border-slate-600 dark:bg-transparent dark:text-white"
                          />
                        </label>
                      </div>
                      <label className="text-slate-500">
                        Amount
                        <div className="mt-1 flex items-center rounded-2xl border border-slate-200 px-3 py-2 font-semibold text-slate-800 focus-within:ring dark:border-slate-600 dark:bg-transparent dark:text-white">
                          <span className="mr-1 text-slate-400">$</span>
                          <input
                            type="number"
                            value={entry.amount}
                            onChange={(e) => onUpdateAdditional(entry.id, { amount: toNumberOrZero(e.target.value) })}
                            className="w-full bg-transparent focus:outline-none"
                          />
                        </div>
                      </label>
                    </>
                  )}

                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-transparent dark:text-slate-300">
                    <p>Original completion date: {originalCompletionDateLabel}</p>
                    <p>Updated completion date: {updatedCompletionDateLabel}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between text-sm font-semibold text-slate-600 pl-1">
            <span>Interest rate change</span>
            <button
              type="button"
              onClick={onAddRateChange}
              className="rounded-full border border-brand-500 px-3 py-1 text-xs font-semibold text-brand-500"
            >
              Add
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {rateChanges.length === 0 && (
              <p className="pl-3 pb-2 text-xs text-slate-500 dark:text-slate-300">
                No interest rate changes configured.
              </p>
            )}
            {rateChanges.map((entry) => {
              const summary = ratePaymentSummaries.find((item) => item.id === entry.id);
              const original = ratePaymentSummaries[0];
              return (
                <div key={entry.id} className="rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700">
                  <div className="mb-2 flex items-center justify-between font-semibold text-slate-600">
                    <span>Rate change</span>
                    <button
                    type="button"
                    onClick={() => onRemoveRateChange(entry.id)}
                    className="text-brand-500"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-slate-500">
                    Start month
                    <input
                      type="number"
                      value={entry.startMonth}
                      onChange={(e) => onUpdateRateChange(entry.id, { startMonth: toNumberOrZero(e.target.value) })}
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 font-semibold text-slate-800 focus:outline-none dark:border-slate-600 dark:bg-transparent dark:text-white"
                    />
                  </label>
                  <label className="text-slate-500">
                    New rate (%)
                    <input
                      type="number"
                      step="0.05"
                      value={entry.newRate}
                      onChange={(e) => onUpdateRateChange(entry.id, { newRate: toNumberOrZero(e.target.value) })}
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 font-semibold text-slate-800 focus:outline-none dark:border-slate-600 dark:bg-transparent dark:text-white"
                    />
                  </label>
                </div>
                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-transparent dark:text-slate-300">
                  {original && (
                    <p>Original repayment: {formatCurrency(original.payment)} /month</p>
                  )}
                  {summary && (
                    <p>Updated repayment: {formatCurrency(summary.payment)} /month</p>
                  )}
                </div>
              </div>
            );})}
          </div>
        </CollapsibleContainer>
      </div>
    </>
  );
};
