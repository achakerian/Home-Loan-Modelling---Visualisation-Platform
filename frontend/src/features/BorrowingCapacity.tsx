import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Label
} from 'recharts';

// Very simple Australian-style progressive tax approximation for
// a single individual (ignores offsets and levies).
const calculateAnnualTax = (grossAnnual: number): number => {
  if (grossAnnual <= 18200) return 0;
  if (grossAnnual <= 45000) return (grossAnnual - 18200) * 0.19;
  if (grossAnnual <= 120000) return 5092 + (grossAnnual - 45000) * 0.325;
  if (grossAnnual <= 180000) return 29467 + (grossAnnual - 120000) * 0.37;
  return 51667 + (grossAnnual - 180000) * 0.45;
};

const calculateAfterTaxIncome = (grossAnnual: number): number => {
  const tax = calculateAnnualTax(grossAnnual);
  const afterTax = grossAnnual - tax;
  return afterTax > 0 ? afterTax : 0;
};

export const BorrowingCapacity: React.FC = () => {
  const [grossIncomeAnnual, setGrossIncomeAnnual] = useState<number>(120000);
  const [livingExpensesAnnual, setLivingExpensesAnnual] = useState<number>(36000);
  const [debtRepaymentsAnnual, setDebtRepaymentsAnnual] = useState<number>(0);
  const [loanTermYears, setLoanTermYears] = useState<number>(30);
  const [surplusSharePercent, setSurplusSharePercent] = useState<number>(70);
  const [interestRate, setInterestRate] = useState<number>(6);
  const [expensesMonthly, setExpensesMonthly] = useState<number>(3000);
  const [viewMode, setViewMode] = useState<'simple' | 'advanced'>('simple');

  const surplusShareAdvanced = surplusSharePercent / 100;

  const afterTaxIncomeAnnual = calculateAfterTaxIncome(grossIncomeAnnual);
  const taxAnnual = Math.max(grossIncomeAnnual - afterTaxIncomeAnnual, 0);

  // Simple view uses a fixed 70% surplus share and ignores advanced-only debt inputs
  const surplusShareSimple = SURPLUS_SHARE_FOR_REPAYMENTS;
  const surplusAnnualSimple = Math.max(
    afterTaxIncomeAnnual - livingExpensesAnnual,
    0
  );
  const surplusAnnualAdvanced = Math.max(
    afterTaxIncomeAnnual - livingExpensesAnnual - debtRepaymentsAnnual,
    0
  );
  const maxAnnualRepaymentsSimple = surplusAnnualSimple * surplusShareSimple;
  const simpleBorrowingPower = loanFromAnnualBudget(
    maxAnnualRepaymentsSimple,
    interestRate,
    loanTermYears
  );

  return (
    <div className="two-column-layout">
      <section aria-label="Borrowing Capacity" className="inputs-pane">
        <header
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '0.3rem'
          }}
        >
          <h2 className="page-heading" style={{ marginBottom: 0 }}>
            Borrowing Capacity
          </h2>
          <div
            style={{
              display: 'inline-flex',
              borderRadius: '999px',
              border: '1px solid #d1d5db',
              padding: '2px',
              backgroundColor: '#f9fafb',
              gap: '2px'
            }}
            aria-label="Borrowing Capacity view mode"
          >
            <button
              type="button"
              onClick={() => setViewMode('simple')}
              style={{
                padding: '0.15rem 0.7rem',
                borderRadius: '999px',
                border: 'none',
                fontSize: '0.8rem',
                cursor: 'pointer',
                backgroundColor: viewMode === 'simple' ? '#2563eb' : 'transparent',
                color: viewMode === 'simple' ? '#ffffff' : '#374151'
              }}
            >
              Simple
            </button>
            <button
              type="button"
              onClick={() => setViewMode('advanced')}
              style={{
                padding: '0.15rem 0.7rem',
                borderRadius: '999px',
                border: 'none',
                fontSize: '0.8rem',
                cursor: 'pointer',
                backgroundColor:
                  viewMode === 'advanced' ? '#2563eb' : 'transparent',
                color: viewMode === 'advanced' ? '#ffffff' : '#374151'
              }}
            >
              Advanced
            </button>
          </div>
        </header>
        <form
          style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}
          aria-label="Borrowing assumptions"
        >
          <LabeledCurrencyBC
            id="bc-gross-income"
            label="Gross income (annual)"
            varSymbol="G"
            value={grossIncomeAnnual}
            min={20000}
            onChange={setGrossIncomeAnnual}
          />
          <LabeledCurrencyBC
            id="bc-living-expenses"
            label="Living expenses (annual)"
            varSymbol="E"
            value={livingExpensesAnnual}
            min={0}
            onChange={(value) => {
              setLivingExpensesAnnual(value);
              setExpensesMonthly(value / 12);
            }}
          />
          {viewMode === 'advanced' && (
            <LabeledCurrencyBC
              id="bc-debt-repayments"
              label="Existing debt repayments (annual)"
              varSymbol="D"
              value={debtRepaymentsAnnual}
              min={0}
              onChange={setDebtRepaymentsAnnual}
            />
          )}
          <LabeledNumberBC
            id="bc-interest-rate"
            label="Interest rate"
            varSymbol="r"
            suffix="%"
            value={interestRate}
            min={4}
            max={15}
            step={0.25}
            onChange={setInterestRate}
          />
          <LabeledNumberBC
            id="bc-loan-term"
            label="Loan term (yrs)"
            varSymbol="n"
            value={loanTermYears}
            min={5}
            max={40}
            step={1}
            onChange={setLoanTermYears}
          />
          {viewMode === 'advanced' && (
            <LabeledNumberBC
              id="bc-surplus-share"
              label="Share of surplus used for repayments (%)"
              varSymbol="s"
              suffix="%"
              value={surplusSharePercent}
              min={10}
              max={100}
              step={5}
              onChange={setSurplusSharePercent}
            />
          )}
        </form>
      </section>

      <section aria-label="Borrowing power explanation">
        <div
          style={{
            borderRadius: '0.75rem',
            border: '1px solid #e5e7eb',
            padding: '0.9rem 1rem',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Borrowing Power Breakdown</div>
          <div
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-main)',
              marginBottom: 2,
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}
          >
            <span>Gross income (annual):</span>
            <span>{currencyFormatter.format(grossIncomeAnnual)}</span>
          </div>
          <div
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-main)',
              marginBottom: 2,
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}
          >
            <span>Less income tax (approx):</span>
            <span>−{currencyFormatter.format(taxAnnual)}</span>
          </div>
          <div
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-main)',
              marginBottom: 2,
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}
          >
            <span>Less living expenses:</span>
            <span>−{currencyFormatter.format(livingExpensesAnnual)}</span>
          </div>
          {viewMode === 'advanced' && (
            <div
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-main)',
                marginBottom: 2,
                display: 'flex',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}
            >
              <span>Less existing debt repayments:</span>
              <span>−{currencyFormatter.format(debtRepaymentsAnnual)}</span>
            </div>
          )}
          <div
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-main)',
              marginTop: 2,
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}
          >
            <span>Annual surplus income:</span>
            <span>
              {currencyFormatter.format(
                viewMode === 'advanced'
                  ? surplusAnnualAdvanced
                  : surplusAnnualSimple
              )}
            </span>
          </div>

          <div
            style={{
              borderTop: '1px solid #e5e7eb',
              margin: '0.35rem 0 0.35rem'
            }}
          />

          <div
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-main)',
              marginBottom: 2,
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}
          >
            <span>Assessment interest rate (stress test):</span>
            <span>{interestRate}% p.a.</span>
          </div>
          <div
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-main)',
              marginBottom: 2,
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}
          >
            <span>Loan term (principal & interest):</span>
            <span>{loanTermYears} years</span>
          </div>
          <div
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-main)',
              marginBottom: 2,
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}
          >
            <span>Share of surplus used for repayments:</span>
            <span>
              {viewMode === 'advanced'
                ? `${surplusSharePercent}%`
                : `${Math.round(SURPLUS_SHARE_FOR_REPAYMENTS * 100)}%`}
            </span>
          </div>

          <div
            style={{
              borderTop: '1px solid #e5e7eb',
              margin: '0.35rem 0 0.35rem'
            }}
          />

          <div
            style={{
              fontSize: '0.9rem',
              marginTop: 2,
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}
          >
            <span style={{ fontWeight: 700 }}>Estimated borrowing power:</span>
            <span style={{ fontWeight: 700 }}>{currencyFormatter.format(simpleBorrowingPower)}</span>
          </div>

        </div>

        <div
          style={{
            marginTop: '1.25rem',
            borderRadius: '0.75rem',
            padding: '1rem 1.25rem',
            background: 'var(--bg-elevated)'
          }}
        >
          <h3 style={{ marginBottom: '0.25rem' }}>Borrowing Power vs Income</h3>
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              marginBottom: '0.75rem'
            }}
          >
            This chart shows how estimated borrowing capacity changes across
            different income levels using your current living expenses, debts
            and interest rate. Hover to see the details at each income point.
          </p>
          <div
            style={{
              borderRadius: '0.75rem',
              padding: 0,
              background: 'var(--panel-bg)'
            }}
          >
            <IncomeBorrowingChart
              interestRate={interestRate}
              livingExpensesAnnual={livingExpensesAnnual}
              debtRepaymentsAnnual={
                viewMode === 'advanced' ? debtRepaymentsAnnual : 0
              }
              loanTermYears={loanTermYears}
              surplusShare={
                viewMode === 'advanced'
                  ? surplusShareAdvanced
                  : SURPLUS_SHARE_FOR_REPAYMENTS
              }
              viewMode={viewMode}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

