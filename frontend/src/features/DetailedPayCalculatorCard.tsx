import React, { useMemo, useState } from 'react';
import { ToggleGroup, ToggleOption } from '../components/ToggleGroup';
import { CurrencyInput } from '../components/inputs';
import { formatCurrency, toNumberOrZero } from '../lib/formatters';
import { CollapsibleContainer } from '../components/CollapsibleContainer';
import { IncomeBreakdownChart } from '../graphs/IncomeBreakdownChart';

type Frequency = 'weekly' | 'fortnightly' | 'monthly' | 'annually' | 'projection';
type TaxYear = '2024-25' | '2025-26';

type IncomeEntry = {
  id: string;
  label: string;
  frequency: 'weekly' | 'fortnightly' | 'monthly' | 'annually';
  startMonth: number;
  finishMonth: number;
  amount: number;
};

type SacrificeEntry = {
  id: string;
  label: string;
  frequency: 'weekly' | 'fortnightly' | 'monthly' | 'annually';
  startMonth: number;
  finishMonth: number;
  amount: number;
};

type DeductionEntry = {
  id: string;
  label: string;
  frequency: 'weekly' | 'fortnightly' | 'monthly' | 'annually';
  startMonth: number;
  finishMonth: number;
  amount: number;
};

type Inputs = {
  taxYear: TaxYear;
  annualSalary: number;
  frequency: Frequency;
  hasHELP: boolean;
  hasPrivateHealth: boolean;
};

