import React, { useMemo, useState } from 'react';
import { ToggleGroup, ToggleOption } from '../components/ToggleGroup';
import { CurrencyInput } from '../components/inputs';
import { formatCurrency } from '../lib/formatters';
import { CollapsibleContainer } from '../components/CollapsibleContainer';
import { IncomeBreakdownChart } from '../graphs/IncomeBreakdownChart';

type Frequency = 'weekly' | 'fortnightly' | 'monthly' | 'annually' | 'projection';
type TaxYear = '2024-25' | '2025-26';

type Inputs = {
  taxYear: TaxYear;
  annualSalary: number;
  frequency: Frequency;
  hasHELP: boolean;
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

const fmtAUD0 = (n: number) =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);

const percentText = (value: number) => `${(clamp(value, 0, 1) * 100).toFixed(1)}%`;

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

const RESIDENT_BRACKETS: Record<
  TaxYear,
  Array<{ from: number; to?: number; baseTax: number; marginalRate: number }>
> = {
  '2024-25': [
    { from: 0, to: 18200, baseTax: 0, marginalRate: 0 },
    { from: 18200, to: 45000, baseTax: 0, marginalRate: 0.16 },
    { from: 45000, to: 135000, baseTax: 4288, marginalRate: 0.3 },
    { from: 135000, to: 190000, baseTax: 31288, marginalRate: 0.37 },
    { from: 190000, baseTax: 51638, marginalRate: 0.45 },
  ],
  '2025-26': [
    { from: 0, to: 18200, baseTax: 0, marginalRate: 0 },
    { from: 18200, to: 45000, baseTax: 0, marginalRate: 0.16 },
    { from: 45000, to: 135000, baseTax: 4288, marginalRate: 0.3 },
    { from: 135000, to: 190000, baseTax: 31288, marginalRate: 0.37 },
    { from: 190000, baseTax: 51638, marginalRate: 0.45 },
  ],
};

const HELP_TABLE_2024_25: Array<{ from: number; to?: number; rate: number }> = [
  { from: 0, to: 54435, rate: 0 },
  { from: 54435, to: 62850, rate: 0.01 },
  { from: 62850, to: 66620, rate: 0.02 },
  { from: 66620, to: 70618, rate: 0.025 },
  { from: 70618, to: 74855, rate: 0.03 },
  { from: 74855, to: 79346, rate: 0.035 },
  { from: 79346, to: 84107, rate: 0.04 },
  { from: 84107, to: 89153, rate: 0.045 },
  { from: 89153, to: 94502, rate: 0.05 },
  { from: 94502, to: 100173, rate: 0.055 },
  { from: 100173, to: 106183, rate: 0.06 },
  { from: 106183, to: 112554, rate: 0.065 },
  { from: 112554, to: 119307, rate: 0.07 },
  { from: 119307, to: 126465, rate: 0.075 },
  { from: 126465, to: 134053, rate: 0.08 },
  { from: 134053, to: 142097, rate: 0.085 },
  { from: 142097, to: 150623, rate: 0.09 },
  { from: 150623, to: 159660, rate: 0.095 },
  { from: 159660, rate: 0.1 },
];

function calcResidentIncomeTax(taxYear: TaxYear, taxableAnnual: number): number {
  const brackets = RESIDENT_BRACKETS[taxYear];
  const income = Math.max(0, taxableAnnual);
  const bracket = brackets.find((b) => income >= b.from && (b.to === undefined || income <= b.to));
  if (!bracket) return 0;
  return Math.max(0, bracket.baseTax + (income - bracket.from) * bracket.marginalRate);
}

function calcHELPRepayment(_taxYear: TaxYear, repaymentIncome: number): number {
  const income = Math.max(0, repaymentIncome);
  const row = HELP_TABLE_2024_25.find((r) => income >= r.from && (r.to === undefined || income <= r.to));
  const rate = row?.rate ?? 0;
  return income * rate;
}

function calcMedicareLevy(taxableAnnual: number): number {
  return Math.max(0, taxableAnnual) * 0.02;
}