interface IncomeBorrowingChartProps {
  interestRate: number;
  livingExpensesAnnual: number;
  debtRepaymentsAnnual: number;
  loanTermYears: number;
  surplusShare: number;
  viewMode: 'simple' | 'advanced';
}

const currencyFormatter = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0
});

const LOAN_TERM_YEARS = 30;
const SURPLUS_SHARE_FOR_REPAYMENTS = 0.7; // 70% of surplus income can go to repayments

// Convert an annual repayment budget into an approximate maximum
// loan size using a simple amortisation formula.
const loanFromAnnualBudget = (
  annualBudget: number,
  ratePercent: number,
  loanTermYears: number
) => {
  if (annualBudget <= 0) return 0;

  const n = loanTermYears * 12;

  const annualRate = ratePercent / 100;
  const monthlyRate = annualRate / 12;

  const monthlyBudget = annualBudget / 12;

  if (monthlyRate <= 0) {
    // Degenerate near-0% case: treat like interest-free over the term.
    return monthlyBudget * n;
  }

  const pow = Math.pow(1 + monthlyRate, n);
  const paymentPerPrincipal = (monthlyRate * pow) / (pow - 1);
  const principal = monthlyBudget / paymentPerPrincipal;

  return principal > 0 ? principal : 0;
};

