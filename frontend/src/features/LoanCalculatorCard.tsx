import React from 'react';
import { generateAmortisation, PeriodRow } from 'calc-engine';
import {
  LoanCalculatorView,
  RepaymentFrequency,
  BreakdownView,
  AdditionalRepayment,
  RateChange,
  RatePaymentSummary,
} from './LoanCalculatorView';

export const LoanCalculatorCard: React.FC = () => {
  const [loanAmount, setLoanAmount] = React.useState(650000);
  const [frequency, setFrequency] = React.useState<RepaymentFrequency>('monthly');
  const [interestRate, setInterestRate] = React.useState(5.85);
  const [termYears, setTermYears] = React.useState(30);
  const [repaymentType, setRepaymentType] = React.useState<'principal' | 'interestOnly'>('principal');
  const [breakdownView, setBreakdownView] = React.useState<BreakdownView>('monthly');
  const [additionalRepayments, setAdditionalRepayments] = React.useState<AdditionalRepayment[]>([]);
  const [rateChanges, setRateChanges] = React.useState<RateChange[]>([]);

  const createId = () =>
    (globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);

  const result = React.useMemo(() => {
    return generateAmortisation({
      amount: loanAmount,
      annualRate: interestRate,
      years: termYears,
      frequency,
      repaymentType: repaymentType === 'principal' ? 'principalAndInterest' : 'interestOnly',
      repaymentStrategy: 'reduceTerm',
      startDate: new Date().toISOString().slice(0, 10),
    });
  }, [loanAmount, interestRate, termYears, frequency, repaymentType]);

  const periodsPerYear = frequency === 'weekly' ? 52 : frequency === 'fortnightly' ? 26 : 12;
  const repaymentPerPeriod =
    repaymentType === 'interestOnly'
      ? (loanAmount * (interestRate / 100)) / periodsPerYear
      : result.summary.regularPayment;

  const adjustedData = React.useMemo(() => {
    const months = termYears * 12;
    const basePeriodsPerYear = periodsPerYear;
    const startDate = new Date();
    let balance = loanAmount;
    const rows: PeriodRow[] = [];
    const payments: RatePaymentSummary[] = [];

    const frequencyToFactor = (freq: RepaymentFrequency) =>
      freq === 'weekly' ? 52 / 12 : freq === 'fortnightly' ? 26 / 12 : 1;

    const calculateExtraRepaymentForMonth = (entry: AdditionalRepayment, month: number) => {
      if (entry.frequency === 'oneOff') {
        return month === entry.startMonth ? entry.amount : 0;
      }

      if (entry.frequency === 'customMonths') {
        if (month < entry.startMonth) return 0;
        if (month > entry.endMonth) return 0;
        const interval = entry.intervalMonths && entry.intervalMonths > 0 ? entry.intervalMonths : 1;
        const offset = month - entry.startMonth;
        return offset % interval === 0 ? entry.amount : 0;
      }

      const withinWindow = month >= entry.startMonth && month <= entry.endMonth;
      if (!withinWindow) return 0;

      if (entry.frequency === 'weekly' || entry.frequency === 'fortnightly' || entry.frequency === 'monthly') {
        return entry.amount * frequencyToFactor(entry.frequency);
      }

      return 0;
    };

    const calcMonthlyPayment = (principal: number, annualRate: number, monthsRemaining: number) => {
      const monthlyRate = (annualRate / 100) / 12;
      if (repaymentType === 'interestOnly') {
        return principal * monthlyRate;
      }
      if (monthlyRate === 0) {
        return monthsRemaining > 0 ? principal / monthsRemaining : principal;
      }
      if (monthsRemaining <= 0) {
        return principal;
      }
      const pow = Math.pow(1 + monthlyRate, monthsRemaining);
      return principal * (monthlyRate * pow) / (pow - 1);
    };

    const sortedRateChanges = [...rateChanges].sort((a, b) => a.startMonth - b.startMonth);
    let currentRate = interestRate;
    let monthsRemaining = months;
    let monthlyPayment = calcMonthlyPayment(balance, currentRate, monthsRemaining);
    payments.push({
      id: 'initial',
      label: 'Current rate',
      startMonth: 0,
      payment: monthlyPayment,
      rate: currentRate,
    });

    let changeIndex = 0;

    for (let month = 0; month < months && balance > 0.01; month++) {
      monthsRemaining = months - month;
      if (changeIndex < sortedRateChanges.length && month === sortedRateChanges[changeIndex].startMonth) {
        currentRate = sortedRateChanges[changeIndex].newRate;
        monthlyPayment = calcMonthlyPayment(balance, currentRate, monthsRemaining);
        payments.push({
          id: sortedRateChanges[changeIndex].id,
          label: `Rate change`,
          startMonth: month,
          payment: monthlyPayment,
          rate: currentRate,
        });
        changeIndex++;
      }
      const monthlyRate = (currentRate / 100) / 12;

      const interest = balance * monthlyRate;
      const basePrincipal = repaymentType === 'interestOnly' ? 0 : Math.max(monthlyPayment - interest, 0);
      const extraPrincipal = additionalRepayments.reduce(
        (sum, entry) => sum + calculateExtraRepaymentForMonth(entry, month),
        0
      );

      const principalPaid = (repaymentType === 'interestOnly' ? 0 : basePrincipal) + extraPrincipal;
      const closingBalance = Math.max(balance - principalPaid, 0);

      const date = new Date(startDate.getFullYear(), startDate.getMonth() + month, startDate.getDate());
      rows.push({
        periodIndex: month,
        date: date.toISOString(),
        openingBalance: balance,
        closingBalance,
        principalPaid,
        interestCharged: interest,
        payment: principalPaid + interest,
      } as PeriodRow);

      balance = closingBalance;
      if (balance <= 0) break;
    }

    return { schedule: rows, payments };
  }, [
    additionalRepayments,
    interestRate,
    loanAmount,
    periodsPerYear,
    rateChanges,
    repaymentPerPeriod,
    repaymentType,
    termYears,
  ]);
  const adjustedSchedule = adjustedData.schedule;
  const ratePaymentSummaries = adjustedData.payments;

  const payoffDateOriginal = result.summary.payoffDate;
  const payoffDateUpdated = adjustedSchedule.length
    ? adjustedSchedule[adjustedSchedule.length - 1].date
    : payoffDateOriginal;

  const formatCompletionLabel = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleString('en-AU', { month: 'short', year: 'numeric' });
  };

  const originalCompletionDateLabel = formatCompletionLabel(payoffDateOriginal);
  const updatedCompletionDateLabel = formatCompletionLabel(payoffDateUpdated);

  const handleAmountChange = (value: number) => {
    setLoanAmount(value);
  };

  const handleAddAdditional = () => {
    setAdditionalRepayments((prev) => [
      ...prev,
      {
        id: createId(),
        frequency: 'monthly',
        startMonth: 0,
        endMonth: 0,
        amount: 0,
        intervalMonths: 1,
      },
    ]);
  };

  const handleUpdateAdditional = (id: string, data: Partial<AdditionalRepayment>) => {
    setAdditionalRepayments((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...data } : entry))
    );
  };

  const handleRemoveAdditional = (id: string) => {
    setAdditionalRepayments((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleAddRateChange = () => {
    setRateChanges((prev) => [
      ...prev,
      {
        id: createId(),
        startMonth: 0,
        newRate: interestRate,
      },
    ]);
  };

  const handleUpdateRateChange = (id: string, update: Partial<RateChange>) => {
    setRateChanges((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...update } : entry)));
  };

  const handleRemoveRateChange = (id: string) => {
    setRateChanges((prev) => prev.filter((entry) => entry.id !== id));
  };

  return (
    <LoanCalculatorView
      loanAmount={loanAmount}
      frequency={frequency}
      interestRate={interestRate}
      termYears={termYears}
      repaymentType={repaymentType}
      breakdownView={breakdownView}
      repaymentPerPeriod={repaymentPerPeriod}
      schedule={adjustedSchedule}
      onLoanAmountChange={handleAmountChange}
      onFrequencyChange={setFrequency}
      onInterestRateChange={setInterestRate}
      onTermYearsChange={setTermYears}
      onRepaymentTypeChange={setRepaymentType}
      onBreakdownViewChange={setBreakdownView}
      additionalRepayments={additionalRepayments}
      onAddAdditional={handleAddAdditional}
      onUpdateAdditional={handleUpdateAdditional}
      onRemoveAdditional={handleRemoveAdditional}
      rateChanges={rateChanges}
      onAddRateChange={handleAddRateChange}
      onUpdateRateChange={handleUpdateRateChange}
      onRemoveRateChange={handleRemoveRateChange}
      ratePaymentSummaries={ratePaymentSummaries}
      originalCompletionDateLabel={originalCompletionDateLabel}
      updatedCompletionDateLabel={updatedCompletionDateLabel}
    />
  );
};