function compute(inputs: Inputs): Results {
  const periods = periodsPerYear[inputs.frequency];
  const grossAnnual = Math.max(0, inputs.annualSalary);
  const taxableAnnual = grossAnnual;
  const incomeTaxAnnual = calcResidentIncomeTax(inputs.taxYear, taxableAnnual);
  const medicareAnnual = calcMedicareLevy(taxableAnnual);
  const helpAnnual = inputs.hasHELP ? calcHELPRepayment(inputs.taxYear, taxableAnnual) : 0;
  const totalWithheldAnnual = incomeTaxAnnual + medicareAnnual + helpAnnual;
  const netAnnual = grossAnnual - totalWithheldAnnual;
  const grossPerPeriod = grossAnnual / periods;
  const withheldPerPeriod = totalWithheldAnnual / periods;
  const netPerPeriod = netAnnual / periods;
  const superPerPeriod = grossPerPeriod * inputs.superRate;
  const effectiveRate = grossAnnual > 0 ? totalWithheldAnnual / grossAnnual : 0;

  return {
    grossPerPeriod,
    taxableAnnual,
    incomeTaxAnnual,
    medicareAnnual,
    helpAnnual,
    totalWithheldAnnual,
    netAnnual,
    netPerPeriod,
    withheldPerPeriod,
    superPerPeriod,
    effectiveRate,
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
    taxYear: '2024-25',
    annualSalary: 90000,
    frequency: 'fortnightly',
    hasHELP: false,
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
  const taxableLabel = formatCurrency(results.taxableAnnual);

  const breakdownData = {
    gross: results.grossPerPeriod,
    incomeTax: results.incomeTaxAnnual / periodsPerYear[inputs.frequency],
    medicare: results.medicareAnnual / periodsPerYear[inputs.frequency],
    help: results.helpAnnual / periodsPerYear[inputs.frequency],
    totalWithheld: results.withheldPerPeriod,
    net: results.netPerPeriod,
  };

  const weeklyBreakdownData = {
    gross: inputs.annualSalary / 52,
    incomeTax: results.incomeTaxAnnual / 52,
    medicare: results.medicareAnnual / 52,
    help: results.helpAnnual / 52,
    totalWithheld: results.totalWithheldAnnual / 52,
    net: results.netAnnual / 52,
  };

  const annualBreakdownData = {
    gross: results.grossPerPeriod * periodsPerYear[inputs.frequency],
    incomeTax: results.incomeTaxAnnual,
    medicare: results.medicareAnnual,
    help: results.helpAnnual,
    totalWithheld: results.totalWithheldAnnual,
    net: results.netAnnual,
  };

  // When frequency is annually or projection, show weekly in first column
  const isAnnualOrProjection = inputs.frequency === 'annually' || inputs.frequency === 'projection';
  const firstColumnData = isAnnualOrProjection ? weeklyBreakdownData : breakdownData;
  const firstColumnLabel = isAnnualOrProjection ? 'Weekly' : frequencyLabels[inputs.frequency];

  const timeframeLabel = `per ${frequencyLabels[inputs.frequency]}`;

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
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-dark-muted">
              HECS / HELP debt
            </p>
            <ToggleGroup
              options={yesNoOptions}
              value={helpToggleValue}
              onChange={(value) => set('hasHELP', value === 'yes')}
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
                <span className="min-w-[80px] text-right text-xs font-semibold capitalize text-slate-500 dark:text-dark-muted">{firstColumnLabel}</span>
                <span className="min-w-[80px] text-right text-xs font-semibold text-slate-500 dark:text-dark-muted">Annual</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Gross', perPeriod: firstColumnData.gross, annual: annualBreakdownData.gross, showDivider: false },
                { label: 'Income tax', perPeriod: firstColumnData.incomeTax, annual: annualBreakdownData.incomeTax, showDivider: false },
                { label: 'Medicare levy', perPeriod: firstColumnData.medicare, annual: annualBreakdownData.medicare, showDivider: false },
                { label: 'HELP / HECS', perPeriod: firstColumnData.help, annual: annualBreakdownData.help, showDivider: false },
                { label: 'Total withheld', perPeriod: firstColumnData.totalWithheld, annual: annualBreakdownData.totalWithheld, showDivider: true },
              ].map((row) => (
                <div key={row.label}>
                  {row.showDivider && (
                    <div className="mb-2 border-t border-slate-300 dark:border-dark-border"></div>
                  )}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-700 dark:text-dark-text">{row.label}</span>
                    <div className="flex gap-4">
                      <span className="min-w-[80px] text-right font-semibold text-slate-900 dark:text-white">{fmtAUD0(row.perPeriod)}</span>
                      <span className="min-w-[80px] text-right font-semibold text-slate-900 dark:text-white">{fmtAUD0(row.annual)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <CollapsibleContainer title="Pay Breakdown (Visualised)" collapsible defaultOpen={false}>
            <IncomeBreakdownChart
              netPay={results.netAnnual}
              incomeTax={results.incomeTaxAnnual}
              medicareLevy={results.medicareAnnual}
              helpHecs={results.helpAnnual}
            />
          </CollapsibleContainer>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-slate-600 shadow-sm dark:border-dark-border dark:bg-dark-surfaceAlt dark:text-dark-text">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-dark-muted">
              Take-home pay
            </p>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] capitalize text-slate-500 dark:text-dark-muted">{firstColumnLabel}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {fmtAUD0(firstColumnData.net)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-500 dark:text-dark-muted">Annual</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {fmtAUD0(annualBreakdownData.net)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-slate-600 dark:border-dark-border dark:bg-dark-surfaceAlt dark:text-dark-text">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-dark-muted">
              Annual Summary
            </p>
            <div className="flex items-center justify-between text-sm">
              <div className="flex-1 text-center">
                <p className="text-xs text-slate-500 dark:text-dark-muted">Gross Pay</p>
                <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  {fmtAUD0(results.taxableAnnual)}
                </p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-xs text-slate-500 dark:text-dark-muted">Net Pay</p>
                <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  {fmtAUD0(results.netAnnual)}
                </p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-xs text-slate-500 dark:text-dark-muted">Nominal Tax Rate</p>
                <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  {percentText(results.effectiveRate)}
                </p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};
