import React, { useMemo, useState } from 'react';
import { ToggleGroup, ToggleOption } from '../components/ToggleGroup';
import { CurrencyInput } from '../components/inputs';
import { formatCurrency, formatPercent, toNumberOrZero } from '../lib/formatters';
import { Tooltip } from '../components/Tooltip';
import { InfoTooltipWithLink } from '../components/InfoTooltipWithLink';
import { calculatePaySummary, calculateLITO, calculateMedicareSurcharge } from '../../../calc-engine/src';

type Frequency = 'weekly' | 'fortnightly' | 'monthly' | 'annually' | 'projection';
type TaxYear = '2024-25' | '2025-26';
type TaxResidency = 'resident' | 'non-resident' | 'whm';

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
  taxResidency: TaxResidency;
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

  // Pre-tax deductions reduce taxable income
  const totalPreTaxDeductions = salarySacrificeTotal + concessionalDeductionsTotal;

  // Map tax residency for calc-engine
  const residency =
    inputs.taxResidency === 'resident' ? 'resident' :
    inputs.taxResidency === 'non-resident' ? 'nonResident' : 'workingHoliday';

  // Use calc-engine for base calculation
  const baseCalc = calculatePaySummary({
    taxYear: inputs.taxYear,
    residency,
    annualSalary: grossAnnual,
    frequency: 'monthly',
    hasHELP: inputs.hasHELP,
    medicareExempt: false,
    claimTaxFreeThreshold: inputs.taxResidency === 'resident',
    deductions: totalPreTaxDeductions,
    includeSuper: false,
    superRate: 0,
  });

  // Calculate LITO and Medicare Surcharge using calc-engine functions
  const lito = calculateLITO(inputs.taxYear, baseCalc.annual.taxable);
  const medicareSurcharge = calculateMedicareSurcharge(
    inputs.taxYear,
    baseCalc.annual.taxable,
    inputs.hasPrivateHealth
  );

  // Tax before offsets
  const incomeTaxBeforeOffsets = baseCalc.annual.incomeTax + lito;
  const taxOffsets = lito;

  // Final income tax after offsets
  const incomeTaxAnnual = baseCalc.annual.incomeTax;

  // Total withholdings include surcharge
  const totalWithheldAnnual = baseCalc.annual.totalWithheld + medicareSurcharge;

  // Net = Gross - Pre-tax deductions - Tax withholdings
  const netAnnual = grossAnnual - totalPreTaxDeductions - totalWithheldAnnual;
  const effectiveRate = grossAnnual > 0 ? totalWithheldAnnual / grossAnnual : 0;

  return {
    grossAnnual,
    taxableAnnual: baseCalc.annual.taxable,
    incomeTaxBeforeOffsets,
    taxOffsets,
    incomeTaxAnnual,
    medicareAnnual: baseCalc.annual.medicareLevy,
    medicareSurcharge,
    helpAnnual: baseCalc.annual.help,
    totalWithheldAnnual,
    netAnnual,
    effectiveRate,
  };
}

export const DetailedPayCalculatorCard: React.FC = () => {
  const [inputs, setInputs] = useState<Inputs>({
    taxYear: '2025-26',
    annualSalary: 90000,
    frequency: 'fortnightly',
    hasHELP: false,
    taxResidency: 'resident',
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
    placeholderPrefix: string,
    tooltipContent?: string,
    tooltipSection?: string
  ) => (
    <>
      <div className="flex items-center justify-between text-sm font-semibold text-slate-600 pl-1">
        {tooltipContent && tooltipSection ? (
          <div className="flex items-center gap-1.5">
            <span>{title}</span>
            <InfoTooltipWithLink
              content={tooltipContent}
              targetSection={tooltipSection}
            />
          </div>
        ) : (
          <span>{title}</span>
        )}
        <button
          type="button"
          onClick={onAdd}
          className="rounded-full border border-brand-500 px-3 py-1 text-xs font-semibold text-brand-500"
        >
          Add
        </button>
      </div>
      <div className="mt-3 space-y-3">
        {entries.length === 0 && (
          <p className="pl-3 text-xs text-slate-500 dark:text-dark-muted">
            No {title.toLowerCase()} configured.
          </p>
        )}
        {entries.length > 0 && (
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
    </>
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

  const salarySacrificeTotal = salarySacrifice.reduce(
    (sum, entry) => sum + calculateEntryAnnualAmount(entry),
    0
  );
  const concessionalDeductionsTotal = concessionalDeductions.reduce(
    (sum, entry) => sum + calculateEntryAnnualAmount(entry),
    0
  );

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

      <div className="space-y-4">
        <div>
          {renderEntryList(
            'Additional income',
            additionalIncome,
            handleAddIncome,
            handleUpdateIncome,
            handleRemoveIncome,
            'Income',
            'Additional income sources beyond your primary salary.',
            'financial-disclaimer'
          )}
        </div>

        <div>
          {renderEntryList(
            'Salary sacrifice',
            salarySacrifice,
            handleAddSacrifice,
            handleUpdateSacrifice,
            handleRemoveSacrifice,
            'Sacrifice',
            'Pre-tax salary sacrificed to superannuation or other benefits.',
            'salary-sacrifice'
          )}
        </div>

        <div>
          {renderEntryList(
            'Concessional super deductions',
            concessionalDeductions,
            handleAddDeduction,
            handleUpdateDeduction,
            handleRemoveDeduction,
            'Deduction',
            'Tax-deductible superannuation contributions.',
            'salary-sacrifice'
          )}
        </div>

        <div className="border-t border-slate-200 dark:border-dark-border pt-4"></div>

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
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-dark-muted">
              Private Health Insurance
            </p>
            <InfoTooltipWithLink
              content="Affects Medicare Levy Surcharge. May reduce your tax."
              targetSection="private-health"
            />
          </div>
          <ToggleGroup
            options={yesNoOptions}
            value={healthToggleValue}
            onChange={(value) => set('hasPrivateHealth', value === 'yes')}
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
                <th className="pb-1">Week</th>
                <th className="pb-1">Fortnight</th>
                <th className="pb-1">Month</th>
                <th className="pb-1">Year</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1">{formatCurrency(results.netAnnual / 52)}</td>
                <td className="py-1">{formatCurrency(results.netAnnual / 26)}</td>
                <td className="py-1">{formatCurrency(results.netAnnual / 12)}</td>
                <td className="py-1">{formatCurrency(results.netAnnual)}</td>
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
                <td className="py-1">{formatCurrency(results.grossAnnual)}</td>
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
