import React, { useMemo, useState } from 'react';
import { ToggleGroup, ToggleOption } from '../components/ToggleGroup';
import { CurrencyInput } from '../components/inputs';
import { formatCurrency, formatPercent } from '../lib/formatters';
import { Tooltip } from '../components/Tooltip';
import { InfoTooltipWithLink } from '../components/InfoTooltipWithLink';
import { calculatePaySummary } from '../../../calc-engine/src';

type Frequency = 'weekly' | 'fortnightly' | 'monthly' | 'annually' | 'projection';
type TaxYear = '2024-25' | '2025-26';
type TaxResidency = 'resident' | 'non-resident' | 'whm';

type Inputs = {
  taxYear: TaxYear;
  annualSalary: number;
  frequency: Frequency;
  hasHELP: boolean;
  taxResidency: TaxResidency;
  includeSuper: boolean;
  superRate: number;
};

type Results = {
  grossPerPeriod: number;
  taxableAnnual: number;
  incomeTaxAnnual: number;
  medicareAnnual: number;
  helpAnnual: number;
  totalWithheldAnnual: number;
  netAnnual: number;
  netPerPeriod: number;
  withheldPerPeriod: number;
  superPerPeriod: number;
  effectiveRate: number;
};

const frequencyOptions: ToggleOption<Frequency>[] = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Fortnightly', value: 'fortnightly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Annual', value: 'annually' },
  { label: 'Projection', value: 'projection' },
];

const taxYearOptions: Array<{ label: string; value: TaxYear }> = [
  { label: '2024–25', value: '2024-25' },
  { label: '2025–26', value: '2025-26' },
];

const yesNoOptions: ToggleOption<'yes' | 'no'>[] = [
  { label: 'No', value: 'no' },
  { label: 'Yes', value: 'yes' },
];

const taxResidencyOptions: ToggleOption<TaxResidency>[] = [
  { label: 'Resident', value: 'resident' },
  { label: 'Non-resident', value: 'non-resident' },
  { label: 'WHM', value: 'whm' },
];

const periodsPerYear: Record<Frequency, number> = {
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
  annually: 1,
  projection: 1,
};

const frequencyLabels: Record<Frequency, string> = {
  weekly: 'week',
  fortnightly: 'fortnight',
  monthly: 'month',
  annually: 'year',
  projection: 'FY projection',
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

// Calculate the percentage through the current financial year (July 1 - June 30)
const getFinancialYearProgress = (): number => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11

  // Financial year starts July 1 (month 6)
  let fyStart: Date;
  let fyEnd: Date;

  if (currentMonth >= 6) {
    // We're in the second half of calendar year, so FY is currentYear to currentYear+1
    fyStart = new Date(currentYear, 6, 1); // July 1 of current year
    fyEnd = new Date(currentYear + 1, 5, 30); // June 30 of next year
  } else {
    // We're in the first half of calendar year, so FY is previousYear to currentYear
    fyStart = new Date(currentYear - 1, 6, 1); // July 1 of previous year
    fyEnd = new Date(currentYear, 5, 30); // June 30 of current year
  }

  const totalDays = (fyEnd.getTime() - fyStart.getTime()) / (1000 * 60 * 60 * 24);
  const daysPassed = (now.getTime() - fyStart.getTime()) / (1000 * 60 * 60 * 24);

  return Math.min(1, Math.max(0, daysPassed / totalDays));
};

