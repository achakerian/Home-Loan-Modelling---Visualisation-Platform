import React, { useMemo, useState } from 'react';
import type { TaxYearId } from '../../../calc-engine/src';
import { TAX_YEAR_CONFIGS, TAX_YEAR_MAP } from '../../../calc-engine/src';
import { InfoTooltipWithLink } from '../components/InfoTooltipWithLink';

const DEFAULT_GROSS = 90000;

const currencyFormatter0 = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0
});

export const SuperContributions: React.FC = () => {
  const [viewMode, setViewMode] = useState<'simple' | 'advanced'>('simple');
  const [taxYearId, setTaxYearId] = useState<TaxYearId>('2025-26');
  const [grossAnnual, setGrossAnnual] = useState<number>(DEFAULT_GROSS);
  const [superRate, setSuperRate] = useState<number>(12);
  const [grossIncludesSuper, setGrossIncludesSuper] = useState<boolean>(false);

  const taxYear = TAX_YEAR_MAP[taxYearId];
  const concessionalCap = taxYear.concessionalCap ?? 27500;

  const superRateDecimal = Math.max(superRate, 0) / 100;

  const { employerSuper, baseSalary } = useMemo(() => {
    if (!grossIncludesSuper) {
      return {
        baseSalary: grossAnnual,
        employerSuper: grossAnnual * superRateDecimal
      };
    }
    if (superRateDecimal <= 0) {
      return { baseSalary: grossAnnual, employerSuper: 0 };
    }
    const salaryPortion = grossAnnual / (1 + superRateDecimal);
    const sg = grossAnnual - salaryPortion;
    return { baseSalary: salaryPortion, employerSuper: sg };
  }, [grossAnnual, grossIncludesSuper, superRateDecimal]);

  const remainingCap = Math.max(concessionalCap - employerSuper, 0);
  const recommendedSacrifice = remainingCap;

  const weeklySacrifice = recommendedSacrifice / 52;
  const monthlySacrifice = recommendedSacrifice / 12;

  return (
    <div className="two-column-layout">
      <section className="inputs-pane" aria-label="Super contributions inputs">
        <header
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '0.3rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 className="page-heading" style={{ marginBottom: 0 }}>
              Concessional Super Contributions
            </h2>
            <InfoTooltipWithLink
              content="Tax-deductible superannuation contributions."
              targetSection="salary-sacrifice"
            />
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '0.9rem',
              color: 'var(--text-muted)'
            }}
          >
            Estimate how much pre-tax salary sacrifice you can add to
            Superannuation before reaching the concessional cap.
          </p>
        </header>

        <form
          style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}
          aria-label="Super contributions assumptions"
        >
          <div>
            <label htmlFor="sc-year">Financial year</label>
            <select
              id="sc-year"
              value={taxYearId}
              onChange={(e) => setTaxYearId(e.target.value as TaxYearId)}
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
              {TAX_YEAR_CONFIGS.map((config) => (
                <option key={config.id} value={config.id}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '0.5rem'
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="sc-gross">Gross income (annual)</label>
              <LabeledCurrencySC
                id="sc-gross"
                value={grossAnnual}
                min={0}
                onChange={setGrossAnnual}
              />
            </div>
            {viewMode === 'advanced' && (
              <button
                type="button"
                onClick={() =>
                  setGrossIncludesSuper((prev) => !prev)
                }
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '999px',
                  border: '1px solid var(--control-border)',
                  backgroundColor: grossIncludesSuper
                    ? '#2563eb'
                    : 'var(--control-bg)',
                  color: grossIncludesSuper
                    ? '#ffffff'
                    : 'var(--text-main)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {grossIncludesSuper ? 'Gross incl. Super' : 'Gross excl. Super'}
              </button>
            )}
          </div>

          {viewMode === 'advanced' && (
            <div>
              <label htmlFor="sc-super-rate">Superannuation rate</label>
              <input
                id="sc-super-rate"
                type="number"
                value={superRate}
                min={0}
                max={30}
                step={0.1}
                onChange={(e) => setSuperRate(Number(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.9rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--control-border)',
                  backgroundColor: 'var(--control-bg)',
                  color: 'var(--text-main)'
                }}
              />
            </div>
          )}

          <div
            style={{
              marginTop: '0.75rem'
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                borderRadius: '999px',
                border: '1px solid var(--control-border)',
                padding: '2px',
                backgroundColor: 'var(--control-bg)',
                gap: '2px'
              }}
              aria-label="Super contributions view mode"
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
                  backgroundColor:
                    viewMode === 'simple' ? '#2563eb' : 'transparent',
                  color:
                    viewMode === 'simple' ? '#ffffff' : 'var(--text-main)'
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
                  color:
                    viewMode === 'advanced'
                      ? '#ffffff'
                      : 'var(--text-main)'
                }}
              >
                Advanced
              </button>
            </div>
          </div>
        </form>
      </section>

      <section aria-label="Super contributions results">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}
        >
          <SummaryCardSC
            label="Concessional cap"
            value={currencyFormatter0.format(concessionalCap)}
          />
          <SummaryCardSC
            label="Employer Super (annual)"
            value={currencyFormatter0.format(employerSuper)}
          />
          <SummaryCardSC
            label="Recommended salary sacrifice (annual)"
            value={currencyFormatter0.format(recommendedSacrifice)}
          />
        </div>

        <div
          style={{
            borderRadius: '0.75rem',
            border: '1px solid var(--border-subtle)',
            padding: '0.9rem 1rem'
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            How much to sacrifice
          </div>
          <p
            style={{
              marginTop: 0,
              marginBottom: '0.75rem',
              fontSize: '0.9rem',
              color: 'var(--text-muted)'
            }}
          >
            Tell your employer to contribute this pre-tax amount to
            Superannuation at concessional tax rates.
          </p>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontSize: '0.9rem',
              display: 'grid',
              gap: '0.35rem'
            }}
          >
            <li>
              <strong>Per year:</strong> {currencyFormatter0.format(recommendedSacrifice)}
            </li>
            <li>
              <strong>Per month:</strong> {currencyFormatter0.format(monthlySacrifice)}
            </li>
            <li>
              <strong>Per week:</strong> {currencyFormatter0.format(weeklySacrifice)}
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};

