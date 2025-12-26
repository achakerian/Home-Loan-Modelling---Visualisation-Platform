import React, { useEffect, useMemo, useState } from 'react';
import {
  generateScenarioWithExtras,
  RepaymentFrequency,
  RepaymentType,
  RepaymentStrategy,
  ExtraRule
} from 'calc-engine';
import { BalanceChart } from '../graphs/RepaymentCharts';
import { formatCurrency } from '../lib/formatters';

const DEFAULT_START_DATE = new Date().toISOString().slice(0, 10);

interface AdvancedSimulatorProps {
  mode: 'simple' | 'advanced';
  onModeChange: (mode: 'simple' | 'advanced') => void;
}

export const AdvancedSimulator: React.FC<AdvancedSimulatorProps> = ({
  mode,
  onModeChange
}) => {
  const [amount, setAmount] = useState(500000);
  const [rate, setRate] = useState(6);
  const [years, setYears] = useState(30);
  const [frequency, setFrequency] = useState<RepaymentFrequency>('monthly');
  const [repaymentType, setRepaymentType] =
    useState<RepaymentType>('principalAndInterest');
  const [strategy, setStrategy] =
    useState<RepaymentStrategy>('reduceTerm');

  type ExtraKind = 'one-off' | 'weekly' | 'fortnightly' | 'annual' | 'custom';

  interface ExtraRow {
    id: number;
    kind: ExtraKind;
    month: number;
    endMonth?: number;
    amount: number;
    intervalMonths?: number;
  }

  const [extraRows, setExtraRows] = useState<ExtraRow[]>([]);

  const scenario = useMemo(() => {
    const rules: ExtraRule[] = extraRows
      .filter((row) => row.amount > 0)
      .map((row) => ({
        startMonth: row.month,
        endMonth: row.endMonth,
        amount: row.amount,
        frequency:
          row.kind === 'one-off'
            ? 'oneOff'
            : row.kind === 'custom'
            ? 'customMonths'
            : (row.kind as 'weekly' | 'fortnightly' | 'annual'),
        intervalMonths: row.intervalMonths
      }));

    return generateScenarioWithExtras(
      {
        amount,
        annualRate: rate,
        years,
        frequency,
        repaymentType,
        repaymentStrategy: strategy,
        startDate: DEFAULT_START_DATE
      },
      rules
    );
  }, [amount, rate, years, frequency, repaymentType, strategy, extraRows]);

  const baselineResult = scenario.baseline;
  const result = scenario.withExtras;
  const comparison = scenario.comparison;
  const payoffDate = new Date(result.summary.payoffDate);
  const payoffYear = payoffDate.getFullYear();

  const baselinePayoffDate = new Date(baselineResult.summary.payoffDate);
  const baselinePayoffYear = baselinePayoffDate.getFullYear();

  const frequencyLabel =
    frequency === 'monthly'
      ? 'Monthly repayment'
      : frequency === 'weekly'
      ? 'Weekly repayment'
      : 'Fortnightly repayment';

  const baselinePayment = baselineResult.summary.regularPayment;
  const additionalEffectivePayment = baselinePayment +
    (result.schedule.length > 0 ? result.schedule[0].extraRepayment : 0);

  return (
    <div className="two-column-layout">
      <section aria-label="Repayment inputs" className="inputs-pane">
        <header
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '0.3rem'
          }}
        >
          <h2 className="page-heading" style={{ marginBottom: 0 }}>
            Original loan
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '0.9rem',
              color: 'var(--text-muted)'
            }}
          >
            Model home loan repayments over time and see how your balance and
            interest change.
          </p>
        </header>
        <form
          style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}
        >
          <LabeledCurrency
            id="adv-amount"
            label="Loan amount"
            value={amount}
            min={50000}
            onChange={setAmount}
          />
          <div className="loan-input-row-split">
            <LabeledNumber
              id="adv-rate"
              label="Interest rate"
              suffix="%"
              value={rate}
              min={0}
              step={0.1}
              onChange={setRate}
            />
            <LabeledNumber
              id="adv-years"
              label="Loan term (yrs)"
              value={years}
              min={1}
              max={40}
              step={1}
              onChange={setYears}
            />
          </div>
          <div>
            <label htmlFor="adv-frequency">Repayment frequency</label>
            <select
              id="adv-frequency"
              value={frequency}
              onChange={(e) =>
                setFrequency(e.target.value as RepaymentFrequency)
              }
              style={{
                width: '100%',
                padding: '0.4rem 0.75rem',
                fontSize: '0.9rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--control-border)',
                backgroundColor: 'var(--control-bg)',
                color: 'var(--text-main)'
              }}
            >
              <option value="weekly">Weekly</option>
              <option value="fortnightly">Fortnightly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <fieldset
            style={{
              margin: 0,
              borderRadius: '0.375rem',
              border: '1px solid var(--control-border)',
              padding: '0.6rem 0.75rem'
            }}
          >
            <legend
              style={{
                padding: '0 0.25rem',
                fontSize: '0.8rem',
                color: 'var(--text-muted)'
              }}
            >
              Repayment type
            </legend>
            <label>
              <input
                type="radio"
                name="adv-repaymentType"
                value="principalAndInterest"
                checked={repaymentType === 'principalAndInterest'}
                onChange={() => setRepaymentType('principalAndInterest')}
              />
              Principle &amp; Interest
            </label>
            <br />
            <label>
              <input
                type="radio"
                name="adv-repaymentType"
                value="interestOnly"
                checked={repaymentType === 'interestOnly'}
                onChange={() => setRepaymentType('interestOnly')}
              />
              Interest-only
            </label>
          </fieldset>
          {/* Simple / Advanced toggle below simple inputs */}
          <div
            style={{
              marginTop: '0.75rem'
            }}
          >
            <h3
              style={{
                margin: 0,
                marginBottom: '0.35rem',
                fontSize: '0.9rem'
              }}
            >
              Additional Details
            </h3>
            <div
              style={{
                display: 'inline-flex',
                borderRadius: '999px',
                border: '1px solid var(--control-border)',
                padding: '2px',
                backgroundColor: 'var(--control-bg)',
                gap: '2px'
              }}
              aria-label="Repayments view mode"
            >
              <button
                type="button"
                onClick={() => onModeChange('simple')}
                style={{
                  padding: '0.15rem 0.7rem',
                  borderRadius: '999px',
                  border: 'none',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  backgroundColor:
                    mode === 'simple' ? '#2563eb' : 'transparent',
                  color:
                    mode === 'simple' ? '#ffffff' : 'var(--text-main)'
                }}
              >
                Simple
              </button>
              <button
                type="button"
                onClick={() => onModeChange('advanced')}
                style={{
                  padding: '0.15rem 0.7rem',
                  borderRadius: '999px',
                  border: 'none',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  backgroundColor:
                    mode === 'advanced' ? '#2563eb' : 'transparent',
                  color:
                    mode === 'advanced' ? '#ffffff' : 'var(--text-main)'
                }}
              >
                Advanced
              </button>
            </div>
          </div>
          <hr />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '0.5rem',
              marginBottom: '0.25rem'
            }}
          >
            <h3 style={{ margin: 0 }}>Additional repayments</h3>
            <button
              type="button"
              onClick={() =>
                setExtraRows((rows) => [
                  ...rows,
                  {
                    id: rows.length ? rows[rows.length - 1].id + 1 : 1,
                    kind: 'one-off',
                    month: 0,
                    endMonth: undefined,
                    amount: 0,
                    intervalMonths: 1
                  }
                ])
              }
              style={{
                padding: '0.2rem 0.6rem',
                fontSize: '0.85rem',
                borderRadius: '9999px',
                border: '1px solid #d1d5db',
                background: '#ffffff',
                cursor: 'pointer'
              }}
            >
              Add
            </button>
          </div>

          {extraRows.map((row, index) => (
            <div
              key={row.id}
              style={{
                marginTop: '0.5rem',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}
              >
                <strong>Repayment frequency</strong>
                <button
                  type="button"
                  onClick={() =>
                    setExtraRows((rows) =>
                      rows.filter((r) => r.id !== row.id)
                    )
                  }
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#6b7280',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  Remove
                </button>
              </div>
              <div
                style={{
                  display: 'grid',
                  gap: '0.5rem'
                }}
              >
                <div>
                  <select
                    id={`extra-kind-${row.id}`}
                    value={row.kind}
                    onChange={(e) =>
                      setExtraRows((rows) =>
                        rows.map((r) =>
                          r.id === row.id
                            ? {
                                ...r,
                                kind: e.target.value as ExtraKind
                              }
                            : r
                        )
                      )
                    }
                    style={{
                      width: '100%',
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.9rem',
                      borderRadius: '0.375rem',
                      border: '1px solid var(--control-border)',
                      backgroundColor: 'var(--control-bg)',
                      color: 'var(--text-main)'
                    }}
                  >
                    <option value="one-off">One-off</option>
                    <option value="weekly">Weekly</option>
                    <option value="fortnightly">Fortnightly</option>
                    <option value="annual">Annual</option>
                    <option value="custom">Custom (months)</option>
                  </select>
                </div>
                <div className="loan-input-row-split">
                  <LabeledNumber
                    id={`extra-month-${row.id}`}
                    label="Start month"
                    value={row.month}
                    min={0}
                    step={1}
                    onChange={(value) =>
                      setExtraRows((rows) =>
                        rows.map((r) =>
                          r.id === row.id ? { ...r, month: value } : r
                        )
                      )
                    }
                  />
                  {row.kind !== 'one-off' && (
                    <LabeledNumber
                      id={`extra-end-month-${row.id}`}
                      label="Finish month"
                      value={row.endMonth ?? row.month}
                      min={row.month}
                      step={1}
                      onChange={(value) =>
                        setExtraRows((rows) =>
                          rows.map((r) =>
                            r.id === row.id ? { ...r, endMonth: value } : r
                          )
                        )
                      }
                    />
                  )}
                </div>
                {row.kind === 'custom' && (
                  <LabeledNumber
                    id={`extra-interval-${row.id}`}
                    label="Repeat every (months)"
                    value={row.intervalMonths ?? 1}
                    min={1}
                    step={1}
                    onChange={(value) =>
                      setExtraRows((rows) =>
                        rows.map((r) =>
                          r.id === row.id
                            ? { ...r, intervalMonths: value }
                            : r
                        )
                      )
                    }
                  />
                )}
                <LabeledCurrency
                  id={`extra-amount-${row.id}`}
                  label="Amount"
                  value={row.amount}
                  min={0}
                  onChange={(value) =>
                    setExtraRows((rows) =>
                      rows.map((r) =>
                        r.id === row.id ? { ...r, amount: value } : r
                      )
                    )
                  }
                />
              </div>
            </div>
          ))}
        </form>
      </section>

      <section aria-label="Repayment results">
          <div className="summary-row" style={{ marginBottom: '1.25rem' }}>
          <div className="summary-row-original">
            <SummaryRow
              rowLabel="Original"
              frequencyLabel={frequencyLabel}
              amount={amount}
              totalInterest={baselineResult.summary.totalInterest}
              totalPaid={baselineResult.summary.totalPaid}
              payoffYear={baselinePayoffYear}
              regularPayment={baselinePayment}
            />
          </div>
          <div className="summary-row-additional">
            <SummaryRow
              rowLabel="Additional"
              frequencyLabel={frequencyLabel}
              amount={amount}
              totalInterest={result.summary.totalInterest}
              totalPaid={result.summary.totalPaid}
              payoffYear={payoffYear}
              regularPayment={additionalEffectivePayment}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3>Loan balance over time</h3>
          <p
            style={{
              marginTop: '0.35rem',
              marginBottom: '0.3rem',
              fontSize: '0.85rem',
              color: 'var(--text-muted)'
            }}
          >
            This graph shows how additional repayments or interest rate changes will impact the cost and time of your loan.
          </p>
          <BalanceChart
            schedule={result.schedule}
            overlaySchedule={extraRows.length ? baselineResult.schedule : undefined}
            height={500}
          />
          
        </div>

        <RepaymentTable schedule={result.schedule} />
      </section>
    </div>
  );
};