function compute(inputs: Inputs): Results {
  // Map frequency for calc-engine (it doesn't support 'annually' or 'projection')
  const engineFrequency =
    inputs.frequency === 'projection' || inputs.frequency === 'annually' ? 'monthly' : inputs.frequency;

  // Map tax residency
  const residency =
    inputs.taxResidency === 'resident' ? 'resident' :
    inputs.taxResidency === 'non-resident' ? 'nonResident' : 'workingHoliday';

  // Call calc-engine
  const response = calculatePaySummary({
    taxYear: inputs.taxYear,
    residency,
    annualSalary: inputs.annualSalary,
    frequency: engineFrequency,
    hasHELP: inputs.hasHELP,
    medicareExempt: false,
    claimTaxFreeThreshold: inputs.taxResidency === 'resident',
    deductions: 0,
    includeSuper: inputs.includeSuper,
    superRate: inputs.superRate,
  });

  // For 'annually' and 'projection', calculate periods ourselves
  const periods = periodsPerYear[inputs.frequency];

  return {
    grossPerPeriod: response.annual.gross / periods,
    taxableAnnual: response.annual.taxable,
    incomeTaxAnnual: response.annual.incomeTax,
    medicareAnnual: response.annual.medicareLevy,
    helpAnnual: response.annual.help,
    totalWithheldAnnual: response.annual.totalWithheld,
    netAnnual: response.annual.net,
    netPerPeriod: response.annual.net / periods,
    withheldPerPeriod: response.annual.totalWithheld / periods,
    superPerPeriod: response.annual.employerSuper / periods,
    effectiveRate: response.effectiveTaxRate,
  };
}

const incomeTableColumns: Array<{ key: Frequency; label: string }> = [
  { key: 'weekly', label: 'Week' },
  { key: 'fortnightly', label: 'Fortnight' },
  { key: 'monthly', label: 'Month' },
  { key: 'annually', label: 'Year' },
];