interface LabeledNumberBCProps {
  id: string;
  label: string;
  varSymbol?: string;
  suffix?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}

const LabeledNumberBC: React.FC<LabeledNumberBCProps> = ({
  id,
  label,
  varSymbol,
  suffix,
  value,
  min,
  max,
  step,
  onChange
}) => {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <div
        style={{
          position: 'relative',
          display: 'inline-flex',
          width: '100%'
        }}
      >
        <input
          id={id}
          type="number"
          value={Number.isNaN(value) ? '' : value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            width: '100%',
            padding: '0.4rem 0.75rem',
            paddingLeft: varSymbol ? '2.75rem' : '0.75rem',
            paddingRight: suffix ? '1.4rem' : '0.75rem',
            fontSize: '0.9rem',
            borderRadius: '0.375rem',
            border: '1px solid var(--control-border)',
            boxSizing: 'border-box',
            backgroundColor: 'var(--control-bg)',
            color: 'var(--text-main)'
          }}
        />
        {varSymbol && (
          <span
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.85rem',
              color: 'var(--text-muted)'
            }}
          >
            {varSymbol} =
          </span>
        )}
        {suffix && (
          <span
            style={{
              position: 'absolute',
              right: '0.65rem',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.85rem',
              color: 'var(--text-muted)'
            }}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

interface LabeledCurrencyBCProps {
  id: string;
  label: string;
  varSymbol?: string;
  value: number;
  min?: number;
  onChange: (value: number) => void;
}

const LabeledCurrencyBC: React.FC<LabeledCurrencyBCProps> = ({
  id,
  label,
  varSymbol,
  value,
  min,
  onChange
}) => {
  const [display, setDisplay] = useState<string>('');

  useEffect(() => {
    if (!Number.isFinite(value)) {
      setDisplay('');
    } else {
      setDisplay(
        value
          ? currencyFormatter.format(value)
          : ''
      );
    }
  }, [value]);

  const handleChange = (raw: string) => {
    const numeric = raw.replace(/[^0-9]/g, '');
    const nextValue = numeric ? Number(numeric) : 0;
    if (min !== undefined && nextValue < min) {
      onChange(min);
      return;
    }
    setDisplay(numeric ? currencyFormatter.format(nextValue) : '');
    onChange(nextValue);
  };

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <div
        style={{
          position: 'relative',
          display: 'inline-flex',
          width: '100%'
        }}
      >
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={display}
          onChange={(e) => handleChange(e.target.value)}
          style={{
            width: '100%',
            padding: '0.4rem 0.75rem',
            paddingLeft: varSymbol ? '2.75rem' : '0.75rem',
            fontSize: '0.9rem',
            borderRadius: '0.375rem',
            border: '1px solid var(--control-border)',
            boxSizing: 'border-box',
            backgroundColor: 'var(--control-bg)',
            color: 'var(--text-main)'
          }}
        />
        {varSymbol && (
          <span
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.85rem',
              color: 'var(--text-muted)'
            }}
          >
            {varSymbol} =
          </span>
        )}
      </div>
    </div>
  );
};

