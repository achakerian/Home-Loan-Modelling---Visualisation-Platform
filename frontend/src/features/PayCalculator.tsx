import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';
import type { TooltipProps } from 'recharts';

import {
  buildPayModel,
  FREQUENCY_LABEL,
  PER_FACTOR,
  type PayModelInputs
} from './payModel';
import type {
  PayFrequency,
  TaxResidency,
  MedicareOption,
  SuperMode
} from './payTypes';
import {
  createTaxCalculators,
  DEFAULT_TAX_YEAR_ID,
  TAX_YEAR_CONFIGS,
  TAX_YEAR_MAP,
  type TaxYearId
} from './taxConfig';

const splitGrossIntoSalaryAndSuper = (
  packageTotal: number,
  superRate: number
) => {
  if (superRate <= 0) {
    return { employerSuper: 0, salaryPortionAnnual: packageTotal };
  }
  const salaryPortionAnnual = packageTotal / (1 + superRate);
  const employerSuper = packageTotal - salaryPortionAnnual;
  return { employerSuper, salaryPortionAnnual };
};

export const PayCalculator: React.FC = () => {
  const [viewMode, setViewMode] = useState<'simple' | 'advanced'>('simple');
  const [grossAnnual, setGrossAnnual] = useState<number>(90000);
  const [grossFytd, setGrossFytd] = useState<number | null>(null);
  const [frequency, setFrequency] = useState<PayFrequency>('weekly');
  const [residency, setResidency] = useState<TaxResidency>('resident');
  const [claimTaxFree, setClaimTaxFree] = useState<boolean>(true);
  const [medicare, setMedicare] = useState<MedicareOption>('full');
  const [hasHelp, setHasHelp] = useState<boolean>(false);
  const [superMode, setSuperMode] = useState<SuperMode>('ontop');
  const [superRate, setSuperRate] = useState<number>(12); // % default near current SG
  const [salarySacrifice, setSalarySacrifice] = useState<number>(0);
  const [taxYearId, setTaxYearId] = useState<TaxYearId>(DEFAULT_TAX_YEAR_ID);
  const taxYearConfig = TAX_YEAR_MAP[taxYearId];
  const taxCalcs = useMemo(
    () => createTaxCalculators(taxYearConfig),
    [taxYearConfig]
  );

  // Enforce a minimum Superannuation rate of 12% for
  // the 2025–26 financial year to reflect the higher
  // Superannuation Guarantee rate, while allowing lower
  // defaults for earlier years.
  const effectiveSuperRate =
    taxYearId === '2025-26' ? Math.max(superRate, 12) : superRate;

  const model = useMemo(
    () =>
      buildPayModel({
        viewMode,
        grossAnnual,
        grossFytd,
        frequency,
        residency,
        claimTaxFree,
        medicare,
        hasHelp,
        superMode,
        superRate: effectiveSuperRate,
        salarySacrifice
      } as PayModelInputs, {
        calculateAnnualTax: taxCalcs.calculateAnnualTax,
        calculateMedicare: taxCalcs.calculateMedicare,
        calculateHelpRepayments: taxCalcs.calculateHelpRepayments,
        splitGrossIntoSalaryAndSuper
      }),
    [
      viewMode,
      grossAnnual,
      grossFytd,
      frequency,
      residency,
      claimTaxFree,
      medicare,
      hasHelp,
      superMode,
      effectiveSuperRate,
      salarySacrifice,
      taxCalcs
    ]
  );

  const {
    useFytd,
    financialYearProgress,
    effectiveGrossAnnual,
    effectiveSalarySacrifice,
    taxableIncome,
    annualTax,
    medicareAmount,
    helpAmount,
    totalTax,
    netAnnual,
    employerSuper,
    salaryPortionAnnual,
    packageTotal
  } = model;

  const divisor = PER_FACTOR[frequency];
  const netPerPeriod = netAnnual / divisor;
  const taxPerPeriod = totalTax / divisor;
  const superPerPeriod = employerSuper / divisor;

  // Frequencies shown in the Pay summary table
  const freqOrder: PayFrequency[] = ['weekly', 'monthly', 'annual'];

  const includeSuperInBreakdown = superMode === 'included';

  const donutDataBase = [
    // Soft fills aligned with repayment charts
    {
      key: 'Net pay',
      value: netAnnual,
      color: 'rgba(37, 99, 235, 0.25)' // blue
    },
    {
      key: 'Income tax',
      value: annualTax,
      color: 'rgba(249, 115, 22, 0.28)' // orange
    },
    {
      key: 'Medicare levy',
      value: medicareAmount,
      color: 'rgba(249, 115, 22, 0.45)' // slightly deeper orange
    },
    {
      key: 'Super',
      value: includeSuperInBreakdown ? employerSuper : 0,
      color: 'rgba(34, 197, 94, 0.3)' // green
    }
  ];

  const donutData =
    hasHelp && helpAmount > 0
      ? [
          donutDataBase[0],
          donutDataBase[1],
          {
            key: 'HELP repayments',
            value: helpAmount,
            color: 'rgba(168, 85, 247, 0.35)' // soft purple, consistent alpha
          },
          donutDataBase[2],
          donutDataBase[3]
        ]
      : donutDataBase;

  const taxBandSegments = taxCalcs.calculateTaxBreakdown(
    taxableIncome,
    residency,
    claimTaxFree
  );

  const formatBandShort = (value: number) => {
    if (value >= 1000) {
      const thousands = Math.round(value / 1000);
      return `$${thousands}k`;
    }
    return currencyFormatter0.format(value);
  };

  const bandCapacities = taxBandSegments.map((seg) => {
    const upperRaw =
      seg.bandEnd === null ? taxableIncome : seg.bandEnd;
    const upper = Math.min(upperRaw, taxableIncome);
    return Math.max(upper - seg.bandStart, 0);
  });
  const maxBandCapacity =
    bandCapacities.reduce((max, c) => (c > max ? c : max), 0) || 1;

  const taxBandChartData = taxBandSegments.map((seg, index) => {
    const upperBoundRaw =
      seg.bandEnd === null
        ? taxableIncome
        : Math.min(seg.bandEnd, taxableIncome);
    const upperBound = Math.max(upperBoundRaw, seg.bandStart);

    const label =
      seg.bandEnd === null
        ? `${currencyFormatter0.format(seg.bandStart)}+`
        : `${currencyFormatter0.format(seg.bandStart)} – ${currencyFormatter0.format(
            upperBound
          )}`;

    const shortLabel =
      seg.bandEnd === null
        ? `${formatBandShort(seg.bandStart)}+`
        : `${formatBandShort(seg.bandStart)}–${formatBandShort(upperBound)}`;

    const taxAmount = seg.taxInBand;
    const incomeInBand = seg.incomeInBand;

    const shareOfTaxable =
      taxableIncome > 0 ? incomeInBand / taxableIncome : 0;
    const shareOfGross =
      effectiveGrossAnnual > 0 ? incomeInBand / effectiveGrossAnnual : 0;

    const bandCapacity = bandCapacities[index];
    const capacityPct = (bandCapacity / maxBandCapacity) * 100;
    const bandFill =
      bandCapacity > 0 ? Math.min(incomeInBand / bandCapacity, 1) : 0;
    const usedPct = capacityPct * bandFill;

    const medicareInBand = medicareAmount * shareOfTaxable;
    const helpInBand = helpAmount * shareOfTaxable;
    const superInBand = includeSuperInBreakdown
      ? employerSuper * shareOfGross
      : 0;

    const aggDeductionsInBand = medicareInBand + helpInBand + superInBand;

    const cashNetInBand = Math.max(
      incomeInBand - (taxAmount + aggDeductionsInBand),
      0
    );

    const totalForShare = cashNetInBand + aggDeductionsInBand + taxAmount || 1;
    const netShare = (cashNetInBand / totalForShare) * usedPct;
    const aggDedShare = (aggDeductionsInBand / totalForShare) * usedPct;
    const taxShare = (taxAmount / totalForShare) * usedPct;

    return {
      id: seg.id,
      label,
      shortLabel,
      netShare,
      aggDedShare,
      taxShare,
      netAmount: cashNetInBand,
      aggDeductionsAmount: aggDeductionsInBand,
      deductionsAmount: aggDeductionsInBand + taxAmount,
      taxAmount,
      incomeInBand,
      ratePct: seg.rate * 100
    };
  }).sort((a, b) => b.ratePct - a.ratePct);

  return (
    <div className="two-column-layout">
      <section aria-label="Pay & Tax inputs" className="inputs-pane">
        <header
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '0.3rem'
          }}
        >
          <h2 className="page-heading" style={{ marginBottom: 0 }}>
            Pay &amp; Tax Calculator
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '0.9rem',
              color: 'var(--text-muted)'
            }}
          >
            Estimate Australian take-home pay, tax and Superannuation from
            your gross salary.
          </p>
        </header>

        <form
          style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}
          aria-label="Pay & Tax assumptions"
        >
          <div
            style={{ marginBottom: '0.5rem' }}
          >
            <label>Pay frequency</label>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.35rem',
                marginTop: '0.25rem'
              }}
            >
              {(['weekly', 'fortnightly', 'monthly', 'annual', 'fytd'] as PayFrequency[]).map(
                (freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setFrequency(freq)}
                    style={{
                      padding: '0.18rem 0.75rem',
                      borderRadius: '999px',
                      border: '1px solid var(--control-border)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      backgroundColor:
                        frequency === freq ? '#2563eb' : 'var(--control-bg)',
                      color:
                        frequency === freq
                          ? '#ffffff'
                          : 'var(--text-main)'
                    }}
                  >
                    {FREQUENCY_LABEL[freq]}
                  </button>
                )
              )}
            </div>
          </div>

          <div
            style={{
              marginBottom: '0.75rem'
            }}
          >
            <div>
              {(() => {
                const unitLabel =
                  frequency === 'annual'
                    ? 'annual'
                    : frequency === 'fytd'
                    ? 'FYTD'
                    : FREQUENCY_LABEL[frequency].toLowerCase();
                const label = useFytd
                  ? 'Gross income (FYTD)'
                  : `Gross income (${unitLabel})`;
                const factor = frequency === 'annual' ? 1 : divisor;
                const displayValue = useFytd
                  ? grossFytd ?? grossAnnual * financialYearProgress
                  : grossAnnual / factor;
                return (
                  <LabeledCurrencyPC
                    id="pc-gross-income"
                    label={label}
                    varSymbol="G"
                    value={displayValue}
                    min={0}
                    onChange={(val) => {
                      if (useFytd) {
                        setGrossFytd(val);
                      } else {
                        setGrossAnnual(val * factor);
                      }
                    }}
                  />
                );
              })()}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '0.5rem'
            }}
          >
            <label style={{ marginBottom: 0 }}>HECS / HELP debt</label>
            <button
              type="button"
              onClick={() => setHasHelp((v) => !v)}
              style={{
                padding: '0.15rem 0.7rem',
                borderRadius: '999px',
                border: '1px solid var(--control-border)',
                backgroundColor: hasHelp ? '#2563eb' : 'var(--control-bg)',
                color: hasHelp ? '#ffffff' : 'var(--text-main)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {hasHelp ? 'Yes' : 'No'}
            </button>
          </div>

          {/* Simple / Advanced toggle below core (simple) inputs */}
          <div
            style={{
              marginTop: '0.75rem',
              marginBottom: viewMode === 'advanced' ? '0.25rem' : 0
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
              aria-label="Pay & Tax view mode"
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
                    viewMode === 'advanced' ? '#ffffff' : 'var(--text-main)'
                }}
              >
                Advanced
              </button>
            </div>
          </div>

          {viewMode === 'advanced' && (
            <>
              {/* Advanced options appear below toggle so simple layout stays fixed */}
              <div>
                <label htmlFor="pay-year">Financial year</label>
                <select
                  id="pay-year"
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

              <div>
                <label htmlFor="pc-residency">Tax residency</label>
                <select
                  id="pc-residency"
                  value={residency}
                  onChange={(e) =>
                    setResidency(e.target.value as TaxResidency)
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
                  <option value="resident">Australian resident</option>
                  <option value="foreign">Foreign resident</option>
                  <option value="whm">Working holiday maker</option>
                </select>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: '0.5rem',
                  marginTop: '0.75rem'
                }}
              >
                <label style={{ marginBottom: 0 }}>Tax-free threshold</label>
                <button
                  type="button"
                  onClick={() => setClaimTaxFree((v) => !v)}
                  style={{
                    padding: '0.15rem 0.7rem',
                    borderRadius: '999px',
                    border: '1px solid var(--control-border)',
                    backgroundColor: claimTaxFree
                      ? '#2563eb'
                      : 'var(--control-bg)',
                    color: claimTaxFree ? '#ffffff' : 'var(--text-main)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {claimTaxFree ? 'Yes' : 'No'}
                </button>
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <label htmlFor="pc-medicare">Medicare levy</label>
                <select
                  id="pc-medicare"
                  value={medicare}
                  onChange={(e) => setMedicare(e.target.value as MedicareOption)}
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
                  <option value="full">Full (2%)</option>
                  <option value="reduced">Reduced</option>
                  <option value="exempt">Exempt</option>
                </select>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: '0.5rem',
                  marginTop: '0.35rem'
                }}
              >
                <label style={{ marginBottom: 0 }}>
                  Superannuation Included in Salary
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setSuperMode((prev) =>
                      prev === 'included' ? 'ontop' : 'included'
                    )
                  }
                  style={{
                    padding: '0.15rem 0.7rem',
                    borderRadius: '999px',
                    border: '1px solid var(--control-border)',
                    backgroundColor:
                      superMode === 'included'
                        ? '#2563eb'
                        : 'var(--control-bg)',
                    color:
                      superMode === 'included'
                        ? '#ffffff'
                        : 'var(--text-main)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {superMode === 'included' ? 'Yes' : 'No'}
                </button>
              </div>

              <LabeledNumberPC
                id="pc-super-rate"
                label="Superannuation rate"
                varSymbol="s"
                suffix="%"
                value={superRate}
                min={0}
                max={30}
                step={0.1}
                onChange={setSuperRate}
              />

              <LabeledCurrencyPC
                id="pc-salary-sacrifice"
                label="Salary sacrifice (pre‑tax, annual)"
                varSymbol="SS"
                value={salarySacrifice}
                min={0}
                onChange={setSalarySacrifice}
              />
            </>
          )}
        </form>
      </section>

      <section aria-label="Pay & Tax results">
        {/* Summary row (annual figures) */}
        <div
          className="pay-summary-cards"
          style={{
            marginBottom: '0.9rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.25rem'
          }}
        >
          <SummaryCardPC
            label="Gross income (annual)"
            value={currencyFormatter0.format(effectiveGrossAnnual)}
          />
          <SummaryCardPC
            label="Net pay (annual)"
            value={currencyFormatter0.format(netAnnual)}
          />
          <SummaryCardPC
            label="Total tax (annual)"
            value={currencyFormatter0.format(totalTax)}
          />
          <SummaryCardPC
            label="Employer Superannuation (annual)"
            value={currencyFormatter0.format(employerSuper)}
          />
        </div>

        {/* Pay summary grid (all frequencies) + donut chart */}
        <div className="pay-results-grid">
          <div
            style={{
              borderRadius: '0.75rem',
              border: '1px solid var(--border-subtle)',
              padding: '0.9rem 1rem'
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Pay Summary</div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'minmax(0, 1.2fr) repeat(3, minmax(0, 1fr))',
                fontSize: '0.85rem',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '0.25rem',
                marginBottom: '0.25rem',
                columnGap: '1.1rem'
              }}
            >
              <div></div>
              {freqOrder.map((f) => (
              <div
                  key={f}
                  style={{
                    textAlign: 'right',
                    fontWeight: 500,
                    color: 'var(--text-muted)'
                  }}
                >
                  {FREQUENCY_LABEL[f]}
                </div>
              ))}
            </div>

            <PaySummaryRow
              label="Gross"
              values={freqOrder.map((f) => effectiveGrossAnnual / PER_FACTOR[f])}
            />
            <PaySummaryRow
              label="Net"
              values={freqOrder.map((f) => netAnnual / PER_FACTOR[f])}
            />
            <PaySummaryRow
              label="Super"
              values={freqOrder.map((f) => employerSuper / PER_FACTOR[f])}
            />
            <PaySummaryRow
              label="Tax"
              values={freqOrder.map((f) => totalTax / PER_FACTOR[f])}
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
              Gross Income Breakdown
            </div>
            <div className="cash-breakdown-layout">
              <div className="cash-breakdown-chart">
                <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="key"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {donutData.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CashBreakdownTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Persistent breakdown for each part of the pie */}
              <div className="cash-breakdown-legend">
                {(() => {
                  const totalCash =
                    netAnnual +
                    annualTax +
                    medicareAmount +
                    helpAmount +
                    (includeSuperInBreakdown ? employerSuper : 0);
                  return (
                    <>
                      <DonutBreakdownRow
                        label="Net pay"
                        value={netAnnual}
                        total={totalCash}
                        color="#60a5fa"
                      />
                      <DonutBreakdownRow
                        label="Income tax"
                        value={annualTax}
                        total={totalCash}
                        color="#fb923c"
                      />
                      <DonutBreakdownRow
                        label="Medicare levy"
                        value={medicareAmount}
                        total={totalCash}
                        color="#f97316"
                      />
                      {hasHelp && helpAmount > 0 && (
                        <DonutBreakdownRow
                          label="HELP repayments"
                          value={helpAmount}
                          total={totalCash}
                          color="#a855f7"
                        />
                      )}
                      {includeSuperInBreakdown && (
                        <DonutBreakdownRow
                          label="Superannuation"
                          value={employerSuper}
                          total={totalCash}
                          color="#22c55e"
                        />
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            borderRadius: '0.75rem',
            border: '1px solid var(--border-subtle)',
            padding: '0.9rem 1rem',
            marginBottom: '1rem'
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            Tax by threshold
          </div>
          {taxBandChartData.length === 0 ? (
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)'
              }}
            >
              No income tax is payable at the current taxable income.
            </div>
          ) : (
            <>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={taxBandChartData}
                    barCategoryGap={4}
                    margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
                  >
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis
                      type="category"
                      dataKey="shortLabel"
                      tick={{ fontSize: 10, angle: -20, textAnchor: 'end' }}
                      width={60}
                    />
                    <Tooltip
                      content={<TaxBandTooltip />}
                      cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                    />
                  <Bar
                    dataKey="netShare"
                    stackId="band"
                    // Match repayment principal blue: solid stroke with soft fill
                    fill="rgba(37, 99, 235, 0.25)"
                    stroke="#60a5fa"
                    name="Net"
                    label={renderNetLabel}
                  />
                  <Bar
                    dataKey="aggDedShare"
                    stackId="band"
                    // Match interest / cash-breakdown orange family
                    fill="rgba(249, 115, 22, 0.28)"
                    stroke="#fb923c"
                    name="Other deductions"
                    label={renderAggDedLabel}
                  />
                  <Bar
                    dataKey="taxShare"
                    stackId="band"
                    // Slightly deeper red for tax, but same soft style
                    fill="rgba(220, 38, 38, 0.3)"
                    stroke="#b91c1c"
                    name="Tax"
                    label={renderTaxLabel}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: '0.8rem',
                color: 'var(--text-muted)'
              }}
            >
              "Other deductions" combines Medicare levy, HELP repayments and
              superannuation (when included in gross pay). Itemised breakdown
              in the 'Gross Income Breakdown' section.
            </div>
          </>
        )}
        </div>
      </section>
    </div>
  );
};

const currencyFormatter0 = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0
});

