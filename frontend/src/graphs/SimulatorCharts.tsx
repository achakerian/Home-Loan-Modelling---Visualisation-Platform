import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { PeriodRow } from 'calc-engine';
import { formatCurrency, formatThousands } from '../lib/formatters';

interface ChartProps {
  schedule: PeriodRow[];
}

export const OffsetEffectChart: React.FC<ChartProps> = ({ schedule }) => {
  const data = useMemo(
    () =>
      schedule.map((row) => {
        const date = new Date(row.date);
        const effectiveBalance = Math.max(0, row.closingBalance - row.offsetBalance);
        return {
          dateLabel: `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, '0')}`,
          balance: row.closingBalance,
          effectiveBalance
        };
      }),
    [schedule]
  );

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <XAxis dataKey="dateLabel" hide={data.length > 40} />
        <YAxis tickFormatter={(v) => formatThousands(v)} />
        <Tooltip formatter={(v: number) => formatCurrency(v)} />
        <Legend />
        <Line
          type="monotone"
          dataKey="balance"
          name="Actual balance"
          stroke="#2563eb"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="effectiveBalance"
          name="Effective balance (after offset)"
          stroke="#16a34a"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const ExtraRepaymentsChart: React.FC<ChartProps> = ({ schedule }) => {
  const data = useMemo(
    () =>
      schedule.map((row) => {
        const date = new Date(row.date);
        return {
          dateLabel: `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, '0')}`,
          extra: row.extraRepayment,
          balance: row.closingBalance
        };
      }),
    [schedule]
  );

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <XAxis dataKey="dateLabel" hide={data.length > 40} />
        <YAxis yAxisId="left" tickFormatter={(v) => formatThousands(v)} />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={(v) => formatThousands(v)}
        />
        <Tooltip formatter={(v: number) => formatCurrency(v)} />
        <Legend />
        <Bar
          yAxisId="left"
          dataKey="extra"
          name="Extra repayments"
          fill="#22c55e"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="balance"
          name="Remaining balance"
          stroke="#2563eb"
          dot={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

