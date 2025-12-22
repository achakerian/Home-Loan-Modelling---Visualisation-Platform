import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { formatCurrency, formatThousands } from '../lib/formatters';

interface CapacityChartProps {
  points: { rate: number; capacity: number }[];
}

export const CapacityChart: React.FC<CapacityChartProps> = ({ points }) => {
  const data = points.map((p) => ({
    rateLabel: `${p.rate.toFixed(1)}%`,
    capacity: p.capacity
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <XAxis dataKey="rateLabel" />
        <YAxis tickFormatter={(v) => formatThousands(v)} />
        <Tooltip formatter={(v: number) => formatCurrency(v)} />
        <Line
          type="monotone"
          dataKey="capacity"
          stroke="#2563eb"
          dot
          name="Capacity"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