const makeBandLabelRenderer = (field: string, color: string) =>
  (props: any) => {
    const { x, y, width, height, payload } = props;
    const amount = payload?.[field];
    if (!amount || height < 12 || width < 24) return null;

    const cx = x + width / 2;
    const cy = y + height / 2;

    return (
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: 10,
          fill: color
        }}
      >
        {currencyFormatter0.format(amount as number)}
      </text>
    );
  };

const renderNetLabel = makeBandLabelRenderer('netAmount', '#1d4ed8');
const renderAggDedLabel = makeBandLabelRenderer(
  'aggDeductionsAmount',
  '#92400e'
);
const renderTaxLabel = makeBandLabelRenderer('taxAmount', '#7f1d1d');

const CashBreakdownTooltip: React.FC<TooltipProps<number, string>> = ({
  active,
  payload
}) => {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  const label = item.name as string;
  const value = item.value as number;
  const percent = (item.payload as any)?.percent as number | undefined;

  const pctText =
    percent !== undefined
      ? `${(percent * 100).toFixed(0)}%`
      : undefined;

  return (
    <div
      style={{
        background: '#f9fafb',
        borderRadius: 8,
        padding: '0.6rem 0.9rem',
        boxShadow: '0 6px 18px rgba(15,23,42,0.25)',
        fontSize: '0.85rem',
        maxWidth: 260
      }}
    >
      <div
        style={{
          fontWeight: 600,
          marginBottom: 4,
          color: '#111827'
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.5rem',
          color: '#111827'
        }}
      >
        <span>{currencyFormatter0.format(value)}</span>
        {pctText && (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            {pctText}
          </span>
        )}
      </div>
    </div>
  );
};