const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`;

// Financial year months (July to June)
const FINANCIAL_YEAR_MONTHS = [
  { value: 0, label: 'Not set' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
];

type Results = {
  grossAnnual: number;
  taxableAnnual: number;
  incomeTaxBeforeOffsets: number;
  taxOffsets: number;
  incomeTaxAnnual: number;
  medicareAnnual: number;
  medicareSurcharge: number;
  helpAnnual: number;
  totalWithheldAnnual: number;
  netAnnual: number;
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
  const currentMonth = now.getMonth();

  let fyStart: Date;
  let fyEnd: Date;

  if (currentMonth >= 6) {
    fyStart = new Date(currentYear, 6, 1);
    fyEnd = new Date(currentYear + 1, 5, 30);
  } else {
    fyStart = new Date(currentYear - 1, 6, 1);
    fyEnd = new Date(currentYear, 5, 30);
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

// Medicare Levy Surcharge tiers (for those without private health insurance)
const MLS_TIERS = [
  { from: 0, to: 97000, rate: 0 },
  { from: 97000, to: 113000, rate: 0.01 },
  { from: 113000, to: 151000, rate: 0.0125 },
  { from: 151000, rate: 0.015 },
];

function calcResidentIncomeTax(taxYear: TaxYear, taxableAnnual: number): number {
  const brackets = RESIDENT_BRACKETS[taxYear];
  const income = Math.max(0, taxableAnnual);
  const bracket = brackets.find((b) => income >= b.from && (b.to === undefined || income <= b.to));
  if (!bracket) return 0;
  return Math.max(0, bracket.baseTax + (income - bracket.from) * bracket.marginalRate);
}

function calcLITO(taxableIncome: number): number {
  // Low Income Tax Offset - 2024-25 rates
  if (taxableIncome <= 37500) return 700;
  if (taxableIncome <= 45000) return Math.max(0, 700 - 0.05 * (taxableIncome - 37500));
  if (taxableIncome <= 66667) return Math.max(0, 325 - 0.015 * (taxableIncome - 45000));
  return 0;
}

function calcMedicareSurcharge(taxableIncome: number, hasPrivateHealth: boolean): number {
  if (hasPrivateHealth) return 0;
  const tier = MLS_TIERS.find((t) => taxableIncome >= t.from && (t.to === undefined || taxableIncome <= t.to));
  return (tier?.rate ?? 0) * taxableIncome;
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

const entryPeriodsPerYear: Record<'weekly' | 'fortnightly' | 'monthly' | 'annually', number> = {
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
  annually: 1,
};

const calculateEntryAnnualAmount = (
  entry: { frequency: 'weekly' | 'fortnightly' | 'monthly' | 'annually'; startMonth: number; finishMonth: number; amount: number }
): number => {
  const periodsPerYear = entryPeriodsPerYear[entry.frequency];
  const annualAmount = entry.amount * periodsPerYear;

  // If start and finish months are 0 (Not set), assume full year
  if (entry.startMonth === 0 && entry.finishMonth === 0) {
    return annualAmount;
  }

  // If only one is set, also assume full year
  if (entry.startMonth === 0 || entry.finishMonth === 0) {
    return annualAmount;
  }

  // Calculate pro-rated amount based on financial year months
  // Convert to financial year month index (July = 1, August = 2, ..., June = 12)
  const getFYMonthIndex = (month: number) => {
    if (month >= 7) return month - 6; // July (7) = 1, Dec (12) = 6
    return month + 6; // Jan (1) = 7, June (6) = 12
  };

  const startFYIndex = getFYMonthIndex(entry.startMonth);
  const finishFYIndex = getFYMonthIndex(entry.finishMonth);

  const monthsActive = finishFYIndex - startFYIndex + 1;
  if (monthsActive <= 0) return 0;

  return (annualAmount / 12) * monthsActive;
};

function compute(
  inputs: Inputs,
  additionalIncome: IncomeEntry[],
  salarySacrifice: SacrificeEntry[],
  concessionalDeductions: DeductionEntry[]
): Results {
  // Calculate additional income total
  const additionalIncomeTotal = additionalIncome.reduce(
    (sum, entry) => sum + calculateEntryAnnualAmount(entry),
    0
  );

  // Calculate salary sacrifice total
  const salarySacrificeTotal = salarySacrifice.reduce(
    (sum, entry) => sum + calculateEntryAnnualAmount(entry),
    0
  );

  // Calculate concessional deductions total
  const concessionalDeductionsTotal = concessionalDeductions.reduce(
    (sum, entry) => sum + calculateEntryAnnualAmount(entry),
    0
  );

  // Calculate gross annual income (includes all income sources)
  const grossAnnual = Math.max(0, inputs.annualSalary + additionalIncomeTotal);

  // Taxable income is gross minus pre-tax deductions (salary sacrifice and concessional deductions)
  const taxableAnnual = Math.max(0, grossAnnual - salarySacrificeTotal - concessionalDeductionsTotal);

  // Calculate tax before offsets
  const incomeTaxBeforeOffsets = calcResidentIncomeTax(inputs.taxYear, taxableAnnual);

  // Calculate tax offsets
  const lito = calcLITO(taxableAnnual);
  const taxOffsets = lito;

  // Final income tax after offsets
  const incomeTaxAnnual = Math.max(0, incomeTaxBeforeOffsets - taxOffsets);

  const medicareAnnual = calcMedicareLevy(taxableAnnual);
  const medicareSurcharge = calcMedicareSurcharge(taxableAnnual, inputs.hasPrivateHealth);
  const helpAnnual = inputs.hasHELP ? calcHELPRepayment(inputs.taxYear, taxableAnnual) : 0;
  const totalWithheldAnnual = incomeTaxAnnual + medicareAnnual + medicareSurcharge + helpAnnual;

  // Net = Gross - Pre-tax deductions - Tax withholdings
  const netAnnual = grossAnnual - salarySacrificeTotal - concessionalDeductionsTotal - totalWithheldAnnual;
  const effectiveRate = grossAnnual > 0 ? totalWithheldAnnual / grossAnnual : 0;

  return {
    grossAnnual,
    taxableAnnual,
    incomeTaxBeforeOffsets,
    taxOffsets,
    incomeTaxAnnual,
    medicareAnnual,
    medicareSurcharge,
    helpAnnual,
    totalWithheldAnnual,
    netAnnual,
    effectiveRate,
  };
}

const incomeTableColumns: Array<{ key: Frequency; label: string }> = [
  { key: 'weekly', label: 'Week' },
  { key: 'fortnightly', label: 'Fortnight' },
  { key: 'monthly', label: 'Month' },
  { key: 'annually', label: 'Year' },
];

export const DetailedPayCalculatorCard: React.FC = () => {
  const [inputs, setInputs] = useState<Inputs>({
    taxYear: '2024-25',
    annualSalary: 90000,
    frequency: 'fortnightly',
    hasHELP: false,
    hasPrivateHealth: false,
  });

  const [additionalIncome, setAdditionalIncome] = useState<IncomeEntry[]>([]);

  const [salarySacrifice, setSalarySacrifice] = useState<SacrificeEntry[]>([]);

  const [concessionalDeductions, setConcessionalDeductions] = useState<DeductionEntry[]>([]);

  const results = useMemo(
    () => compute(inputs, additionalIncome, salarySacrifice, concessionalDeductions),
    [inputs, additionalIncome, salarySacrifice, concessionalDeductions]
  );

  const set = <K extends keyof Inputs>(key: K, value: Inputs[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  const handleAddIncome = () => {
    setAdditionalIncome((prev) => [
      ...prev,
      { id: createId(), label: `Income ${prev.length + 1}`, frequency: 'monthly', startMonth: 0, finishMonth: 0, amount: 0 },
    ]);
  };

  const handleUpdateIncome = (id: string, data: Partial<IncomeEntry>) => {
    setAdditionalIncome((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...data } : entry)));
  };

  const handleRemoveIncome = (id: string) => {
    setAdditionalIncome((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleAddSacrifice = () => {
    setSalarySacrifice((prev) => [
      ...prev,
      { id: createId(), label: `Sacrifice ${prev.length + 1}`, frequency: 'monthly', startMonth: 0, finishMonth: 0, amount: 0 },
    ]);
  };

  const handleUpdateSacrifice = (id: string, data: Partial<SacrificeEntry>) => {
    setSalarySacrifice((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...data } : entry)));
  };

  const handleRemoveSacrifice = (id: string) => {
    setSalarySacrifice((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleAddDeduction = () => {
    setConcessionalDeductions((prev) => [
      ...prev,
      { id: createId(), label: `Deduction ${prev.length + 1}`, frequency: 'monthly', startMonth: 0, finishMonth: 0, amount: 0 },
    ]);
  };

  const handleUpdateDeduction = (id: string, data: Partial<DeductionEntry>) => {
    setConcessionalDeductions((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...data } : entry)));
  };

  const handleRemoveDeduction = (id: string) => {
    setConcessionalDeductions((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleAmountChange = <T extends { id: string; label: string; frequency: string; startMonth: number; finishMonth: number; amount: number }>(
    update: (id: string, data: Partial<T>) => void,
    id: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const next = Math.max(0, toNumberOrZero(event.target.value));
    update(id, { amount: next } as Partial<T>);
  };

  const handleLabelChange = <T extends { id: string; label: string; frequency: string; startMonth: number; finishMonth: number; amount: number }>(
    update: (id: string, data: Partial<T>) => void,
    id: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    update(id, { label: event.target.value } as Partial<T>);
  };

  const handleFrequencyChangeForEntry = <T extends { id: string; label: string; frequency: string; startMonth: number; finishMonth: number; amount: number }>(
    update: (id: string, data: Partial<T>) => void,
    id: string,
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    update(id, { frequency: event.target.value } as Partial<T>);
  };

  const handleMonthChange = <T extends { id: string; label: string; frequency: string; startMonth: number; finishMonth: number; amount: number }>(
    update: (id: string, data: Partial<T>) => void,
    id: string,
    field: 'startMonth' | 'finishMonth',
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = parseInt(event.target.value, 10);
    update(id, { [field]: value } as Partial<T>);
  };

  const renderEntryList = <T extends { id: string; label: string; frequency: 'weekly' | 'fortnightly' | 'monthly' | 'annually'; startMonth: number; finishMonth: number; amount: number }>(
    title: string,
    entries: T[],
    onAdd: () => void,
    onChange: (id: string, data: Partial<T>) => void,
    onRemove: (id: string) => void,
    placeholderPrefix: string
  ) => (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm dark:border-dark-border dark:bg-dark-surface">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800 dark:text-white">{title}</p>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-full border border-brand-500 bg-white px-4 py-1 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 dark:bg-dark-surface dark:text-brand-400 dark:hover:bg-dark-surfaceAlt"
        >
          Add
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-dark-muted">
          No {title.toLowerCase()} configured.
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-dark-border dark:bg-dark-surfaceAlt"
            >
              <div className="mb-3 flex items-center justify-between gap-3 text-slate-600 dark:text-dark-text">
                <input
                  type="text"
                  value={entry.label}
                  placeholder={`${placeholderPrefix} ${index + 1}`}
                  onChange={(event) => handleLabelChange(onChange, entry.id, event)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text"
                />
                <button
                  type="button"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  onClick={() => onRemove(entry.id)}
                >
                  Remove
                </button>
              </div>

              <div className="mb-2">
                <label className="mb-1 block text-xs text-slate-500 dark:text-dark-muted">
                  Repayment frequency
                </label>
                <select
                  value={entry.frequency}
                  onChange={(event) => handleFrequencyChangeForEntry(onChange, entry.id, event)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-dark-border dark:bg-dark-surface dark:text-white"
                >
                  <option value="weekly">Weekly</option>
                  <option value="fortnightly">Fortnightly</option>
                  <option value="monthly">Monthly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>

              <div className="mb-2 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-500 dark:text-dark-muted">
                    Start month
                  </label>
                  <select
                    value={entry.startMonth}
                    onChange={(event) => handleMonthChange(onChange, entry.id, 'startMonth', event)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-dark-border dark:bg-dark-surface dark:text-white"
                  >
                    {FINANCIAL_YEAR_MONTHS.map((month) => (
                      <option key={`start-${month.value}`} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500 dark:text-dark-muted">
                    Finish month
                  </label>
                  <select
                    value={entry.finishMonth}
                    onChange={(event) => handleMonthChange(onChange, entry.id, 'finishMonth', event)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-dark-border dark:bg-dark-surface dark:text-white"
                  >
                    {FINANCIAL_YEAR_MONTHS.map((month) => (
                      <option key={`finish-${month.value}`} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-dark-muted">
                  Amount
                </label>
                <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 focus-within:ring-1 focus-within:ring-brand-500 dark:border-dark-border dark:bg-dark-surface dark:text-white">
                  <span className="mr-1 text-slate-400 dark:text-dark-muted">$</span>
                  <input
                    type="number"
                    min={0}
                    value={entry.amount}
                    onChange={(event) => handleAmountChange(onChange, entry.id, event)}
                    className="w-full bg-transparent focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const incomePerPeriod =
    inputs.frequency === 'projection'
      ? inputs.annualSalary * getFinancialYearProgress()
      : inputs.annualSalary / periodsPerYear[inputs.frequency];

  const handleIncomeChange = (value: number) => {
    let annual: number;

    if (inputs.frequency === 'projection') {
      const progress = getFinancialYearProgress();
      annual = progress > 0 ? value / progress : value;
    } else {
      annual = value * periodsPerYear[inputs.frequency];
    }

    set('annualSalary', annual);
  };

  const handleFrequencyChange = (value: Frequency) => {
    set('frequency', value);
  };

  const helpToggleValue = inputs.hasHELP ? 'yes' : 'no';
  const healthToggleValue = inputs.hasPrivateHealth ? 'yes' : 'no';

  const incomeInputLabel =
    inputs.frequency === 'projection' ? 'Base salary to date (FY)' : 'Base Salary';

  const periods = periodsPerYear[inputs.frequency];
  const isAnnualOrProjection = inputs.frequency === 'annually' || inputs.frequency === 'projection';
  const firstColumnLabel = isAnnualOrProjection ? 'Weekly' : frequencyLabels[inputs.frequency];
  const periodsForFirstColumn = isAnnualOrProjection ? 52 : periods;

  const salarySacrificeTotal = salarySacrifice.reduce((sum, entry) => sum + (entry.amount || 0), 0);
  const concessionalDeductionsTotal = concessionalDeductions.reduce((sum, entry) => sum + (entry.amount || 0), 0);

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
            <label className="block text-xs font-semibold text-slate-500 dark:text-dark-muted">
              Tax year
            </label>
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
      </div>

      <div className="space-y-3">
        {renderEntryList(
          'Additional income',
          additionalIncome,
          handleAddIncome,
          handleUpdateIncome,
          handleRemoveIncome,
          'Income'
        )}

        {renderEntryList(
          'Salary sacrifice',
          salarySacrifice,
          handleAddSacrifice,
          handleUpdateSacrifice,
          handleRemoveSacrifice,
          'Sacrifice'
        )}

        {renderEntryList(
          'Concessional super deductions',
          concessionalDeductions,
          handleAddDeduction,
          handleUpdateDeduction,
          handleRemoveDeduction,
          'Deduction'
        )}

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

        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-dark-muted">
            Private Health Insurance
          </p>
          <ToggleGroup
            options={yesNoOptions}
            value={healthToggleValue}
            onChange={(value) => set('hasPrivateHealth', value === 'yes')}
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
                label: 'Gross Income',
                perPeriod: results.grossAnnual / periodsForFirstColumn,
                annual: results.grossAnnual,
                showDivider: false,
              },
              {
                label: 'Salary sacrifice',
                perPeriod: salarySacrificeTotal / periodsForFirstColumn,
                annual: salarySacrificeTotal,
                showDivider: false,
              },
              {
                label: 'Concessional super',
                perPeriod: concessionalDeductionsTotal / periodsForFirstColumn,
                annual: concessionalDeductionsTotal,
                showDivider: false,
              },
              {
                label: 'Taxable Income',
                perPeriod: results.taxableAnnual / periodsForFirstColumn,
                annual: results.taxableAnnual,
                showDivider: true,
              },
              {
                label: 'Income tax',
                perPeriod: results.incomeTaxAnnual / periodsForFirstColumn,
                annual: results.incomeTaxAnnual,
                showDivider: false,
              },
              {
                label: 'Tax offsets',
                perPeriod: -results.taxOffsets / periodsForFirstColumn,
                annual: -results.taxOffsets,
                showDivider: false,
              },
              {
                label: 'Medicare levy',
                perPeriod: results.medicareAnnual / periodsForFirstColumn,
                annual: results.medicareAnnual,
                showDivider: false,
              },
              ...(results.medicareSurcharge > 0
                ? [
                    {
                      label: 'Medicare levy surcharge',
                      perPeriod: results.medicareSurcharge / periodsForFirstColumn,
                      annual: results.medicareSurcharge,
                      showDivider: false,
                    },
                  ]
                : []),
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
                      {fmtAUD0(row.perPeriod)}
                    </span>
                    <span className="min-w-[80px] text-right font-semibold text-slate-900 dark:text-white">
                      {fmtAUD0(row.annual)}
                    </span>
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
            medicareSurcharge={results.medicareSurcharge}
            salarySacrifice={salarySacrificeTotal}
            concessionalSuper={concessionalDeductionsTotal}
          />
        </CollapsibleContainer>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-slate-600 shadow-sm dark:border-dark-border dark:bg-dark-surfaceAlt dark:text-dark-text">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-dark-muted">
            Take-home pay
          </p>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] capitalize text-slate-500 dark:text-dark-muted">
                {firstColumnLabel}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {fmtAUD0(results.netAnnual / periodsForFirstColumn)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-slate-500 dark:text-dark-muted">Annual</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {fmtAUD0(results.netAnnual)}
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
                {fmtAUD0(results.grossAnnual)}
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
