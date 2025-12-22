import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  TooltipProps
} from 'recharts';
import { PeriodRow } from 'calc-engine';

/**
 * Repayment Charts Component
 *
 * Provides three chart visualizations for loan repayment schedules:
 * 1. RepaymentOverTimeChart - Area chart showing principal vs interest over time
 * 2. BalanceChart - Area chart showing balance reduction with optional baseline
 * 3. CumulativeInterestChart - Line chart showing cumulative interest paid
 *
 * Uses brand color palette from DESIGN_SYSTEM.md:
 * - brand-500 (#4A6FA5) - Principle (primary blue)
 * - Orange (#fb923c) - Interest
 * - Slate-600 (#475569) - Baseline/secondary
 *
 * @see DESIGN_SYSTEM.md - Color Palette section
 */

interface ChartProps {
  schedule: PeriodRow[];
  height?: number;
  overlaySchedule?: PeriodRow[];
}

interface MonthlyPoint {
  dateLabel: string;
  principal: number;
  interest: number;
  balance: number;
}

interface BalanceDatum {
  monthIndex: number;
  dateLabel: string;
  principalRemaining: number;
  interestArea: number;
  principalArea: number;
  repayment: number;
  interest: number;
  principal: number;
  baselinePrincipalRemaining?: number;
}

// Theme colors from design system
const COLORS = {
  principal: '#4A6FA5',      // brand-500
  principalFill: 'rgba(74, 111, 165, 0.25)', // brand-500 with 25% opacity
  interest: '#fb923c',        // orange-400
  interestFill: 'rgba(249, 115, 22, 0.24)', // orange-600 with 24% opacity
  baseline: '#64748b',        // slate-500
  text: '#475569',           // slate-600 (for light mode)
  textDark: '#cbd5e1',       // slate-300 (for dark mode - future)
} as const;

/**
 * Converts full schedule to monthly points for charting
 */
function toMonthlyPoints(schedule: PeriodRow[]): MonthlyPoint[] {
  return schedule.filter((row, index) => index % 1 === 0).map((row) => {
    const date = new Date(row.date);
    return {
      dateLabel: `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}`,
      principal: row.principalPaid,
      interest: row.interestCharged,
      balance: row.closingBalance
    };
  });
}

/**
 * Formats number as currency (AUD)
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Formats large numbers with 'k' suffix
 */
function formatThousands(value: number): string {
  if (value >= 1000) {
    return `${Math.round(value / 1000)}k`;
  }
  return `${Math.round(value)}`;
}

/**
 * Custom tooltip for balance chart
 * Matches design system glassmorphic card pattern
 */
const BalanceTooltip: React.FC<TooltipProps<number, string>> = ({
  active,
  payload,
}) => {
  if (!active || !payload || payload.length === 0) return null;

  const datum = payload[0].payload as BalanceDatum;
  const repayment = datum.repayment ?? 0;
  const interest = datum.interest ?? 0;
  const principal = datum.principal ?? 0;

  const months = datum.monthIndex ?? 0;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  const heading = years
    ? `${years} years ${remMonths} months`
    : `${remMonths} months`;

  const interestPct = repayment > 0 ? (interest / repayment) * 100 : 0;
  const principalPct = repayment > 0 ? (principal / repayment) * 100 : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-brand-25/95 p-3 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-brand-800/95">
      <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
        {heading}
      </div>

      <div className="mb-2">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Repayment amount
        </div>
        <div className="font-semibold text-slate-900 dark:text-white">
          {formatCurrency(repayment)} <span className="text-xs text-slate-500">(100%)</span>
        </div>
      </div>

      <div className="mb-1 text-sm" style={{ color: COLORS.interest }}>
        Interest:{' '}
        <span className="font-semibold">
          {formatCurrency(interest)}
        </span>{' '}
        <span className="text-xs text-slate-400">({Math.round(interestPct)}%)</span>
      </div>
      <div className="text-sm" style={{ color: COLORS.principal }}>
        Principle reduction:{' '}
        <span className="font-semibold">
          {formatCurrency(principal)}
        </span>{' '}
        <span className="text-xs text-slate-400">({Math.round(principalPct)}%)</span>
      </div>
    </div>
  );
};

/**
 * Repayment Over Time Chart
 *
 * Stacked area chart showing principal and interest components of repayments
 */