const TaxBandTooltip: React.FC<TooltipProps<number, string>> = ({
  active,
  payload
}) => {
  if (!active || !payload || !payload.length) return null;
  const band = payload[0].payload as any;

  const rateText = `${band.ratePct.toFixed(1)}% tax`;
  const taxText = currencyFormatter0.format(band.taxAmount as number);
  const netText = currencyFormatter0.format(band.netAmount as number);
  const aggText = currencyFormatter0.format(
    band.aggDeductionsAmount as number
  );
  const deductionsText = currencyFormatter0.format(
    band.deductionsAmount as number
  );

  return (
    <div
      style={{
        background: '#f9fafb',
        borderRadius: 8,
        padding: '0.6rem 0.9rem',
        boxShadow: '0 6px 18px rgba(15,23,42,0.25)',
        fontSize: '0.85rem',
        maxWidth: 260
      }}
    >
      <div
        style={{
          fontWeight: 600,
          marginBottom: 6,
          color: '#111827'
        }}
      >
        {band.label}
      </div>
      <div
        style={{
          fontSize: '0.8rem',
          color: '#1d4ed8',
          marginBottom: 2
        }}
      >
        Net in this band: {netText}
      </div>
      <div
        style={{
          fontSize: '0.8rem',
          color: '#b91c1c'
        }}
      >
        {rateText} : {taxText}
      </div>
      <div
        style={{
          fontSize: '0.8rem',
          color: '#f97316'
        }}
      >
        Other deductions: {aggText}
      </div>
      <div
        style={{
          fontSize: '0.8rem',
          color: '#7f1d1d'
        }}
      >
        Total deductions (tax + other): {deductionsText}
      </div>
    </div>
  );
};

