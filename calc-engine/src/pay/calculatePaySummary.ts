import {
  PayCalculateRequest,
  PayCalculateResponse,
  PayBreakdown,
  Residency
} from './types';

const clamp0 = (n: number) => (Number.isFinite(n) ? Math.max(0, n) : 0);

const periodsPerYear = {
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
  annually: 1
} as const;

type Bracket = { from: number; to?: number; base: number; rate: number };

const RESIDENT_BRACKETS: Record<'2024-25' | '2025-26', Bracket[]> = {
  '2024-25': [
    { from: 0, to: 18200, base: 0, rate: 0 },
    { from: 18200, to: 45000, base: 0, rate: 0.16 },
    { from: 45000, to: 135000, base: 4288, rate: 0.3 },
    { from: 135000, to: 190000, base: 31288, rate: 0.37 },
    { from: 190000, base: 51638, rate: 0.45 }
  ],
  '2025-26': [
    { from: 0, to: 18200, base: 0, rate: 0 },
    { from: 18200, to: 45000, base: 0, rate: 0.16 },
    { from: 45000, to: 135000, base: 4288, rate: 0.3 },
    { from: 135000, to: 190000, base: 31288, rate: 0.37 },
    { from: 190000, base: 51638, rate: 0.45 }
  ]
};

const MEDICARE_RATE = 0.02;

const HELP_2024_25: Array<{ from: number; to?: number; rate: number }> = [
  { from: 0, to: 54435, rate: 0 },
  { from: 54435, to: 62850, rate: 0.01 },
  { from: 62850, to: 66620, rate: 0.02 },
  { from: 66620, to: 70618, rate: 0.025 },
  { from: 70618, to: 74855, rate: 0.03 },
  { from: 74855, to: 79346, rate: 0.035 },
  { from: 79346, to: 84107, rate: 0.04 },
  { from: 84107, to: 89153, rate: 0.045 },
  { from: 89153, to: 94502, rate: 0.05 },
  { from: 94502, to: 100173, rate: 0.055 },
  { from: 100173, to: 106183, rate: 0.06 },
  { from: 106183, to: 112554, rate: 0.065 },
  { from: 112554, to: 119307, rate: 0.07 },
  { from: 119307, to: 126465, rate: 0.075 },
  { from: 126465, to: 134053, rate: 0.08 },
  { from: 134053, to: 142097, rate: 0.085 },
  { from: 142097, to: 150623, rate: 0.09 },
  { from: 150623, to: 159660, rate: 0.095 },
  { from: 159660, rate: 0.1 }
];

const HELP_2025_26 = {
  threshold: 67000,
  band1To: 124999,
  band1Rate: 0.15,
  band2From: 125000,
  band2Base: 8700,
  band2Rate: 0.17
};

function calcResidentIncomeTax(
  taxYear: '2024-25' | '2025-26',
  taxable: number
): number {
  const income = clamp0(taxable);
  const brackets = RESIDENT_BRACKETS[taxYear];
  const b = brackets.find(
    (x) => income >= x.from && (x.to === undefined || income <= x.to)
  );
  if (!b) return 0;
  return clamp0(b.base + (income - b.from) * b.rate);
}

function calcHelp2024_25(income: number): number {
  const x = clamp0(income);
  const row = HELP_2024_25.find(
    (r) => x >= r.from && (r.to === undefined || x <= r.to)
  );
  return x * (row?.rate ?? 0);
}

function calcHelp2025_26(income: number): number {
  const x = clamp0(income);
  if (x <= HELP_2025_26.threshold) return 0;
  if (x <= HELP_2025_26.band1To) {
    return (x - HELP_2025_26.threshold) * HELP_2025_26.band1Rate;
  }
  return (
    HELP_2025_26.band2Base +
    (x - HELP_2025_26.band2From) * HELP_2025_26.band2Rate
  );
}

function calcHelp(taxYear: '2024-25' | '2025-26', income: number): number {
  return taxYear === '2025-26'
    ? calcHelp2025_26(income)
    : calcHelp2024_25(income);
}

export function calculatePaySummary(
  req: PayCalculateRequest
): PayCalculateResponse {
  const residency: Residency = (req.residency ?? 'resident') as Residency;

  const annualSalary = clamp0(req.annualSalary);
  const deductions = clamp0(req.deductions);
  const superRate = clamp0(req.superRate);

  const taxableAnnual = clamp0(annualSalary - deductions);

  const incomeTaxAnnual = calcResidentIncomeTax(req.taxYear, taxableAnnual);
  const medicareAnnual = req.medicareExempt
    ? 0
    : taxableAnnual * MEDICARE_RATE;
  const helpAnnual = req.hasHELP ? calcHelp(req.taxYear, taxableAnnual) : 0;

  const totalWithheldAnnual = incomeTaxAnnual + medicareAnnual + helpAnnual;
  const netAnnual = annualSalary - totalWithheldAnnual;

  const periods = periodsPerYear[req.frequency];

  const annual: PayBreakdown = {
    gross: annualSalary,
    taxable: taxableAnnual,
    incomeTax: incomeTaxAnnual,
    medicareLevy: medicareAnnual,
    help: helpAnnual,
    totalWithheld: totalWithheldAnnual,
    net: netAnnual,
    employerSuper: annualSalary * superRate
  };

  const perPeriod: PayBreakdown = {
    gross: annual.gross / periods,
    taxable: annual.taxable / periods,
    incomeTax: annual.incomeTax / periods,
    medicareLevy: annual.medicareLevy / periods,
    help: annual.help / periods,
    totalWithheld: annual.totalWithheld / periods,
    net: annual.net / periods,
    employerSuper: annual.employerSuper / periods
  };

  const effectiveTaxRate =
    annual.gross > 0 ? annual.totalWithheld / annual.gross : 0;

  return {
    meta: {
      taxYear: req.taxYear,
      residency,
      tables: {
        residentIncomeTax: 'ATO resident rates (Stage 3)',
        helpRepayment:
          req.taxYear === '2025-26'
            ? 'HELP 2025–26 marginal'
            : 'HELP 2024–25 table',
        medicareLevy: 'Medicare levy 2% (exemption toggle only)',
        super: 'Employer super = gross × superRate'
      }
    },
    perPeriod,
    annual,
    effectiveTaxRate
  };
}