export const PayCalculatorCard: React.FC = () => {
  const [inputs, setInputs] = useState<Inputs>({
    taxYear: '2025-26',
    annualSalary: 90000,
    frequency: 'fortnightly',
    hasHELP: false,
    taxResidency: 'resident',
    includeSuper: false,
    superRate: 0.115,
  });

  const results = useMemo(() => compute(inputs), [inputs]);
  const set = <K extends keyof Inputs>(key: K, value: Inputs[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  const incomePerPeriod =
    inputs.frequency === 'projection'
      ? inputs.annualSalary * getFinancialYearProgress()
      : inputs.annualSalary / periodsPerYear[inputs.frequency];
  const annualIncome = inputs.annualSalary;

  // When frequency is annually or projection, show weekly in first column
  const isAnnualOrProjection = inputs.frequency === 'annually' || inputs.frequency === 'projection';
  const firstColumnLabel = isAnnualOrProjection ? 'Weekly' : frequencyLabels[inputs.frequency];
  const periodsForFirstColumn = isAnnualOrProjection ? 52 : periodsPerYear[inputs.frequency];

  const handleIncomeChange = (value: number) => {
    let annual: number;

    if (inputs.frequency === 'projection') {
      // For projection, the value is income to date, project for full year
      const progress = getFinancialYearProgress();
      annual = progress > 0 ? value / progress : value;
    } else {
      // For other frequencies, multiply by periods per year
      annual = value * periodsPerYear[inputs.frequency];
    }

    set('annualSalary', annual);
  };

  const handleFrequencyChange = (value: Frequency) => {
    set('frequency', value);
  };

  const helpToggleValue = inputs.hasHELP ? 'yes' : 'no';

  const incomeInputLabel =
    inputs.frequency === 'projection' ? 'Income to date (FY)' : 'Gross Income';

  return (
    <div className="space-y-4">
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-3">
              <CurrencyInput
                label={incomeInputLabel}
                value={Math.max(0, Math.round(incomePerPeriod))}
                onChange={handleIncomeChange}
                className="block w-full"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-dark-muted">Tax year</label>
              <select
                className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-base font-semibold text-slate-800 outline-none focus:border-brand-500 dark:border-dark-border dark:bg-transparent dark:text-white"
                value={inputs.taxYear}
                onChange={(event) => set('taxYear', event.target.value as TaxYear)}
              >
                {taxYearOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              <ToggleGroup
                options={frequencyOptions.slice(0, 3)}
                value={inputs.frequency}
                onChange={handleFrequencyChange}
              />
            </div>
            <div className="flex gap-2">
              <ToggleGroup
                options={frequencyOptions.slice(3)}
                value={inputs.frequency}
                onChange={handleFrequencyChange}
              />
            </div>
          </div>
          <table className="w-full table-fixed text-left text-xs text-slate-600 dark:text-dark-text">
            <thead>
              <tr>
                {incomeTableColumns.map((column) => (
                  <th key={column.key} className="pb-1">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {incomeTableColumns.map((column) => {
                  const value =
                    column.key === 'annually'
                      ? annualIncome
                      : inputs.annualSalary / periodsPerYear[column.key as Frequency];
                  return (
                    <td key={column.key} className="py-1">
                      {formatCurrency(value)}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-dark-muted">
                HECS / HELP debt
              </p>
              <Tooltip content="Higher Education Loan Program repayments are calculated based on your income" />
            </div>
            <ToggleGroup
              options={yesNoOptions}
              value={helpToggleValue}
              onChange={(value) => set('hasHELP', value === 'yes')}
              size="sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-dark-muted whitespace-nowrap">
                Tax Residency
              </p>
              <InfoTooltipWithLink
                content="Your tax residency status affects your tax rates and obligations."
                targetSection="tax-residency"
              />
            </div>
            <ToggleGroup
              options={taxResidencyOptions}
              value={inputs.taxResidency}
              onChange={(value) => set('taxResidency', value)}
              size="sm"
            />
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-slate-600 dark:border-dark-border dark:bg-dark-surfaceAlt dark:text-dark-text">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-dark-muted">
              Pay Breakdown
            </p>
            <div className="mb-2 flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-slate-500 dark:text-dark-muted"></span>
              <div className="flex gap-4">
                <span className="min-w-[80px] text-right text-xs font-semibold capitalize text-slate-500 dark:text-dark-muted">
                  {firstColumnLabel}
                </span>
                <span className="min-w-[80px] text-right text-xs font-semibold text-slate-500 dark:text-dark-muted">
                  Annual
                </span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {[
                {
                  label: 'Gross',
                  perPeriod: inputs.annualSalary / periodsForFirstColumn,
                  annual: inputs.annualSalary,
                  showDivider: false,
                },
                {
                  label: 'Income tax',
                  perPeriod: results.incomeTaxAnnual / periodsForFirstColumn,
                  annual: results.incomeTaxAnnual,
                  showDivider: false,
                },
                {
                  label: 'Medicare levy',
                  perPeriod: results.medicareAnnual / periodsForFirstColumn,
                  annual: results.medicareAnnual,
                  showDivider: false,
                },
                {
                  label: 'HELP / HECS',
                  perPeriod: results.helpAnnual / periodsForFirstColumn,
                  annual: results.helpAnnual,
                  showDivider: false,
                },
                {
                  label: 'Total withheld',
                  perPeriod: results.totalWithheldAnnual / periodsForFirstColumn,
                  annual: results.totalWithheldAnnual,
                  showDivider: true,
                },
              ].map((row) => (
                <div key={row.label}>
                  {row.showDivider && (
                    <div className="mb-2 border-t border-slate-300 dark:border-dark-border"></div>
                  )}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-700 dark:text-dark-text">{row.label}</span>
                    <div className="flex gap-4">
                      <span className="min-w-[80px] text-right font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(row.perPeriod)}
                      </span>
                      <span className="min-w-[80px] text-right font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(row.annual)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-dark-muted">Take-home pay</label>
              <InfoTooltipWithLink
                content="These are estimates only. Actual amounts may vary."
                targetSection="financial-disclaimer"
              />
            </div>
            <table className="w-full table-fixed text-left text-xs text-slate-600 dark:text-dark-text">
              <thead>
                <tr>
                  {incomeTableColumns.map((column) => (
                    <th key={column.key} className="pb-1">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {incomeTableColumns.map((column) => {
                    const value =
                      column.key === 'annually'
                        ? results.netAnnual
                        : results.netAnnual / periodsPerYear[column.key as Frequency];
                    return (
                      <td key={column.key} className="py-1">
                        {formatCurrency(value)}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-dark-muted">Annual Summary</label>
            <table className="w-full table-fixed text-left text-xs text-slate-600 dark:text-dark-text">
              <thead>
                <tr>
                  <th className="pb-1">Gross Pay</th>
                  <th className="pb-1">Net Pay</th>
                  <th className="pb-1">Nominal Tax Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1">{formatCurrency(results.taxableAnnual)}</td>
                  <td className="py-1">{formatCurrency(results.netAnnual)}</td>
                  <td className="py-1">{formatPercent(results.effectiveRate)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
};
