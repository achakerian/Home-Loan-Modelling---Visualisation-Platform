import { useMemo, useState } from 'react';
import {
  calculateLoanSchedule,
  type LoanInput,
  type LoanPeriod,
  type RepaymentFrequency,
  type RepaymentType,
  type ExtraRepaymentRule,
  type ExtraRepaymentFrequency,
  type ExtraRepaymentType,
  type RateChange
} from '@calc-engine/core';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  TooltipProps,
  Line
} from 'recharts';

interface BalanceDatum {
  monthIndex: number;
  dateLabel: string;
  principalRemaining: number;
  interestArea: number;
  principalArea: number;
  repayment: number;
  interest: number;
  principal: number;
  baselineBalance?: number;
}

interface BalanceChartProps {
  schedule: LoanPeriod[];
  frequency: RepaymentFrequency;
  initialAmount: number;
  overlaySchedule?: LoanPeriod[];
}

interface TooltipData extends BalanceDatum {
  frequency: RepaymentFrequency;
}

const defaultInput: LoanInput = {
  amount: 650000,
  annualInterestRate: 5.85,
  years: 30,
  frequency: 'monthly',
  type: 'principal-interest'
};

const frequencyOptions: { id: RepaymentFrequency; label: string }[] = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'fortnightly', label: 'Fortnightly' },
  { id: 'monthly', label: 'Monthly' }
];

const frequencySuffix: Record<RepaymentFrequency, string> = {
  weekly: 'week',
  fortnightly: 'fortnight',
  monthly: 'month'
};

const typeOptions: { id: RepaymentType; label: string }[] = [
  { id: 'principal-interest', label: 'Principal & Interest' },
  { id: 'interest-only', label: 'Interest Only' }
];

const periodsPerYear: Record<RepaymentFrequency, number> = {
  weekly: 52,
  fortnightly: 26,
  monthly: 12
};

const currency = (value: number) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(value);

const formatAmount = (value: number) =>
  new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 }).format(value ?? 0);