interface BorrowingTooltipPayload {
  income: number;
  grossIncomeAnnual: number;
  livingExpensesAnnual: number;
  debtRepaymentsAnnual: number;
  surplusAnnual: number;
  assessmentRate: number;
  loanTermYears: number;
  surplusShare: number;
  borrowingPower: number;
  borrowingPowerNoExpenses: number;
  usedByLivingCosts: number;
}

interface BorrowingTooltipProps {
  active?: boolean;
  payload?: {
    value: number;
    name: string;
    color: string;
    payload: BorrowingTooltipPayload;
  }[];
  label?: number;
  viewMode: 'simple' | 'advanced';
}

const BorrowingTooltip: React.FC<BorrowingTooltipProps> = ({
  active,
  payload,
  viewMode
}) => {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0].payload;

  const grossIncome = point.grossIncomeAnnual;
  const livingExpensesAnnual = point.livingExpensesAnnual;
  const debtRepaymentsAnnual = point.debtRepaymentsAnnual;
  const surplusAnnual = point.surplusAnnual;
  const assessmentRate = point.assessmentRate;
  const loanTermYears = point.loanTermYears;
  const surplusShare = point.surplusShare;
  const borrowingPower = point.borrowingPower;

  const rateLabel = `${assessmentRate}% p.a.`;
  const isAdvanced = viewMode === 'advanced';

  const afterTaxIncome = calculateAfterTaxIncome(grossIncome);
  const taxAnnual = Math.max(grossIncome - afterTaxIncome, 0);

  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-subtle)',
        padding: '0.75rem 0.9rem',
        boxShadow: '0 10px 15px -3px rgba(15,23,42,0.25)',
        maxWidth: 360,
        color: 'var(--text-main)',
        fontSize: '0.85rem'
      }}
    >
      <div
        style={{
          fontWeight: 600,
          marginBottom: 6,
          fontSize: '0.9rem'
        }}
      >
        Borrowing Power Breakdown
      </div>

      <div
        style={{
          fontSize: '0.85rem',
          marginBottom: 2,
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}
      >
        <span>Gross income (annual):</span>
        <span>{currencyFormatter.format(grossIncome)}</span>
      </div>
      <div
        style={{
          fontSize: '0.85rem',
          marginBottom: 2,
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}
      >
        <span>Less income tax (approx):</span>
        <span>−{currencyFormatter.format(taxAnnual)}</span>
      </div>
      <div
        style={{
          fontSize: '0.85rem',
          marginBottom: 2,
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}
      >
        <span>Less living expenses:</span>
        <span>−{currencyFormatter.format(livingExpensesAnnual)}</span>
      </div>
      {isAdvanced && (
        <div
          style={{
            fontSize: '0.85rem',
            marginBottom: 2,
            display: 'flex',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}
        >
          <span>Less existing debt repayments:</span>
          <span>−{currencyFormatter.format(debtRepaymentsAnnual)}</span>
        </div>
      )}

      <div
        style={{
          fontSize: '0.85rem',
          marginTop: 2,
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}
      >
        <span>Annual surplus income:</span>
        <span>{currencyFormatter.format(surplusAnnual)}</span>
      </div>

      <div
        style={{
          borderTop: '1px solid var(--border-subtle)',
          margin: '0.35rem 0 0.35rem'
        }}
      />

      <div
        style={{
          fontSize: '0.85rem',
          marginBottom: 2,
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}
      >
        <span>Assessment interest rate (stress test):</span>
        <span>{rateLabel}</span>
      </div>
      <div
        style={{
          fontSize: '0.85rem',
          marginBottom: 2,
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}
      >
        <span>Loan term (principal & interest):</span>
        <span>{loanTermYears} years</span>
      </div>
      <div
        style={{
          fontSize: '0.85rem',
          marginBottom: 2,
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}
      >
        <span>Share of surplus used for repayments:</span>
        <span>{Math.round(surplusShare * 100)}%</span>
      </div>

      <div
        style={{
          borderTop: '1px solid var(--border-subtle)',
          margin: '0.35rem 0 0.35rem'
        }}
      />

      <div
        style={{
          fontSize: '0.85rem',
          marginTop: 2,
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}
      >
        <span style={{ fontWeight: 600 }}>Estimated borrowing power:</span>
        <span style={{ fontWeight: 600 }}>{currencyFormatter.format(borrowingPower)}</span>
      </div>

    </div>
  );
};

const IncomeBorrowingChart: React.FC<IncomeBorrowingChartProps> = ({
  interestRate,
  livingExpensesAnnual,
  debtRepaymentsAnnual,
  loanTermYears,
  surplusShare,
  viewMode
}) => {
  const baseIncome = 40000;

  const rawPoints = useMemo(
    () => {
      const points: { income: number }[] = [];
      const minIncome = 40000;
      const maxIncome = 240000;
      const step = 10000;

      for (let income = minIncome; income <= maxIncome; income += step) {
        points.push({ income });
      }

      return points;
    },
    []
  );

  const rateForCalc = Math.max(interestRate || 0, 0.1);

  const data = rawPoints.map((p) => {
    const income = p.income;

    const grossIncomeAnnual = income;

    const afterTaxIncomeAnnual = calculateAfterTaxIncome(grossIncomeAnnual);

    // Surplus income after living costs and existing debts
    const surplusAnnual = Math.max(
      afterTaxIncomeAnnual - livingExpensesAnnual - debtRepaymentsAnnual,
      0
    );

    const maxAnnualRepayments = surplusAnnual * surplusShare;

    // Hypothetical scenario with $0 living expenses (for the shaded area)
    const surplusAnnualNoExpenses = Math.max(
      afterTaxIncomeAnnual - debtRepaymentsAnnual,
      0
    );
    const maxAnnualRepaymentsNoExpenses =
      surplusAnnualNoExpenses * surplusShare;

    const borrowingPower = loanFromAnnualBudget(
      maxAnnualRepayments,
      rateForCalc,
      loanTermYears
    );
    const borrowingPowerNoExpenses = loanFromAnnualBudget(
      maxAnnualRepaymentsNoExpenses,
      rateForCalc,
      loanTermYears
    );

    const usedByLivingCosts = Math.max(
      borrowingPowerNoExpenses - borrowingPower,
      0
    );

    return {
      incomeOffset: income - baseIncome,
      income,
      grossIncomeAnnual,
      livingExpensesAnnual,
      debtRepaymentsAnnual,
      surplusAnnual,
      assessmentRate: rateForCalc,
      loanTermYears,
      surplusShare,
      borrowingPower,
      borrowingPowerNoExpenses,
      usedByLivingCosts
    };
  });

  const minIncomeOffset = 0;
  // Show ticks from $40k to $240k income (offset 0 to 200k)
  const maxIncomeOffset = 240000 - baseIncome;
  const maxLoanAmount = data.reduce(
    (max, d) =>
      d.borrowingPowerNoExpenses > max ? d.borrowingPowerNoExpenses : max,
    0
  );

  const minLoanDisplay = 200000;
  const maxLoanDisplay = Math.max(1400000, maxLoanAmount);

  const incomeTicks: number[] = [];
  for (let v = minIncomeOffset; v <= maxIncomeOffset; v += 10000) incomeTicks.push(v);

  const loanTicks: number[] = [];
  const desiredTickCount = 6;
  const rawStep = (maxLoanDisplay - minLoanDisplay) / (desiredTickCount - 1);
  const step = Math.max(100000, Math.round(rawStep / 100000) * 100000);
  for (let v = minLoanDisplay; v <= maxLoanDisplay; v += step) loanTicks.push(v);

  const formatIncomeTick = (v: number) => {
    const income = v + baseIncome;
    if (income >= 1_000_000) {
      return `$${(income / 1_000_000).toFixed(1)}m`;
    }
    return `$${Math.round(income / 1000)}k`;
  };
  const formatLoanTick = (v: number) => {
    if (v >= 1_000_000) {
      return `$${(v / 1_000_000).toFixed(1)}m`;
    }
    return `$${Math.round(v / 1000)}k`;
  };

  return (
    <div style={{ width: '100%', height: 440 }}>
      <ResponsiveContainer>
        <AreaChart
          data={data}
          margin={{ left: 20, right: 30, top: 10, bottom: 20 }}
        >
          <XAxis
            dataKey="incomeOffset"
            ticks={incomeTicks}
            tickFormatter={formatIncomeTick}
            domain={[0, maxIncomeOffset]}
            type="number"
            axisLine={{ stroke: 'var(--border-subtle)' }}
            tickLine={{ stroke: 'var(--border-subtle)' }}
            tick={{ fill: 'var(--text-main)', fontSize: 12 }}
          >
            <Label
              value="Gross income (annual)"
              position="insideBottom"
              dy={14}
              style={{ fill: 'var(--text-main)', fontSize: 12 }}
            />
          </XAxis>
          <YAxis
            ticks={loanTicks}
            tickFormatter={formatLoanTick}
            domain={[minLoanDisplay, maxLoanDisplay]}
            axisLine={{ stroke: 'var(--border-subtle)' }}
            tickLine={{ stroke: 'var(--border-subtle)' }}
            tick={{ fill: 'var(--text-main)', fontSize: 12 }}
          >
            <Label
              value="Borrowing Power ($)"
              angle={-90}
              position="insideLeft"
              dx={-12}
              dy={40}
              style={{ fill: 'var(--text-main)', fontSize: 12 }}
            />
          </YAxis>
          <Tooltip
            content={(tooltipProps) => (
              <BorrowingTooltip viewMode={viewMode} {...tooltipProps} />
            )}
          />
          <Area
            type="monotone"
            dataKey="borrowingPower"
            name="Estimated borrowing power"
            stackId="1"
            stroke="#60a5fa"
            fill="rgba(37, 99, 235, 0.25)"
          />
          <Area
            type="monotone"
            dataKey="usedByLivingCosts"
            name="Borrowing power used by living costs"
            stackId="1"
            stroke="#fb923c"
            fill="rgba(249, 115, 22, 0.24)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