interface LabeledCurrencySCProps {
  id: string;
  value: number;
  min?: number;
  onChange: (value: number) => void;
}

const LabeledCurrencySC: React.FC<LabeledCurrencySCProps> = ({
  id,
  value,
  min,
  onChange
}) => {
  const [display, setDisplay] = useState<string>('');

  React.useEffect(() => {
    if (!Number.isFinite(value)) {
      setDisplay('');
    } else {
      setDisplay(value ? currencyFormatter0.format(value) : '');
    }
  }, [value]);

  const handleChange = (raw: string) => {
    const numeric = raw.replace(/[^0-9]/g, '');
    const nextValue = numeric ? Number(numeric) : 0;
    if (min !== undefined && nextValue < min) {
      onChange(min);
      return;
    }
    setDisplay(numeric ? currencyFormatter0.format(nextValue) : '');
    onChange(nextValue);
  };

  return (
    <div>
      <div
        style={{
          position: 'relative',
          display: 'inline-flex',
          width: '100%'
        }}
      >
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
          G =
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={display}
          onChange={(e) => handleChange(e.target.value)}
          style={{
            width: '100%',
            padding: '0.4rem 0.75rem',
            paddingLeft: '2.4rem',
            fontSize: '0.9rem',
            borderRadius: '0.375rem',
            border: '1px solid var(--control-border)',
            boxSizing: 'border-box',
            backgroundColor: 'var(--control-bg)',
            color: 'var(--text-main)'
          }}
        />
      </div>
    </div>
  );
};

interface SummaryCardSCProps {
  label: string;
  value: string;
}

const SummaryCardSC: React.FC<SummaryCardSCProps> = ({ label, value }) => (
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