interface LabeledNumberProps {
  id: string;
  label: string;
  prefix?: string;
  suffix?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}

const LabeledNumber: React.FC<LabeledNumberProps> = ({
  id,
  label,
  prefix,
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
        {prefix && (
          <span
            style={{
              position: 'absolute',
              left: '0.65rem',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.85rem',
              color: '#6b7280'
            }}
          >
            {prefix}
          </span>
        )}
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
            paddingLeft: prefix ? '1.6rem' : '0.75rem',
            paddingRight: suffix ? '1.4rem' : '0.75rem',
            fontSize: '0.9rem',
            borderRadius: '0.375rem',
            border: '1px solid #d1d5db',
            boxSizing: 'border-box'
          }}
        />
        {suffix && (
          <span
            style={{
              position: 'absolute',
              right: '0.65rem',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.85rem',
              color: '#6b7280'
            }}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

interface LabeledCurrencyProps {
  id: string;
  label: string;
  value: number;
  min?: number;
  onChange: (value: number) => void;
}

const LabeledCurrency: React.FC<LabeledCurrencyProps> = ({
  id,
  label,
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
          ? `$${new Intl.NumberFormat('en-AU', {
              maximumFractionDigits: 0
            }).format(value)}`
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
    setDisplay(
      numeric
        ? `$${new Intl.NumberFormat('en-AU', {
            maximumFractionDigits: 0
          }).format(nextValue)}`
        : ''
    );
    onChange(nextValue);
  };

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={(e) => handleChange(e.target.value)}
        style={{
          width: '100%',
          padding: '0.4rem 0.75rem',
          fontSize: '0.9rem',
          borderRadius: '0.375rem',
          border: '1px solid #d1d5db',
          boxSizing: 'border-box'
        }}
      />
    </div>
  );
};

interface SummaryCardProps {
  label: string;
  value: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value }) => (
  <div
    className="summary-card"
    style={{
      borderRadius: '0.5rem',
      border: '1px solid var(--border-subtle)'
    }}
  >
    <div
      style={{
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        marginBottom: '0.15rem'
      }}
    >
      {label}
    </div>
    <div style={{ fontWeight: 600 }}>{value}</div>
  </div>
);

