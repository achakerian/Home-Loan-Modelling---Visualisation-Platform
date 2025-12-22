import React from 'react';

export interface ToggleOption<T extends string> {
  label: string;
  value: T;
}

type ToggleGroupSize = 'sm' | 'md';

interface ToggleGroupProps<T extends string> {
  label?: string;
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: ToggleGroupSize;
}

const sizeConfig: Record<ToggleGroupSize, { padding: string; text: string }> = {
  sm: { padding: 'px-2.5 py-1', text: 'text-xs' },
  md: { padding: 'px-3 py-1.5', text: 'text-sm' },
};

export function ToggleGroup<T extends string>({ label, options, value, onChange, size = 'sm' }: ToggleGroupProps<T>) {
  const sizing = sizeConfig[size];

  return (
    <div className="flex flex-col items-center gap-2">
      {label && <p className="text-sm font-medium text-slate-500">{label}</p>}
      <div className="inline-flex items-center justify-center gap-1 rounded-2xl bg-slate-100 px-1 py-0.5 text-xs font-semibold dark:bg-brand-900/60">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full ${sizing.padding} ${sizing.text} transition ${
              value === option.value ? 'bg-brand-800 text-white' : 'text-slate-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