const formatThousands = (value: number): string => {
  if (value >= 1_000_000) {
    return `${Math.round(value / 1_000_000)}M`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}k`;
  }
  return `${Math.round(value)}`;
};

const BalanceTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;

  const datum = payload[0].payload as TooltipData;
  const frequency = datum.frequency;

  // Convert to monthly amounts
  const periodsPerYearMap: Record<RepaymentFrequency, number> = {
    weekly: 52,
    fortnightly: 26,
    monthly: 12
  };

  const conversionFactor = periodsPerYearMap[frequency] / 12;

  const repayment = (datum.repayment ?? 0) * conversionFactor;
  const interest = (datum.interest ?? 0) * conversionFactor;
  const principal = (datum.principal ?? 0) * conversionFactor;

  const months = datum.monthIndex ?? 0;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  const heading = years
    ? `${years} years ${remMonths} months`
    : `${remMonths} months`;

  const interestPct = repayment > 0 ? (interest / repayment) * 100 : 0;
  const principalPct = repayment > 0 ? (principal / repayment) * 100 : 0;

  return (
    <div className="bg-white rounded-xl p-3 shadow-xl border border-slate-200 text-sm max-w-[260px]">
      <div className="font-semibold mb-2 text-slate-900">
        {heading}
      </div>

      <div className="mb-2">
        <div className="text-xs text-slate-500 mb-1">
          Monthly repayment amount
        </div>
        <div className="font-semibold text-slate-900">
          {currency(repayment)} (100%)
        </div>
      </div>

      <div className="mb-1 text-orange-600">
        Interest:{' '}
        <span className="font-semibold">
          {currency(interest)}
        </span>{' '}
        <span className="text-slate-400">({Math.round(interestPct)}%)</span>
      </div>
      <div className="text-blue-500">
        Principal reduction:{' '}
        <span className="font-semibold">
          {currency(principal)}
        </span>{' '}
        <span className="text-slate-400">({Math.round(principalPct)}%)</span>
      </div>
    </div>
  );
};

const BalanceChart: React.FC<BalanceChartProps> = ({ schedule, frequency, initialAmount, overlaySchedule }) => {
  const data = useMemo<TooltipData[]>(() => {
    if (schedule.length === 0) return [];

    const periodsPerYear: Record<RepaymentFrequency, number> = {
      weekly: 52,
      fortnightly: 26,
      monthly: 12
    };

    return schedule.map((row, index) => {
      const monthsFromStart = Math.floor((index * 12) / periodsPerYear[frequency]);

      const repayment = row.interest + row.principal;
      const interestShare = repayment > 0 ? row.interest / repayment : 0;
      const principalShare = 1 - interestShare;

      const principalRemaining = row.balance;
      const interestArea = principalRemaining * interestShare;
      const principalArea = principalRemaining * principalShare;

      const baselineRow = overlaySchedule && overlaySchedule[index];
      const baselineBalance = baselineRow?.balance;

      return {
        monthIndex: monthsFromStart,
        dateLabel: `Month ${monthsFromStart}`,
        principalRemaining,
        interestArea,
        principalArea,
        repayment,
        interest: row.interest,
        principal: row.principal,
        baselineBalance,
        frequency
      };
    });
  }, [schedule, frequency, overlaySchedule]);

  const maxPrincipal = initialAmount + 100000;
  const lastMonthIndex = data.length ? data[data.length - 1].monthIndex : 0;
  const maxMonth = lastMonthIndex + 12;

  const maxYear = Math.ceil(maxMonth / 12);
  const approxTickCount = 6;
  const yearStep = Math.max(1, Math.round(maxYear / approxTickCount));
  const ticks: number[] = [];
  for (let year = 0; year <= maxYear; year += yearStep) {
    ticks.push(year * 12);
  }
  const finalYearMonth = maxYear * 12;
  if (!ticks.includes(finalYearMonth)) {
    ticks.push(finalYearMonth);
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 8, right: 20, bottom: 48, left: -10 }}>
        <XAxis
          dataKey="monthIndex"
          type="number"
          domain={[0, maxMonth]}
          tickFormatter={(v) => `${Math.round(v / 12)}`}
          ticks={ticks}
          tick={{ fill: '#0f172a', fontSize: 11 }}
          tickLine={false}
          label={{
            value: 'Time (years)',
            position: 'bottom',
            offset: 2,
            style: { fill: '#0f172a', fontSize: 12 }
          }}
        />
        <YAxis
          tickFormatter={formatThousands}
          domain={[0, maxPrincipal]}
          tick={{ fill: '#0f172a', fontSize: 11 }}
          tickLine={false}
          label={{
            value: 'Balance ($)',
            angle: -90,
            position: 'insideLeft',
            offset: 10,
            style: { fill: '#0f172a', fontSize: 12 },
            dx: 4
          }}
        />
        <Tooltip content={<BalanceTooltip />} />
        <Area
          type="monotone"
          dataKey="principalArea"
          name="Principal remaining"
          stroke="#60a5fa"
          fill="rgba(37, 99, 235, 0.25)"
          stackId="1"
        />
        <Area
          type="monotone"
          dataKey="interestArea"
          name="Interest share of repayments"
          stroke="#fb923c"
          fill="rgba(249, 115, 22, 0.24)"
          stackId="1"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

interface ExtraRepaymentRow {
  id: number;
  frequency: ExtraRepaymentFrequency;
  startMonth: number;
  endMonth: number;
  amount: string;
  intervalMonths?: number;
  type: ExtraRepaymentType;
}

interface RateChangeRow {
  id: number;
  startMonth: number;
  newRate: string;
}

const RepaymentsView = () => {
  const [input, setInput] = useState(defaultInput);
  const [showDetails, setShowDetails] = useState(false);
  const [extraRepayments, setExtraRepayments] = useState<ExtraRepaymentRow[]>([]);
  const [rateChanges, setRateChanges] = useState<RateChangeRow[]>([]);

  const summary = useMemo(() => {
    // Convert UI state to calc-engine rules
    const rules: ExtraRepaymentRule[] = extraRepayments
      .filter(row => row.amount && Number(row.amount.replace(/[^0-9]/g, '')) > 0)
      .map(row => ({
        frequency: row.frequency,
        startMonth: row.startMonth,
        endMonth: row.frequency === 'one-off' ? undefined : row.endMonth,
        amount: Number(row.amount.replace(/[^0-9]/g, '')),
        intervalMonths: row.intervalMonths,
        type: row.type
      }));

    // Convert rate changes
    const rateChangeRules: RateChange[] = rateChanges
      .filter(row => row.newRate && Number(row.newRate) > 0)
      .map(row => ({
        startMonth: row.startMonth,
        newRate: Number(row.newRate)
      }))
      .sort((a, b) => a.startMonth - b.startMonth);

    return calculateLoanSchedule({
      ...input,
      extraRepaymentRules: rules.length > 0 ? rules : undefined,
      rateChanges: rateChangeRules.length > 0 ? rateChangeRules : undefined
    });
  }, [input, extraRepayments, rateChanges]);

  const baselineSummary = useMemo(() => calculateLoanSchedule(input), [input]);

  const activeFrequencyLabel = frequencyOptions.find((option) => option.id === input.frequency)?.label ?? 'Repayment';
  const activeFrequencySuffix = frequencySuffix[input.frequency];

  const updateField = <K extends keyof LoanInput>(key: K, value: LoanInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <section className="pb-8">
      <header className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs uppercase tracking-wide text-slate-500" htmlFor="amount">
            Loan amount
          </label>
          <p className="text-xs uppercase tracking-wide text-slate-500">Repayment</p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-[0.45] min-w-[140px]">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-lg font-semibold text-slate-400">$</span>
            <input
              id="amount"
              name="amount"
              type="text"
              inputMode="numeric"
              value={formatAmount(input.amount)}
              onKeyDown={(event) => {
                if (!/[0-9]/.test(event.key) && event.key !== 'Backspace' && event.key !== 'Delete' && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Tab') {
                  event.preventDefault();
                }
              }}
              onChange={(event) => {
                const cleaned = event.target.value.replace(/[^0-9]/g, '');
                const numeric = Number(cleaned || 0);
                updateField('amount', numeric);
              }}
              className="w-full rounded-2xl border border-slate-200 pl-8 pr-2 py-1.5 text-lg font-semibold"
            />
          </div>
          <p className="text-lg font-semibold text-secondary">
            {currency(baselineSummary.repayment)}{activeFrequencySuffix ? `/${activeFrequencySuffix}` : ''}
          </p>
        </div>
      </header>

      <div className="grid gap-4 rounded-2xl bg-white p-4 shadow-sm">

        <div className="flex gap-2 text-xs font-medium">
          {typeOptions.map((option) => (
            <label key={option.id} className="flex-1">
              <input
                type="radio"
                name="type"
                value={option.id}
                checked={input.type === option.id}
                onChange={() => updateField('type', option.id)}
                hidden
              />
              <div className={`rounded-full border px-3 py-2 text-center ${input.type === option.id ? 'bg-secondary text-white border-secondary' : 'border-slate-200'}`}>
                {option.label}
              </div>
            </label>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs uppercase tracking-wide text-slate-500" htmlFor="rate">
              Interest rate %
            </label>
            <input
              id="rate"
              name="rate"
              type="number"
              step="0.01"
              value={input.annualInterestRate}
              onChange={(event) => updateField('annualInterestRate', Number(event.target.value))}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-base font-semibold"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs uppercase tracking-wide text-slate-500" htmlFor="years">
              Term (years)
            </label>
            <input
              id="years"
              name="years"
              type="number"
              value={input.years}
              onChange={(event) => updateField('years', Number(event.target.value))}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-base font-semibold"
            />
          </div>
        </div>

        <div className="flex gap-2 text-xs font-medium">
          {frequencyOptions.map((option) => (
            <label key={option.id} className="flex-1">
              <input
                type="radio"
                name="frequency"
                value={option.id}
                checked={input.frequency === option.id}
                onChange={() => updateField('frequency', option.id)}
                hidden
              />
              <div className={`rounded-full border px-3 py-2 text-center ${input.frequency === option.id ? 'bg-primary text-white border-primary' : 'border-slate-200'}`}>
                {option.label}
              </div>
            </label>
          ))}
        </div>
      </div>

      {summary.schedule.length > 0 && (
        <div className="mt-4 rounded-2xl bg-white px-4 py-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Loan balance over time
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            Key insight: repayment split between interest and principal over loan lifetime
          </p>
          <BalanceChart
            schedule={summary.schedule}
            frequency={input.frequency}
            initialAmount={input.amount}
            overlaySchedule={extraRepayments.length > 0 && extraRepayments.some(r => r.amount && Number(r.amount.replace(/[^0-9]/g, '')) > 0) ? baselineSummary.schedule : undefined}
          />

          <div className="mt-2 pt-6 border-t border-slate-200">
            <button
              type="button"
              className="flex w-full items-center justify-between text-left"
              onClick={() => setShowDetails(!showDetails)}
            >
              <span className="text-base font-semibold text-slate-700">Repayments & Rate changes</span>
              <span className="text-xl text-slate-700">{showDetails ? '−' : '+'}</span>
            </button>
            {showDetails && (
              <div className="mt-4 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="pl-4 text-sm font-semibold text-slate-900">Additional repayments</h4>
                  <button
                    type="button"
                    onClick={() =>
                      setExtraRepayments((rows) => [
                        ...rows,
                        {
                          id: rows.length ? rows[rows.length - 1].id + 1 : 1,
                          frequency: 'monthly',
                          startMonth: 0,
                          endMonth: 0,
                          amount: '',
                          intervalMonths: 1,
                          type: 'deposit'
                        }
                      ])
                    }
                    className="px-4 py-2 text-sm font-medium rounded-full border border-slate-300 bg-white hover:bg-slate-50"
                  >
                    Add
                  </button>
                </div>

                {extraRepayments.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-2xl border border-slate-200 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-semibold text-slate-900">Repayment frequency</span>
                      <button
                        type="button"
                        onClick={() =>
                          setExtraRepayments((rows) =>
                            rows.filter((r) => r.id !== row.id)
                          )
                        }
                        className="text-sm text-slate-500 hover:text-slate-700"
                      >
                        Remove
                      </button>
                    </div>

                    <div>
                      <select
                        value={row.frequency}
                        onChange={(e) =>
                          setExtraRepayments((rows) =>
                            rows.map((r) =>
                              r.id === row.id
                                ? { ...r, frequency: e.target.value as ExtraRepaymentFrequency }
                                : r
                            )
                          )
                        }
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-base font-medium"
                      >
                        <option value="one-off">One-off</option>
                        <option value="weekly">Weekly</option>
                        <option value="fortnightly">Fortnightly</option>
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                        <option value="custom">Custom (months)</option>
                      </select>
                    </div>

                    {row.frequency === 'one-off' && (
                      <div>
                        <label className="text-sm font-medium text-slate-900 mb-1.5 block">
                          Type
                        </label>
                        <div className="flex gap-2 text-xs font-medium">
                          <button
                            type="button"
                            onClick={() =>
                              setExtraRepayments((rows) =>
                                rows.map((r) =>
                                  r.id === row.id ? { ...r, type: 'deposit' } : r
                                )
                              )
                            }
                            className={`flex-1 rounded-full border px-3 py-2 text-center ${
                              row.type === 'deposit'
                                ? 'bg-secondary text-white border-secondary'
                                : 'border-slate-200'
                            }`}
                          >
                            Deposit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setExtraRepayments((rows) =>
                                rows.map((r) =>
                                  r.id === row.id ? { ...r, type: 'withdraw' } : r
                                )
                              )
                            }
                            className={`flex-1 rounded-full border px-3 py-2 text-center ${
                              row.type === 'withdraw'
                                ? 'bg-secondary text-white border-secondary'
                                : 'border-slate-200'
                            }`}
                          >
                            Withdraw
                          </button>
                        </div>
                      </div>
                    )}

                    <div className={`grid gap-3 ${row.frequency === 'one-off' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      <div>
                        <label className="text-sm font-medium text-slate-900 mb-1.5 block">
                          Start month
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={row.startMonth}
                          onChange={(e) =>
                            setExtraRepayments((rows) =>
                              rows.map((r) =>
                                r.id === row.id
                                  ? { ...r, startMonth: Number(e.target.value) }
                                  : r
                              )
                            )
                          }
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-base"
                        />
                      </div>
                      {row.frequency !== 'one-off' && (
                        <div>
                          <label className="text-sm font-medium text-slate-900 mb-1.5 block">
                            Finish month
                          </label>
                          <input
                            type="number"
                            min={row.startMonth}
                            step="1"
                            value={row.endMonth}
                            onChange={(e) =>
                              setExtraRepayments((rows) =>
                                rows.map((r) =>
                                  r.id === row.id
                                    ? { ...r, endMonth: Number(e.target.value) }
                                    : r
                                )
                              )
                            }
                            className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-base"
                          />
                        </div>
                      )}
                    </div>

                    {row.frequency === 'custom' && (
                      <div>
                        <label className="text-sm font-medium text-slate-900 mb-1.5 block">
                          Repeat every (months)
                        </label>
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={row.intervalMonths ?? 1}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setExtraRepayments((rows) =>
                              rows.map((r) =>
                                r.id === row.id
                                  ? { ...r, intervalMonths: isNaN(value) ? 1 : Math.round(value * 10) / 10 }
                                  : r
                              )
                            );
                          }}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-base"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-slate-900 mb-1.5 block">
                        Amount
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base font-semibold text-slate-400">$</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={row.amount}
                          onKeyDown={(event) => {
                            if (!/[0-9]/.test(event.key) && event.key !== 'Backspace' && event.key !== 'Delete' && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Tab') {
                              event.preventDefault();
                            }
                          }}
                          onChange={(event) => {
                            const cleaned = event.target.value.replace(/[^0-9]/g, '');
                            const numeric = Number(cleaned || 0);
                            setExtraRepayments((rows) =>
                              rows.map((r) =>
                                r.id === row.id
                                  ? { ...r, amount: cleaned ? new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 }).format(numeric) : '' }
                                  : r
                              )
                            );
                          }}
                          placeholder="0"
                          className="w-full rounded-2xl border border-slate-200 pl-8 pr-3 py-2.5 text-base"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <h4 className="pl-4 text-sm font-semibold text-slate-900">Interest rate change</h4>
                    <button
                      type="button"
                      onClick={() =>
                        setRateChanges((rows) => [
                          ...rows,
                          {
                            id: rows.length ? rows[rows.length - 1].id + 1 : 1,
                            startMonth: 0,
                            newRate: ''
                          }
                        ])
                      }
                      className="px-4 py-2 text-sm font-medium rounded-full border border-slate-300 bg-white hover:bg-slate-50"
                    >
                      Add
                    </button>
                  </div>

                  {rateChanges.map((row) => {
                    // Calculate new repayment for this rate change
                    const rateChangeRule: RateChange = {
                      startMonth: row.startMonth,
                      newRate: Number(row.newRate) || 0
                    };
                    const periodAtChange = Math.ceil(row.startMonth / 12 * periodsPerYear[input.frequency]);
                    const remainingPeriods = (input.years * periodsPerYear[input.frequency]) - periodAtChange;
                    const newRatePerPeriod = (Number(row.newRate) || 0) / 100 / periodsPerYear[input.frequency];

                    // Find balance at this point (simplified - using baseline for now)
                    const scheduleAtChange = baselineSummary.schedule[periodAtChange - 1];
                    const balanceAtChange = scheduleAtChange?.balance ?? input.amount;

                    const newRepayment = input.type === 'interest-only'
                      ? balanceAtChange * newRatePerPeriod
                      : newRatePerPeriod === 0
                        ? balanceAtChange / remainingPeriods
                        : (balanceAtChange * newRatePerPeriod) / (1 - Math.pow(1 + newRatePerPeriod, -remainingPeriods));

                    return (
                      <div
                        key={row.id}
                        className="rounded-2xl border border-slate-200 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-base font-semibold text-slate-900">Rate change</span>
                          <button
                            type="button"
                            onClick={() =>
                              setRateChanges((rows) =>
                                rows.filter((r) => r.id !== row.id)
                              )
                            }
                            className="text-sm text-slate-500 hover:text-slate-700"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium text-slate-900 mb-1.5 block">
                              Start month
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={row.startMonth}
                              onChange={(e) =>
                                setRateChanges((rows) =>
                                  rows.map((r) =>
                                    r.id === row.id
                                      ? { ...r, startMonth: Number(e.target.value) }
                                      : r
                                  )
                                )
                              }
                              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-base"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-slate-900 mb-1.5 block">
                              New rate (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={row.newRate}
                              onChange={(e) =>
                                setRateChanges((rows) =>
                                  rows.map((r) =>
                                    r.id === row.id
                                      ? { ...r, newRate: e.target.value }
                                      : r
                                  )
                                )
                              }
                              placeholder="0.00"
                              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-base"
                            />
                          </div>
                        </div>

                        {row.newRate && Number(row.newRate) > 0 && (
                          <div className="pt-2 border-t border-slate-200">
                            <p className="text-xs text-slate-500 mb-1">
                              Updated minimum {input.frequency} repayment
                            </p>
                            <p className="text-base font-semibold text-secondary">{currency(newRepayment)}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default RepaymentsView;