interface BreakdownRowProps {
  label: string;
  value: number;
  bold?: boolean;
}

const BreakdownRow: React.FC<BreakdownRowProps> = ({ label, value, bold }) => {
  return (
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
      <span>{label}</span>
      <span style={{ fontWeight: bold ? 600 : 400 }}>
        {value < 0 ? `−${currencyFormatter0.format(Math.abs(value))}` : currencyFormatter0.format(value)}
      </span>
    </div>
  );
};

interface BreakdownTableRowProps {
  label: string;
  annual: number;
  per: number;
  bold?: boolean;
}

const BreakdownTableRow: React.FC<BreakdownTableRowProps> = ({
  label,
  annual,
  per,
  bold
}) => {
  const weight = bold ? 600 : 400;
  return (
    <tr>
      <td style={{ padding: '0.25rem 0' }}>{label}</td>
      <td style={{ padding: '0.25rem 0', textAlign: 'right', fontWeight: weight }}>
        {annual < 0
          ? `−${currencyFormatter0.format(Math.abs(annual))}`
          : currencyFormatter0.format(annual)}
      </td>
      <td style={{ padding: '0.25rem 0', textAlign: 'right', fontWeight: weight }}>
        {per < 0
          ? `−${currencyFormatter0.format(Math.abs(per))}`
          : currencyFormatter0.format(per)}
      </td>
    </tr>
  );
};

