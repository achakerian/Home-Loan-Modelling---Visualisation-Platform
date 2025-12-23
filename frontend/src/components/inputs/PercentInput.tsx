import React from 'react';
import { toNumberOrZero } from '../../lib/formatters';

interface PercentInputProps {
  label: string;
  /** Value as a decimal (e.g., 0.5 for 50%) */
  value: number;
  /** Callback receives decimal value (e.g., 0.5 for 50%) */
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  id?: string;
  className?: string;
  /** If true, value is already a percentage (e.g., 50 instead of 0.5) */
  asPercentage?: boolean;
}

export const PercentInput: React.FC<PercentInputProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 0.05,
  id,
  className = '',
  asPercentage = false,
}) => {
  const displayValue = asPercentage ? value : value * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = toNumberOrZero(e.target.value);
    const clampedValue = Math.min(max, Math.max(min, numValue));
    const finalValue = asPercentage ? clampedValue : clampedValue / 100;
    onChange(finalValue);
  };

  return (
    <label className={`text-slate-500 ${className}`}>
      {label}
      <div className="mt-1 flex items-center rounded-2xl border border-slate-300 px-3 py-2 text-base font-semibold text-slate-800 focus-within:ring dark:border-dark-border dark:bg-transparent dark:text-white">
        <input
          id={id}
          type="number"
          value={displayValue.toFixed(asPercentage ? 2 : 0)}
          onChange={handleChange}
          step={step}
          className="w-full bg-transparent focus:outline-none"
        />
        <span className="ml-1 text-sm text-slate-400">%</span>
      </div>
    </label>
  );
};
