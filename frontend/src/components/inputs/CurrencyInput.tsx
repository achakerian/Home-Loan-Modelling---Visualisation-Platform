import React from 'react';
import { formatNumber, toNumberOrZero, stripLeadingZeros } from '../../lib/formatters';

interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  id?: string;
  className?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  id,
  className = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/[^0-9]/g, '');
    const normalized = stripLeadingZeros(digitsOnly);
    let newValue = normalized === '' ? 0 : Number(normalized);

    if (min !== undefined && newValue < min) newValue = min;
    if (max !== undefined && newValue > max) newValue = max;

    onChange(newValue);
  };

  return (
    <label className={`text-xs font-semibold text-slate-500 dark:text-dark-muted ${className}`}>
      {label}
      <div className="mt-1 flex items-center rounded-2xl border border-slate-300 px-3 py-2 text-base font-semibold text-slate-800 focus-within:ring dark:border-dark-border dark:bg-transparent dark:text-white">
        <span className="mr-1 text-slate-400">$</span>
        <input
          id={id}
          type="text"
          value={formatNumber(value)}
          onChange={handleChange}
          className="w-full bg-transparent focus:outline-none"
        />
      </div>
    </label>
  );
};