export const RepaymentOverTimeChart: React.FC<ChartProps> = ({
  schedule,
  height = 250
}) => {
  const data = useMemo(() => toMonthlyPoints(schedule), [schedule]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 40, left: 48 }}>
        <XAxis
          dataKey="dateLabel"
          hide={data.length > 40}
          tick={{ fill: COLORS.text }}
        />
        <YAxis
          tickFormatter={formatThousands}
          tick={{ fill: COLORS.text }}
          label={{
            value: 'Repayment amount ($)',
            angle: -90,
            position: 'left',
            offset: 0,
            dy: -30,
            dx: -10,
            style: { fill: COLORS.text }
          }}
        />
        <Tooltip formatter={(value: number) => formatCurrency(value)} />
        <Area
          type="monotone"
          dataKey="principal"
          stackId="1"
          stroke={COLORS.principal}
          fill={COLORS.principalFill}
          name="Principle"
        />
        <Area
          type="monotone"
          dataKey="interest"
          stackId="1"
          stroke={COLORS.interest}
          fill={COLORS.interestFill}
          name="Interest"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

/**
 * Balance Chart
 *
 * Shows principal remaining over time with optional baseline comparison
 * Areas represent the proportion of repayments going to principal vs interest
 */
export const BalanceChart: React.FC<ChartProps> = ({
  schedule,
  height = 250,
  overlaySchedule
}) => {
  const data = useMemo<BalanceDatum[]>(() => {
    if (schedule.length === 0) return [];

    const startDate = new Date(schedule[0].date);

    return schedule.map((row, index) => {
      const d = new Date(row.date);
      const monthsFromStart =
        (d.getFullYear() - startDate.getFullYear()) * 12 +
        (d.getMonth() - startDate.getMonth());

      const repayment = row.interestCharged + row.principalPaid;
      const interestShare =
        repayment > 0 ? row.interestCharged / repayment : 0;
      const principalShare = 1 - interestShare;

      const principalRemaining = row.closingBalance;
      const interestArea = principalRemaining * interestShare;
      const principalArea = principalRemaining * principalShare;

      const baselineRow = overlaySchedule && overlaySchedule[index];
      const baselinePrincipalRemaining = baselineRow?.closingBalance;

      return {
        monthIndex: monthsFromStart,
        dateLabel: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          '0'
        )}`,
        principalRemaining,
        interestArea,
        principalArea,
        repayment,
        interest: row.interestCharged,
        principal: row.principalPaid,
        baselinePrincipalRemaining
      };
    });
  }, [schedule, overlaySchedule]);

  const maxPrincipal = (schedule[0]?.openingBalance ?? 0) + 100000;
  const lastMonthIndex = data.length ? data[data.length - 1].monthIndex : 0;
  const maxMonth = lastMonthIndex + 12;

  // Choose X-axis ticks by years
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
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 40, left: 48 }}>
        <XAxis
          dataKey="monthIndex"
          type="number"
          domain={[0, maxMonth]}
          tickFormatter={(v) => `${Math.round(v / 12)}`}
          ticks={ticks}
          tick={{ fill: COLORS.text }}
          label={{
            value: 'Time (years)',
            position: 'bottom',
            offset: 10,
            style: { fill: COLORS.text }
          }}
        />
        <YAxis
          tickFormatter={formatThousands}
          domain={[0, maxPrincipal]}
          tick={{ fill: COLORS.text }}
          label={{
            value: 'Balance ($)',
            angle: -90,
            position: 'left',
            offset: 0,
            dy: -30,
            dx: -10,
            style: { fill: COLORS.text }
          }}
        />
        <Tooltip content={<BalanceTooltip />} />
        <Area
          type="monotone"
          dataKey="principalArea"
          name="Principle remaining"
          stroke={COLORS.principal}
          fill={COLORS.principalFill}
          stackId="1"
        />
        <Area
          type="monotone"
          dataKey="interestArea"
          name="Interest share of repayments"
          stroke={COLORS.interest}
          fill={COLORS.interestFill}
          stackId="1"
        />
        {data.some((d) => d.baselinePrincipalRemaining !== undefined) && (
          <Line
            type="monotone"
            dataKey="baselinePrincipalRemaining"
            name="Principle without extras"
            stroke={COLORS.baseline}
            dot={false}
            strokeDasharray="4 4"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
};

/**
 * Cumulative Interest Chart
 *
 * Line chart showing total interest paid over the life of the loan
 */
export const CumulativeInterestChart: React.FC<ChartProps> = ({
  schedule,
  height = 250
}) => {
  const data = useMemo(() => {
    let running = 0;
    return schedule.map((row) => {
      running += row.interestCharged;
      const date = new Date(row.date);
      return {
        dateLabel: `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, '0')}`,
        cumulativeInterest: running
      };
    });
  }, [schedule]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 24, left: 48 }}>
        <XAxis
          dataKey="dateLabel"
          hide={data.length > 40}
          tick={{ fill: COLORS.text }}
        />
        <YAxis
          tickFormatter={formatThousands}
          tick={{ fill: COLORS.text }}
        />
        <Tooltip formatter={(v: number) => formatCurrency(v)} />
        <Legend />
        <Line
          type="monotone"
          dataKey="cumulativeInterest"
          name="Cumulative interest"
          stroke={COLORS.interest}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