interface SummaryRowProps {
  rowLabel: string;
  frequencyLabel: string;
  amount: number;
  totalInterest: number;
  totalPaid: number;
  payoffYear: number;
  regularPayment: number;
}

const SummaryRow: React.FC<SummaryRowProps> = ({
  rowLabel,
  frequencyLabel,
  amount,
  totalInterest,
  totalPaid,
  payoffYear,
  regularPayment
}) => {
  return (
    <div className="summary-row-inner">
      <SummaryCard
        label="Scenario"
        value={rowLabel}
      />
      <SummaryCard
        label={frequencyLabel}
        value={formatCurrency(regularPayment)}
      />
      <SummaryCard
        label="Principle"
        value={formatCurrency(amount)}
      />
      <SummaryCard
        label="Interest"
        value={formatCurrency(totalInterest)}
      />
      <SummaryCard
        label="Total"
        value={formatCurrency(totalPaid)}
      />
      <SummaryCard label="Loan completed" value={String(payoffYear)} />
    </div>
  );
};

function formatDateShort(dateIso: string): string {
  const d = new Date(dateIso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

// formatCurrency imported from lib/formatters

interface TableProps {
  schedule: ReturnType<typeof generateAmortisation>['schedule'];
}

type TableMode = 'perPeriod' | 'yearly';

const RepaymentTable: React.FC<TableProps> = ({ schedule }) => {
  const [mode, setMode] = useState<TableMode>('perPeriod');
  const [expanded, setExpanded] = useState<boolean>(false);

  const yearly = useMemo(() => {
    const byYear = new Map<
      number,
      { year: number; principal: number; interest: number; extra: number }
    >();

    schedule.forEach((row) => {
      const d = new Date(row.date);
      const year = d.getFullYear();
      const existing = byYear.get(year) ?? {
        year,
        principal: 0,
        interest: 0,
        extra: 0
      };
      existing.principal += row.principalPaid;
      existing.interest += row.interestCharged;
      existing.extra += row.extraRepayment;
      byYear.set(year, existing);
    });

    return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
  }, [schedule]);

  return (
    <div>
      <div
        style={{
          margin: '1.5rem 0 0.5rem',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: '0.75rem'
        }}
      >
        <h3 style={{ margin: 0 }}>Detailed repayment breakdown</h3>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{
            padding: '0.2rem 0.6rem',
            fontSize: '0.85rem',
            borderRadius: '9999px',
            border: '1px solid #d1d5db',
            background: '#ffffff',
            cursor: 'pointer'
          }}
        >
          {expanded ? 'Hide' : 'Show'}
        </button>
      </div>
      {expanded && (
        <>
          <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            <label>
              View:
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as TableMode)}
                style={{ marginLeft: '0.5rem' }}
              >
                <option value="perPeriod">Each repayment</option>
                <option value="yearly">Yearly totals</option>
              </select>
            </label>
          </div>
          <div
            style={{
              maxHeight: '320px',
              overflow: 'auto',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f9fafb' }}>
              {mode === 'perPeriod' ? (
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Repayment</th>
                  <th style={thStyle}>Interest</th>
                  <th style={thStyle}>Principle</th>
                  <th style={thStyle}>Balance</th>
                </tr>
              ) : (
                <tr>
                  <th style={thStyle}>Year</th>
                  <th style={thStyle}>Interest paid</th>
                  <th style={thStyle}>Principle paid</th>
                  <th style={thStyle}>Extra repayments</th>
                </tr>
              )}
            </thead>
            <tbody>
              {mode === 'perPeriod'
                ? schedule.map((row) => {
                    const repayment =
                      row.interestCharged + row.principalPaid;
                    return (
                      <tr key={row.periodIndex}>
                        <td style={tdStyle}>{row.periodIndex}</td>
                        <td style={tdStyle}>{formatDateShort(row.date)}</td>
                        <td style={tdStyle}>{formatCurrency(repayment)}</td>
                        <td style={tdStyle}>
                          {formatCurrency(row.interestCharged)}
                        </td>
                        <td style={tdStyle}>
                          {formatCurrency(row.principalPaid)}
                        </td>
                        <td style={tdStyle}>
                          {formatCurrency(row.closingBalance)}
                        </td>
                      </tr>
                    );
                  })
                : yearly.map((row) => (
                    <tr key={row.year}>
                      <td style={tdStyle}>{row.year}</td>
                      <td style={tdStyle}>{formatCurrency(row.interest)}</td>
                      <td style={tdStyle}>{formatCurrency(row.principal)}</td>
                      <td style={tdStyle}>{formatCurrency(row.extra)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  );
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.5rem',
  fontSize: '0.8rem',
  borderBottom: '1px solid #e5e7eb'
};

const tdStyle: React.CSSProperties = {
  padding: '0.4rem 0.5rem',
  fontSize: '0.8rem',
  borderBottom: '1px solid #f3f4f6'
};
