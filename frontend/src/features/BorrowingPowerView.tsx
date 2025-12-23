import React from 'react';
import { CollapsibleContainer } from '../components/CollapsibleContainer';
import { ToggleGroup, ToggleOption } from '../components/ToggleGroup';
import { CurrencyInput, NumberInput } from '../components/inputs';
import { formatCurrency, toNumberOrZero } from '../lib/formatters';

type SimpleEntry = { id: string; label: string; amount: number };

interface BorrowingPowerViewProps {
  householdIncomeAnnual: number;
  incomeInputValue: number;
  onIncomeInputValueChange: (value: number) => void;
  incomeFrequency: 'weekly' | 'fortnightly' | 'monthly' | 'annual';
  onIncomeFrequencyChange: (value: 'weekly' | 'fortnightly' | 'monthly' | 'annual') => void;
  hemLivingExpensesMonthly: number;
  dependants: number;
  onDependantsChange: (value: number) => void;
  interestRate: number;
  onInterestRateChange: (value: number) => void;
  creditCards: SimpleEntry[];
  onAddCreditCard: () => void;
  onCreditCardUpdate: (id: string, data: Partial<SimpleEntry>) => void;
  onCreditCardRemove: (id: string) => void;
  hasHecs: boolean;
  onHasHecsChange: (value: boolean) => void;
  borrowingPower: number;
  borrowingPowerMeta: {
    incomeShadingFactor: number;
    assessmentRate: number;
    userRate: number;
    bufferPercent: number;
    termYears: number;
  };
}

