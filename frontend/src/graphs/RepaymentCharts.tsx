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
import { formatCurrency, formatThousands } from '../lib/formatters';

interface ChartProps {
  schedule: PeriodRow[];
  height?: number;
  overlaySchedule?: PeriodRow[];
}

function toMonthlyPoints(schedule: PeriodRow[]) {
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

export const RepaymentOverTimeChart: React.FC<ChartProps> = ({ schedule, height }) => {
  const data = useMemo(() => toMonthlyPoints(schedule), [schedule]);
  const chartHeight = height ?? 250;

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 40, left: 48 }}>
        <XAxis
          dataKey="dateLabel"
          hide={data.length > 40}
          tick={{ fill: 'var(--text-main)' }}
        />
        <YAxis
          tickFormatter={(v) => formatThousands(v)}
          tick={{ fill: 'var(--text-main)' }}
          label={{
            value: 'Repayment amount ($)',
            angle: -90,
            position: 'left',
            offset: 0,
            dy: -30,
            dx: -10,
            style: { fill: 'var(--text-main)' }
          }}
        />
        <Tooltip formatter={(value: number) => formatCurrency(value as number)} />
        <Area
          type="monotone"
          dataKey="principal"
          stackId="1"
          stroke="#9cc4ff"
          fill="rgba(156, 196, 255, 0.35)"
          name="Principle"
        />
        <Area
          type="monotone"
          dataKey="interest"
          stackId="1"
          stroke="#ffc69a"
          fill="rgba(255, 198, 154, 0.32)"
          name="Interest"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const BalanceChart: React.FC<ChartProps> = ({ schedule, height, overlaySchedule }) => {
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

  // Choose X-axis ticks by years rather than raw months
  const maxYear = Math.ceil(maxMonth / 12);
  const yearStep = 5;
  const ticks: number[] = [];
  for (let year = 0; year <= maxYear; year += yearStep) {
    ticks.push(year * 12);
  }

  const chartHeight = height ?? 250;

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 40, left: 0 }}>
        <XAxis
          dataKey="monthIndex"
          type="number"
          domain={[0, maxMonth]}
          tickFormatter={(v) => `${Math.round(v / 12)}`}
          ticks={ticks}
          tick={{ fill: 'var(--text-main)', fontSize: 10 }}
          label={{
            value: 'Time (years)',
            position: 'bottom',
            offset: 0,
            style: { fill: 'var(--text-main)', fontSize: 10 }
          }}
        />
        <YAxis
          tickFormatter={(v) => formatThousands(v)}
          domain={[0, maxPrincipal]}
          tick={{ fill: 'var(--text-main)', angle: -45, textAnchor: 'end', fontSize: 10 }}
          width={50}
          label={{
            value: 'Balance ($)',
            angle: -90,
            position: 'left',
            offset: -10,
            style: { fill: 'var(--text-main)', fontSize: 10 }
          }}
        />
        <Tooltip content={<BalanceTooltip />} />
        <Area
          type="monotone"
          dataKey="principalArea"
          name="Principle remaining"
          stroke="#9cc4ff"
          fill="rgba(156, 196, 255, 0.35)"
          stackId="1"
        />
        <Area
          type="monotone"
          dataKey="interestArea"
          name="Interest share of repayments"
          stroke="#ffc69a"
          fill="rgba(255, 198, 154, 0.32)"
          stackId="1"
        />
        {data.some((d) => d.baselinePrincipalRemaining !== undefined) && (
          <Line
            type="monotone"
            dataKey="baselinePrincipalRemaining"
            name="Principle without extras"
            stroke="#c7d2fe"
            dot={false}
            strokeDasharray="4 4"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
};

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

const BalanceTooltip: React.FC<TooltipProps<number, string>> = ({
  active,
  payload,
  label
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
    <div
      style={{
        background: '#f9fafb',
        borderRadius: 8,
        padding: '0.6rem 0.9rem',
        boxShadow: '0 6px 18px rgba(15,23,42,0.25)',
        fontSize: '0.85rem',
        maxWidth: 260
      }}
    >
      <div
        style={{
          fontWeight: 600,
          marginBottom: 6,
          color: '#111827'
        }}
      >
        {heading}
      </div>

      <div style={{ marginBottom: 6 }}>
        <div
          style={{
            fontSize: '0.8rem',
            color: '#6b7280',
            marginBottom: 2
          }}
        >
          Repayment amount
        </div>
        <div style={{ fontWeight: 600, color: '#111827' }}>
          {formatCurrency(repayment)} (100%)
        </div>
      </div>

      <div style={{ marginBottom: 2, color: '#ffc69a' }}>
        Interest:{' '}
        <span style={{ fontWeight: 600 }}>
          {formatCurrency(interest)}
        </span>{' '}
        <span style={{ color: '#9ca3af' }}>({Math.round(interestPct)}%)</span>
      </div>
      <div style={{ color: '#9cc4ff' }}>
        Principle reduction:{' '}
        <span style={{ fontWeight: 600 }}>
          {formatCurrency(principal)}
        </span>{' '}
        <span style={{ color: '#9ca3af' }}>({Math.round(principalPct)}%)</span>
      </div>
    </div>
  );
};

export const CumulativeInterestChart: React.FC<ChartProps> = ({ schedule }) => {
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
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 24, left: 48 }}>
        <XAxis
          dataKey="dateLabel"
          hide={data.length > 40}
          tick={{ fill: 'var(--text-main)' }}
        />
        <YAxis
          tickFormatter={(v) => formatThousands(v)}
          tick={{ fill: 'var(--text-main)' }}
        />
        <Tooltip formatter={(v: number) => formatCurrency(v)} />
        <Legend />
        <Line
          type="monotone"
          dataKey="cumulativeInterest"
          name="Cumulative interest"
          stroke="#f97316"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