interface PaySummaryRowProps {
  label: string;
  values: number[]; // order corresponds to freqOrder
  isNegative?: boolean;
}

const PaySummaryRow: React.FC<PaySummaryRowProps> = ({
  label,
  values,
  isNegative
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.2fr) repeat(3, minmax(0, 1fr))',
        fontSize: '0.85rem',
        padding: '0.25rem 0',
        columnGap: '1.1rem'
      }}
    >
      <div
        style={{
          textAlign: 'left'
        }}
      >
        {label}
      </div>
      {values.map((v, index) => (
        <div
          key={index}
          style={{
            textAlign: 'right',
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}
        >
          {isNegative && v > 0
            ? `−${currencyFormatter0.format(Math.abs(v))}`
            : currencyFormatter0.format(v)}
        </div>
      ))}
    </div>
  );
};

interface DonutBreakdownRowProps {
  label: string;
  value: number;
  total: number;
  color: string;
  showValueAndPct?: boolean;
}

const DonutBreakdownRow: React.FC<DonutBreakdownRowProps> = ({
  label,
  value,
  total,
  color,
  showValueAndPct = true
}) => {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.25rem',
        gap: '0.5rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '999px',
            backgroundColor: color
          }}
        />
        <span>{label}</span>
      </div>
      <div
        style={{
          textAlign: 'right',
          display: 'flex',
          alignItems: 'baseline',
          gap: '0.35rem'
        }}
      >
        {showValueAndPct && (
          <>
            <div style={{ fontWeight: 500 }}>
              {currencyFormatter0.format(value)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {pct.toFixed(0)}%
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface LabeledNumberPCProps {
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

const LabeledNumberPC: React.FC<LabeledNumberPCProps> = ({
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

interface LabeledCurrencyPCProps {
  id: string;
  label: string;
  varSymbol?: string;
  value: number;
  min?: number;
  onChange: (value: number) => void;
}

const LabeledCurrencyPC: React.FC<LabeledCurrencyPCProps> = ({
  id,
  label,
  varSymbol,
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

interface SummaryCardPCProps {
  label: string;
  value: string;
}

const SummaryCardPC: React.FC<SummaryCardPCProps> = ({ label, value }) => (
  <div
    className="summary-card"
    style={{
      borderRadius: '0.5rem',
      border: '1px solid var(--border-subtle)',
      width: '75%',
      margin: '0 auto'
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

// Relation pills (=, −) were used previously between cards; removed for a
// simpler layout but the component is kept here for potential future use.
