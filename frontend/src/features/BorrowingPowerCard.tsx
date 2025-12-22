import React from 'react';
import { estimateBorrowingCapacity } from 'calc-engine';
import { BorrowingPowerView } from './BorrowingPowerView';

type SimpleDebtEntry = { id: string; label: string; amount: number };

const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const BorrowingPowerCard: React.FC = () => {
  const [incomeInputValue, setIncomeInputValue] = React.useState(160000);
  const [incomeFrequency, setIncomeFrequency] = React.useState<'weekly' | 'fortnightly' | 'monthly' | 'annual'>('annual');
  const [dependants, setDependants] = React.useState(0);
  const [creditCards, setCreditCards] = React.useState<SimpleDebtEntry[]>([]);
  const [hasHecs, setHasHecs] = React.useState(false);

  const DEFAULT_BASE_RATE = 6;
  const ASSESSMENT_BUFFER_PERCENT = 3;
  const DEFAULT_TERM_YEARS = 30;
  const INCOME_SHADING_FACTOR = 0.7;

  const incomeMultipliers: Record<'weekly' | 'fortnightly' | 'monthly' | 'annual', number> = {
    weekly: 52,
    fortnightly: 26,
    monthly: 12,
    annual: 1,
  };

  const householdIncome = incomeInputValue * incomeMultipliers[incomeFrequency];
  const hemLivingExpensesMonthly = React.useMemo(() => 2000 + dependants * 400, [dependants]);
  const creditCardLimits = React.useMemo(
    () => creditCards.reduce((sum, entry) => sum + (entry.amount || 0), 0),
    [creditCards]
  );
  const [interestRate, setInterestRate] = React.useState(DEFAULT_BASE_RATE);
  const assessmentRate = interestRate + ASSESSMENT_BUFFER_PERCENT;

  const borrowingEstimate = React.useMemo(() => {
    return estimateBorrowingCapacity({
      incomes: [{ amountAnnual: householdIncome, shadingFactor: INCOME_SHADING_FACTOR }],
      livingExpensesMonthly: hemLivingExpensesMonthly,
      dependants,
      creditCardLimits,
      personalLoans: [],
      carLoans: [],
      hasHECS: hasHecs,
      baseRate: assessmentRate,
      bufferRate: 0,
      termYears: DEFAULT_TERM_YEARS,
      repaymentType: 'principalAndInterest',
    });
  }, [
    householdIncome,
    hemLivingExpensesMonthly,
    dependants,
    creditCardLimits,
    hasHecs,
    assessmentRate,
  ]);

  const handleIncomeFrequencyChange = (next: typeof incomeFrequency) => {
    const annual = incomeInputValue * incomeMultipliers[incomeFrequency];
    const newValue = annual / incomeMultipliers[next];
    setIncomeFrequency(next);
    setIncomeInputValue(Number.isFinite(newValue) ? Math.round(newValue) : 0);
  };

  const handleAddCreditCard = () => {
    setCreditCards((prev) => [
      ...prev,
      { id: createId(), label: `Debt ${prev.length + 1}`, amount: 0 }
    ]);
  };

  const handleUpdateCreditCard = (id: string, data: Partial<SimpleDebtEntry>) => {
    setCreditCards((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...data } : entry)));
  };

  const handleRemoveCreditCard = (id: string) => {
    setCreditCards((prev) => prev.filter((entry) => entry.id !== id));
  };

  return (
    <BorrowingPowerView
      householdIncomeAnnual={householdIncome}
      incomeInputValue={incomeInputValue}
      onIncomeInputValueChange={setIncomeInputValue}
      incomeFrequency={incomeFrequency}
      onIncomeFrequencyChange={handleIncomeFrequencyChange}
      hemLivingExpensesMonthly={hemLivingExpensesMonthly}
      dependants={dependants}
      onDependantsChange={setDependants}
      creditCards={creditCards}
      onAddCreditCard={handleAddCreditCard}
      onCreditCardUpdate={handleUpdateCreditCard}
      onCreditCardRemove={handleRemoveCreditCard}
      hasHecs={hasHecs}
      onHasHecsChange={setHasHecs}
      borrowingPower={borrowingEstimate.maxBorrowing}
      borrowingPowerMeta={{
        incomeShadingFactor: INCOME_SHADING_FACTOR,
        assessmentRate,
        userRate: interestRate,
        bufferPercent: ASSESSMENT_BUFFER_PERCENT,
        termYears: DEFAULT_TERM_YEARS,
      }}
      interestRate={interestRate}
      onInterestRateChange={setInterestRate}
    />
  );
};
