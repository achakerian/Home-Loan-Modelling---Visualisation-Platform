import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  /** Optional smaller secondary text */
  subtitle?: string;
  /** Optional accent color */
  variant?: 'default' | 'primary' | 'success' | 'warning';
  /** Size of the value text */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles = {
  default: 'border-slate-200 dark:border-dark-border',
  primary: 'border-brand-200 dark:border-brand-700',
  success: 'border-green-200 dark:border-green-700',
  warning: 'border-amber-200 dark:border-amber-700',
};

const variantTextStyles = {
  default: 'text-slate-900 dark:text-white',
  primary: 'text-brand-700 dark:text-brand-300',
  success: 'text-green-700 dark:text-green-300',
  warning: 'text-amber-700 dark:text-amber-300',
};

const sizeStyles = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl border p-3 text-center ${variantStyles[variant]} ${className}`}
    >
      <p className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-dark-text0">
        {label}
      </p>
      <p className={`mt-1 font-bold ${sizeStyles[size]} ${variantTextStyles[variant]}`}>
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 dark:text-dark-muted">{subtitle}</p>
      )}
    </div>
  );
};
