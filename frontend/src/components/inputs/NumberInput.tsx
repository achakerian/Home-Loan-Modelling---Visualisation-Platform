import React from 'react';
import { toNumberOrZero } from '../../lib/formatters';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  id?: string;
  className?: string;
  suffix?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  id,
  className = '',
  suffix,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = toNumberOrZero(e.target.value);

    if (min !== undefined && newValue < min) newValue = min;
    if (max !== undefined && newValue > max) newValue = max;

    onChange(newValue);
  };

  return (
    <label className={`text-xs font-semibold text-slate-500 dark:text-dark-muted ${className}`}>
      {label}
      {suffix ? (
        <div className="mt-1 flex items-center rounded-2xl border border-slate-300 px-3 py-2 text-base font-semibold text-slate-800 focus-within:ring dark:border-dark-border dark:bg-transparent dark:text-white">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            value={value}
            onChange={handleChange}
            min={min}
            max={max}
            step={step}
            className="w-full bg-transparent text-right focus:outline-none"
          />
          <span className="ml-1 text-sm text-slate-400">{suffix}</span>
        </div>
      ) : (
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2 text-base font-semibold text-slate-800 focus:outline-none dark:border-dark-border dark:bg-transparent dark:text-white"
        />
      )}
    </label>
  );
};
