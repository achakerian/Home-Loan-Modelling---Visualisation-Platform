import React from 'react';
import { compareMortgageVsPersonalLoan, generateAmortisation } from 'calc-engine';
import {
  CumulativeInterestChart,
  CumulativeInterestWithDifferenceLine,
  CumulativeInterestPercentageDifference,
  CumulativeInterestWithMilestones
} from '../graphs/RepaymentCharts';
import { CurrencyInput, NumberInput, PercentInput } from '../components/inputs';
import { formatCurrency } from '../lib/formatters';

export const LoanComparisonCard: React.FC = () => {
  // Inputs
  const [mortgageAmount, setMortgageAmount] = React.useState(440_000);
  const [personalAmount, setPersonalAmount] = React.useState(40_000);

  const [mortgageRate, setMortgageRate] = React.useState(5.85); // % p.a.
  const [mortgageTermYrs, setMortgageTermYrs] = React.useState(30);
  const [mortgageFeesYearly, setMortgageFeesYearly] = React.useState(0);

  const [carRate, setCarRate] = React.useState(8.5); // % p.a. (personal loan)
  const [carTermYrs, setCarTermYrs] = React.useState(5);
  const [personalFeesMonthly, setPersonalFeesMonthly] = React.useState(0);

  const startDate = React.useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Calculate comparison using calc-engine
  const comparison = React.useMemo(() => {
    return compareMortgageVsPersonalLoan({
      fullMortgageAmount: mortgageAmount,
      mortgageRate: mortgageRate,
      mortgageTermYears: mortgageTermYrs,
      personalLoanAmount: personalAmount,
      personalLoanRate: carRate,
      personalLoanTermYears: carTermYrs,
      frequency: 'monthly',
      repaymentType: 'principalAndInterest',
      repaymentStrategy: 'reduceTerm',
      startDate
    });
  }, [mortgageAmount, mortgageRate, mortgageTermYrs, personalAmount, carRate, carTermYrs, startDate]);

  // Extract values for display
  const monthlyA = Math.round(comparison.summary.fullMortgagePayment);
  const monthlyB_mortgage = Math.round(comparison.summary.splitMortgagePayment);
  const monthlyB_car = Math.round(comparison.summary.splitPersonalPayment);
  const monthlyB_initial = Math.round(comparison.summary.splitCombinedPaymentInitial);

  const totalInterestA = comparison.summary.fullMortgageTotalInterest;
  const totalInterestB = comparison.summary.splitCombinedTotalInterest;
  const totalPaidA = comparison.summary.fullMortgageTotalPaid;
  const totalPaidB = comparison.summary.splitCombinedTotalPaid;

  // Calculate "what if" scenario: Single mortgage with Scenario B payment rate
  const whatIfScenario = React.useMemo(() => {
    const extraPayment = monthlyB_initial - monthlyA;
    const monthsOfExtra = carTermYrs * 12;

    let balance = comparison.summary.totalAmount;
    const monthlyRate = (mortgageRate / 100) / 12;
    let totalInterest = 0;
    let month = 0;

    while (balance > 0.01 && month < 360) {
      const interest = balance * monthlyRate;
      totalInterest += interest;

      const payment = month < monthsOfExtra ? monthlyB_initial : monthlyA;
      const principal = payment - interest;

      balance = Math.max(0, balance - principal);
      month++;
    }

    const yearsEarlier = (comparison.fullMortgage.schedule.length - month) / 12;
    const interestSaved = totalInterestA - totalInterest;

    return {
      totalInterest,
      interestSaved,
      monthsToPayoff: month,
      yearsEarlier
    };
  }, [monthlyA, monthlyB_initial, carTermYrs, comparison, mortgageRate, totalInterestA]);

  const [showWhatIf, setShowWhatIf] = React.useState(false);

  return (
    <div className="space-y-5">
      {/* Comparison Objective */}
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900 shadow-sm dark:border-indigo-900/30 dark:bg-indigo-950/20 dark:text-indigo-100">
        <p className="font-semibold">Comparison objective</p>
        <div className="mt-1 text-xs text-indigo-800 dark:text-indigo-200">
          <p>
            This tool compares two ways of funding the same purchase: taking the full amount as a mortgage, or splitting it between a mortgage and a personal loan.
          </p>
        </div>
      </div>

      

      {/* Unified container: inputs (split by vertical line) + scenarios below a horizontal line */}
      <div className="relative rounded-2xl border border-slate-200 p-4 dark:border-dark-border">
        {/* Inputs two columns with vertical divider on larger screens */}
        <div className="relative grid grid-cols-2 gap-4">
          <div className="pointer-events-none absolute inset-y-2 left-1/2 border-l border-slate-200 dark:border-dark-border" />

          {/* LHS: Mortgage */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Mortgage</h3>
            <CurrencyInput label="Amount" value={mortgageAmount} onChange={setMortgageAmount} />
            <PercentInput label="Interest" value={mortgageRate} onChange={setMortgageRate} asPercentage step={0.05} />
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-dark-muted">
                <div className="flex items-center gap-1">
                  <span>Term Left</span>
                  <div className="group relative">
                    <span className="inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full border border-slate-400 text-[10px] text-slate-500 dark:border-slate-500 dark:text-slate-400">
                      i
                    </span>
                    <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden w-64 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-2 text-xs font-normal text-slate-700 shadow-lg group-hover:block dark:border-dark-border dark:bg-slate-800 dark:text-slate-300">
                      If you are partially through paying off your mortgage you can adjust this to calculate based on the remaining loan term. Ensure you update the principal amount remaining also.
                    </div>
                  </div>
                </div>
              </label>
              <div className="mt-1 flex items-center rounded-2xl border border-slate-300 px-3 py-2 text-base font-semibold text-slate-800 focus-within:ring dark:border-dark-border dark:bg-transparent dark:text-white">
                <input
                  type="number"
                  inputMode="decimal"
                  value={mortgageTermYrs}
                  onChange={(e) => setMortgageTermYrs(Number(e.target.value))}
                  className="w-full bg-transparent text-right focus:outline-none"
                />
                <span className="ml-1 text-sm text-slate-400">/yrs</span>
              </div>
            </div>
            <CurrencyInput label="Fees" value={mortgageFeesYearly} onChange={setMortgageFeesYearly} suffix="/yr" />
          </div>

          {/* RHS: Personal loan */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Personal Loan</h3>
            <CurrencyInput label="Amount" value={personalAmount} onChange={setPersonalAmount} />
            <PercentInput label="Interest" value={carRate} onChange={setCarRate} asPercentage step={0.1} />
            <NumberInput label="Term" value={carTermYrs} onChange={setCarTermYrs} suffix="/yrs" />
            <CurrencyInput label="Fees" value={personalFeesMonthly} onChange={setPersonalFeesMonthly} suffix="/mth" />
          </div>
        </div>

        {/* Scenarios within same container */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-4 dark:border-dark-border">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Mortgage {formatCurrency(comparison.summary.totalAmount)}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Scenario A</p>
            <div className="mt-3 space-y-3">
              <Row label="Monthly Repayments" value={formatCurrency(monthlyA)} />
              <Row label="Total Principle" sub="(mortgage)" value={formatCurrency(comparison.summary.totalAmount)} />
              <Row label="Total interest" value={formatCurrency(totalInterestA)} />
              <div className="border-t border-slate-200 dark:border-dark-border" />
              <Row label="Total" value={formatCurrency(totalPaidA)} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-dark-border">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Mortgage {formatCurrency(comparison.summary.splitMortgageAmount)} +
                <br />
                Personal Loan {formatCurrency(comparison.summary.splitPersonalAmount)}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Scenario B</p>
              <div className="mt-3 space-y-3">
                <Row
                  label={`Monthly Repayments\n(first ${carTermYrs} years)`}
                  value={formatCurrency(monthlyB_initial)}
                  sub="(mortgage + personal)"
                  subValue={`(${formatCurrency(monthlyB_mortgage)} + ${formatCurrency(monthlyB_car)})`}
                />
                <Row
                  label={`Monthly Repayments\n(after ${carTermYrs} years)`}
                  value={formatCurrency(monthlyB_mortgage)}
                  sub="(mortgage only)"
                />
                <Row
                  label="Total Principle"
                  value={formatCurrency(comparison.summary.totalAmount)}
                  sub="(mortgage + personal)"
                  subValue={`(${formatCurrency(comparison.summary.splitMortgageAmount)} + ${formatCurrency(comparison.summary.splitPersonalAmount)})`}
                />
                <Row label="Total interest" value={formatCurrency(totalInterestB)} />
                <div className="border-t border-slate-200 dark:border-dark-border" />
                <Row label="Total" value={formatCurrency(totalPaidB)} />
              </div>
            </div>
            {/* Outcome container */}
            <div className="rounded-2xl border border-orange-300 bg-orange-100 p-4 dark:border-orange-700/70 dark:bg-orange-900/40">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {totalPaidA < totalPaidB ? 'Scenario A Wins' : 'Scenario B Wins'}
              </h3>
              {totalPaidA < totalPaidB ? (
                <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                  <p className="mb-2">
                    Rolling everything into the mortgage results in a lower total cost overall.
                  </p>
                  <p>
                    The lower interest rate, applied over the full loan term, outweighs the benefit of paying part of the debt down faster.
                  </p>
                </div>
              ) : (
                <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                  <p className="mb-2">
                    Splitting the loan results in a lower total cost overall, despite higher repayments upfront.
                  </p>
                  <p>
                    The personal loan is cleared much sooner, which stops interest on that portion early and reduces total interest paid.
                  </p>

                  {/* But... collapsible section when Scenario B wins */}
                  <div className="mt-4">
                    <button
                      onClick={() => setShowWhatIf(!showWhatIf)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                          But...
                        </h4>
                        <span className="text-slate-500 dark:text-slate-400">
                          {showWhatIf ? '−' : '+'}
                        </span>
                      </div>
                    </button>
                    {showWhatIf && (
                      <div className="mt-3">
                        <p className="mb-3">
                          If you put it all into a mortgage and paid at the same rate as Scenario B for the first {carTermYrs} years, your final position would be:
                        </p>
                        <div className="space-y-2 rounded-lg bg-blue-100/90 p-3 dark:bg-blue-900/90">
                          <Row
                            label="Interest saved"
                            value={formatCurrency(whatIfScenario.interestSaved)}
                            valueClassName="text-green-700 dark:text-green-300"
                          />
                          <Row
                            label="Paid off earlier"
                            value={`${whatIfScenario.yearsEarlier.toFixed(1)} years`}
                            valueClassName="text-green-700 dark:text-green-300"
                          />
                        </div>
                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                          This shows the benefit of putting extra {formatCurrency(monthlyB_initial - monthlyA)}/month toward a single mortgage for {carTermYrs} years instead of taking a personal loan.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface RowProps {
  label: string;
  value?: string;
  sub?: string;
  labelSuffix?: string;
  subValue?: string;
  subSuffix?: string;
  valueClassName?: string;
}

const Row: React.FC<RowProps> = ({ label, value, sub, labelSuffix, subValue, subSuffix, valueClassName }) => (
  <div className="flex items-start justify-between">
    <div className="leading-tight">
      <span className="whitespace-pre-line text-sm font-medium text-slate-600 dark:text-dark-muted">
        {label} {labelSuffix && <span className="font-semibold text-slate-700 dark:text-white">{labelSuffix}</span>}
      </span>
      {sub && (
        <div className="text-[11px] text-slate-400 dark:text-dark-muted">
          {sub} {subSuffix && <span className="ml-1">{subSuffix}</span>}
        </div>
      )}
    </div>
    <div className="ml-3 text-right">
      {value && (
        <div className={`text-base font-semibold ${valueClassName ?? 'text-slate-900 dark:text-white'}`}>{value}</div>
      )}
      {subValue && (
        <div className="text-[11px] text-slate-400 dark:text-dark-muted">{subValue}</div>
      )}
    </div>
  </div>
);

function formatDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '−';
  const abs = Math.abs(delta);
  return `${sign}${formatCurrency(abs)}`;
}

function deltaTone(delta: number): string {
  return delta >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
}