export const BorrowingPowerView: React.FC<BorrowingPowerViewProps> = ({
  householdIncomeAnnual,
  incomeInputValue,
  onIncomeInputValueChange,
  incomeFrequency,
  onIncomeFrequencyChange,
  hemLivingExpensesMonthly,
  dependants,
  onDependantsChange,
  interestRate,
  onInterestRateChange,
  creditCards,
  onAddCreditCard,
  onCreditCardUpdate,
  onCreditCardRemove,
  hasHecs,
  onHasHecsChange,
  borrowingPower,
  borrowingPowerMeta,
}) => {
  const hecsOptions: ToggleOption<string>[] = [
    { value: 'no', label: 'No' },
    { value: 'yes', label: 'Yes' },
  ];

  const incomeFrequencyOptions: ToggleOption<'weekly' | 'fortnightly' | 'monthly' | 'annual'>[] = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'fortnightly', label: 'Fortnightly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'annual', label: 'Annual' },
  ];

  const incomeColumns: { key: 'weekly' | 'fortnightly' | 'monthly' | 'annual'; label: string }[] = [
    { key: 'weekly', label: 'Wk' },
    { key: 'fortnightly', label: 'F/N' },
    { key: 'monthly', label: 'Mth' },
    { key: 'annual', label: 'Yr' },
  ];

  const convertIncome = (freq: 'weekly' | 'fortnightly' | 'monthly' | 'annual') => {
    switch (freq) {
      case 'weekly':
        return householdIncomeAnnual / 52;
      case 'fortnightly':
        return householdIncomeAnnual / 26;
      case 'monthly':
        return householdIncomeAnnual / 12;
      default:
        return householdIncomeAnnual;
    }
  };

  const handleAmountChange = (
    update: (id: string, data: Partial<SimpleEntry>) => void,
    id: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const next = Math.max(0, toNumberOrZero(event.target.value));
    update(id, { amount: next });
  };

  const handleLabelChange = (
    update: (id: string, data: Partial<SimpleEntry>) => void,
    id: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    update(id, { label: event.target.value });
  };

  const renderDebtList = (
    title: string,
    entries: SimpleEntry[],
    onAdd: () => void,
    onChange: (id: string, data: Partial<SimpleEntry>) => void,
    onRemove: (id: string) => void,
    amountLabel: string
  ) => (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-dark-text">
        <span>{title}</span>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-full border border-brand-500 px-3 py-1 text-[11px] font-semibold text-brand-500"
        >
          Add
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-dark-muted">No debts added yet.</p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <div key={entry.id} className="rounded-2xl border border-slate-200 p-3 text-xs dark:border-dark-border">
              <div className="mb-2 flex items-center gap-3 font-semibold text-slate-600 dark:text-dark-text">
                <input
                  type="text"
                  value={entry.label}
                  placeholder={`${amountLabel} ${index + 1}`}
                  onChange={(event) => handleLabelChange(onChange, entry.id, event)}
                  className="w-full rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 focus:outline-none focus:ring dark:border-dark-border dark:bg-transparent dark:text-dark-text"
                />
                <button type="button" className="text-brand-500" onClick={() => onRemove(entry.id)}>
                  Remove
                </button>
              </div>
              <div className="flex items-center rounded-2xl border border-slate-200 px-3 py-2 font-semibold text-slate-800 focus-within:ring dark:border-dark-border dark:bg-transparent dark:text-white">
                <span className="mr-1 text-slate-400">$</span>
                <input
                  type="number"
                  min={0}
                  value={entry.amount}
                  onChange={(event) => handleAmountChange(onChange, entry.id, event)}
                  className="w-full bg-transparent focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-3 text-sm">
          <CurrencyInput
            label="Gross Income"
            value={incomeInputValue}
            onChange={onIncomeInputValueChange}
            className="block w-full"
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberInput
              label="Interest rate (%)"
              value={interestRate}
              onChange={onInterestRateChange}
              min={0}
              step={0.1}
            />
            <NumberInput
              label="Dependants"
              value={dependants}
              onChange={onDependantsChange}
              min={0}
            />
          </div>
        </div>
        <div className="flex justify-center">
          <ToggleGroup
            options={incomeFrequencyOptions}
            value={incomeFrequency}
            onChange={onIncomeFrequencyChange}
          />
        </div>
        <table className="w-full table-fixed text-left text-xs text-slate-600 dark:text-dark-text">
          <thead>
            <tr>
              {incomeColumns.map((column) => (
                <th key={`income-${column.key}`} className="pb-1">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {incomeColumns.map((column) => (
                <td key={`income-val-${column.key}`} className="py-1">
                  {formatCurrency(convertIncome(column.key))}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-dark-muted">
              HECS / HELP debt
            </p>
            <ToggleGroup
              options={hecsOptions}
              value={hasHecs ? 'yes' : 'no'}
              onChange={(val) => onHasHecsChange(val === 'yes')}
              size="sm"
            />
          </div>
          {renderDebtList(
            'Debts (JetSki, CreditCard, AfterPay)',
            creditCards,
            onAddCreditCard,
            onCreditCardUpdate,
            onCreditCardRemove,
            'Debt'
          )}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-slate-600 shadow-sm dark:border-dark-border dark:bg-dark-surfaceAlt dark:text-dark-text">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-dark-muted">
              Estimated borrowing power
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(borrowingPower)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-dark-muted">Indicative only</p>
          </div>
          <CollapsibleContainer title="Assumptions" collapsible accent="purple">
            <div className="space-y-3 text-sm text-slate-600 dark:text-dark-muted">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-slate-600 dark:border-dark-border dark:bg-dark-surfaceAlt dark:text-dark-text">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-dark-muted">
                  Living expenses (HEM)
                </p>
                <p className="text-lg font-semibold text-slate-800 dark:text-white">
                  {formatCurrency(hemLivingExpensesMonthly)} /month
                </p>
                <p className="text-xs text-slate-500 dark:text-dark-muted">Automatically adjusted for dependants</p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-slate-600 dark:border-dark-border dark:bg-dark-surfaceAlt dark:text-dark-text">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-dark-muted">
                  Debt assumption
                </p>
                <p className="text-sm text-slate-600 dark:text-dark-text">
                  All debts assume a 10% repayment rate calculated over 5 years. If specific details are
                  required please use the Detailed Calculator.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-slate-600 dark:border-dark-border dark:bg-dark-surfaceAlt dark:text-dark-text">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-dark-muted">
                  How we estimate borrowing power
                </p>
                <p className="text-sm text-slate-600 dark:text-dark-text">
                  We shade household income to {(borrowingPowerMeta.incomeShadingFactor * 100).toFixed(0)}%, subtract
                  HEM living expenses and the debt assumptions, then solve for the largest loan that can be
                  repaid over {borrowingPowerMeta.termYears} years at an assessment rate of
                  {` ${borrowingPowerMeta.assessmentRate.toFixed(2)}% (your ${borrowingPowerMeta.userRate.toFixed(2)}% rate + ${borrowingPowerMeta.bufferPercent}% buffer).`}
                </p>
              </div>
              <p className="text-xs text-slate-500 dark:text-dark-muted">
                Since this is just a simple calculator, treat these figures as indicative rather than actual borrowing outcomes.
              </p>
            </div>
          </CollapsibleContainer>
        </div>
      </div>
    </div>
  );
};
