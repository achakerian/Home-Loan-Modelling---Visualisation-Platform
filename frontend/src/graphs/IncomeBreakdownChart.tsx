import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '../lib/formatters';

interface IncomeBreakdownChartProps {
  netPay: number;
  incomeTax: number;
  medicareLevy: number;
  helpHecs: number;
  medicareSurcharge?: number;
  salarySacrifice?: number;
  concessionalSuper?: number;
}

const COLORS = {
  netPay: 'rgba(147, 181, 225, 0.9)', // light blue
  salarySacrifice: 'rgba(167, 139, 250, 0.9)', // purple
  concessionalSuper: 'rgba(192, 132, 252, 0.9)', // light purple
  incomeTax: 'rgba(212, 181, 160, 0.9)', // peach/tan
  medicareLevy: 'rgba(249, 115, 22, 0.9)', // orange
  helpHecs: 'rgba(139, 115, 85, 0.9)', // brown
  medicareSurcharge: 'rgba(232, 168, 124, 0.9)', // light orange
};

export const IncomeBreakdownChart: React.FC<IncomeBreakdownChartProps> = ({
  netPay,
  incomeTax,
  medicareLevy,
  helpHecs,
  medicareSurcharge = 0,
  salarySacrifice = 0,
  concessionalSuper = 0,
}) => {
  const total = netPay + incomeTax + medicareLevy + helpHecs + medicareSurcharge + salarySacrifice + concessionalSuper;

  const data = [
    { name: 'Net pay', value: netPay, color: COLORS.netPay },
  ];

  if (salarySacrifice > 0) {
    data.push({
      name: 'Salary sacrifice',
      value: salarySacrifice,
      color: COLORS.salarySacrifice,
    });
  }

  if (concessionalSuper > 0) {
    data.push({
      name: 'Concessional super',
      value: concessionalSuper,
      color: COLORS.concessionalSuper,
    });
  }

  data.push(
    { name: 'Income tax', value: incomeTax, color: COLORS.incomeTax },
    { name: 'Medicare levy', value: medicareLevy, color: COLORS.medicareLevy }
  );

  if (medicareSurcharge > 0) {
    data.push({
      name: 'Medicare levy surcharge',
      value: medicareSurcharge,
      color: COLORS.medicareSurcharge,
    });
  }

  if (helpHecs > 0) {
    data.push({ name: 'HELP / HECS', value: helpHecs, color: COLORS.helpHecs });
  }


  // Calculate percentages that sum to exactly 100%
  const percentages = React.useMemo(() => {
    if (total === 0) return data.map(() => 0);

    // Calculate raw percentages
    const rawPercentages = data.map(item => (item.value / total) * 100);

    // Round to integers
    const roundedPercentages = rawPercentages.map(p => Math.round(p));

    // Calculate the difference from 100
    const sum = roundedPercentages.reduce((acc, p) => acc + p, 0);
    const diff = 100 - sum;

    // If there's a difference, adjust the largest segment
    if (diff !== 0) {
      // Find index of largest value
      const maxIndex = data.reduce((maxIdx, item, idx, arr) =>
        item.value > arr[maxIdx].value ? idx : maxIdx, 0
      );
      roundedPercentages[maxIndex] += diff;
    }

    return roundedPercentages;
  }, [data, total]);

  const formatPercent = (value: number, index?: number) => {
    if (index !== undefined && percentages[index] !== undefined) {
      return `${percentages[index]}%`;
    }
    const percent = (value / total) * 100;
    return `${percent.toFixed(0)}%`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      // Find the index of this data point
      const dataIndex = data.findIndex(item => item.name === payload[0].name);
      return (
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-dark-border dark:bg-dark-surface">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {payload[0].name}
          </p>
          <p className="text-sm text-slate-600 dark:text-dark-text">
            {formatCurrency(payload[0].value)} ({formatPercent(payload[0].value, dataIndex)})
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="mt-4 space-y-2">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-slate-700 dark:text-dark-text">{entry.value}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatCurrency(entry.payload.value)}
              </span>
              <span className="text-slate-500 dark:text-dark-muted">
                {formatPercent(entry.payload.value, index)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full overflow-hidden">
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} verticalAlign="bottom" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
