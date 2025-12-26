export type RepaymentFrequency = 'weekly' | 'fortnightly' | 'monthly';

export type RepaymentType = 'principalAndInterest' | 'interestOnly';

export type RepaymentStrategy = 'reduceTerm' | 'reduceRepayment';

export interface RateChange {
  effectiveDate: string;
  annualRate: number;
}

export interface ExtraRepayment {
  effectiveDate: string;
  amount: number;
  recurring: boolean;
  endDate?: string;
}

export interface OffsetConfig {
  startingBalance: number;
  monthlyContribution: number;
}

export interface FeeConfig {
  upfrontFee: number;
  monthlyFee: number;
  annualFee: number;
}

export interface LoanInputs {
  amount: number;
  annualRate: number;
  years: number;
  frequency: RepaymentFrequency;
  repaymentType: RepaymentType;
  repaymentStrategy: RepaymentStrategy;
  startDate: string;
  rateChanges?: RateChange[];
  offset?: OffsetConfig;
  extraRepayments?: ExtraRepayment[];
  fees?: FeeConfig;
}

export interface PeriodRow {
  date: string;
  periodIndex: number;
  openingBalance: number;
  interestCharged: number;
  principalPaid: number;
  extraRepayment: number;
  feesApplied: number;
  offsetBalance: number;
  closingBalance: number;
}

export interface AmortisationSummary {
  regularPayment: number;
  totalInterest: number;
  totalFees: number;
  totalPaid: number;
  payoffDate: string;
}

export interface AmortisationResult {
  summary: AmortisationSummary;
  schedule: PeriodRow[];
}

export type ExtraFrequency =
  | 'oneOff'
  | 'weekly'
  | 'fortnightly'
  | 'annual'
  | 'customMonths';

export interface ExtraRule {
  startMonth: number;
  amount: number;
  frequency: ExtraFrequency;
  intervalMonths?: number;
  endMonth?: number;
}

function frequencyToPeriodsPerYear(frequency: RepaymentFrequency): number {
  if (frequency === 'weekly') return 52;
  if (frequency === 'fortnightly') return 26;
  return 12;
}

function nextPeriodDate(current: Date, frequency: RepaymentFrequency): Date {
  const d = new Date(current.getTime());
  if (frequency === 'weekly') {
    d.setDate(d.getDate() + 7);
  } else if (frequency === 'fortnightly') {
    d.setDate(d.getDate() + 14);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d;
}

function findCurrentRate(
  baseRate: number,
  changes: RateChange[] | undefined,
  date: Date
): number {
  if (!changes || changes.length === 0) return baseRate;
  const sorted = [...changes].sort((a, b) =>
    a.effectiveDate.localeCompare(b.effectiveDate)
  );
  let rate = baseRate;
  for (const change of sorted) {
    const changeDate = new Date(change.effectiveDate);
    if (changeDate <= date) {
      rate = change.annualRate;
    } else {
      break;
    }
  }
  return rate;
}

function isSameOrAfter(a: Date, b: Date): boolean {
  return a.getTime() >= b.getTime();
}

function calculateBasePayment(
  amount: number,
  annualRate: number,
  years: number,
  frequency: RepaymentFrequency
): number {
  const paymentsPerYear = frequencyToPeriodsPerYear(frequency);
  const n = years * paymentsPerYear;
  const r = annualRate / 100 / paymentsPerYear;
  if (r === 0) {
    return amount / n;
  }
  return (amount * r) / (1 - Math.pow(1 + r, -n));
}

export function generateAmortisation(inputs: LoanInputs): AmortisationResult {
  const {
    amount,
    annualRate,
    years,
    frequency,
    repaymentType,
    repaymentStrategy,
    startDate,
    rateChanges,
    offset,
    extraRepayments,
    fees
  } = inputs;

  const paymentsPerYear = frequencyToPeriodsPerYear(frequency);
  const maxPeriods = years * paymentsPerYear;
  const start = new Date(startDate);

  let balance = amount;
  let offsetBalance = offset?.startingBalance ?? 0;
  let currentDate = new Date(start.getTime());

  const schedule: PeriodRow[] = [];
  let totalInterest = 0;
  let totalFees = fees?.upfrontFee ?? 0;
  let totalPaid = fees?.upfrontFee ?? 0;

  let regularPayment = calculateBasePayment(
    amount,
    annualRate,
    years,
    frequency
  );

  for (let i = 0; i < maxPeriods && balance > 0; i += 1) {
    const periodIndex = i + 1;
    const currentRate = findCurrentRate(annualRate, rateChanges, currentDate);
    const periodRate = currentRate / 100 / paymentsPerYear;

    const effectiveBalance = Math.max(0, balance - offsetBalance);
    const interestCharged = effectiveBalance * periodRate;

    let periodPayment = regularPayment;
    if (repaymentType === 'interestOnly') {
      periodPayment = interestCharged;
    }

    let extra = 0;
    if (extraRepayments && extraRepayments.length > 0) {
      for (const er of extraRepayments) {
        const erDate = new Date(er.effectiveDate);
        const endDate = er.endDate ? new Date(er.endDate) : undefined;

        if (er.recurring) {
          const afterStart = isSameOrAfter(currentDate, erDate);
          const beforeEnd = !endDate || currentDate <= endDate;
          if (afterStart && beforeEnd) {
            extra += er.amount;
          }
        } else if (
          currentDate.getFullYear() === erDate.getFullYear() &&
          currentDate.getMonth() === erDate.getMonth() &&
          currentDate.getDate() === erDate.getDate()
        ) {
          extra += er.amount;
        }
      }
    }

    let periodFees = 0;
    if (fees) {
      periodFees += fees.monthlyFee;
      if (paymentsPerYear === 52) {
        periodFees = (fees.monthlyFee * 12) / 52;
      } else if (paymentsPerYear === 26) {
        periodFees = (fees.monthlyFee * 12) / 26;
      }
      if (periodIndex % paymentsPerYear === 1) {
        periodFees += fees.annualFee;
      }
    }

    if (offset && frequency === 'monthly') {
      offsetBalance += offset.monthlyContribution;
    }

    const principalPaid = Math.min(
      Math.max(periodPayment - interestCharged, 0) + extra,
      balance
    );
    const closingBalance = balance - principalPaid;

    totalInterest += interestCharged;
    totalFees += periodFees;
    totalPaid += periodPayment + extra + periodFees;

    schedule.push({
      date: currentDate.toISOString(),
      periodIndex,
      openingBalance: balance,
      interestCharged,
      principalPaid,
      extraRepayment: extra,
      feesApplied: periodFees,
      offsetBalance,
      closingBalance
    });

    balance = closingBalance;

    if (repaymentStrategy === 'reduceRepayment' && repaymentType === 'principalAndInterest') {
      const remainingYears = (maxPeriods - periodIndex) / paymentsPerYear;
      if (remainingYears > 0) {
        const newBaseRate = findCurrentRate(annualRate, rateChanges, currentDate);
        regularPayment = calculateBasePayment(
          balance,
          newBaseRate,
          remainingYears,
          frequency
        );
      }
    }

    currentDate = nextPeriodDate(currentDate, frequency);
  }

  const payoffDate = schedule.length
    ? schedule[schedule.length - 1].date
    : start.toISOString();

  return {
    summary: {
      regularPayment,
      totalInterest,
      totalFees,
      totalPaid,
      payoffDate
    },
    schedule
  };
}

export interface ScenarioComparisonSummary {
  baselineTotalInterest: number;
  withExtrasTotalInterest: number;
  interestSaved: number;
  baselineTotalPaid: number;
  withExtrasTotalPaid: number;
  totalPaidSaved: number;
  baselinePeriods: number;
  withExtrasPeriods: number;
  periodsSaved: number;
  yearsSaved: number;
  baselinePayoffYear: number;
  withExtrasPayoffYear: number;
}

export interface ScenarioWithExtrasResult {
  baseline: AmortisationResult;
  withExtras: AmortisationResult;
  comparison: ScenarioComparisonSummary;
}

export function generateScenarioWithExtras(
  inputs: LoanInputs,
  extraRules: ExtraRule[]
): ScenarioWithExtrasResult {
  const baseline = generateAmortisation(inputs);

  if (!extraRules.length) {
    const payoffYear = new Date(baseline.summary.payoffDate).getFullYear();
    return {
      baseline,
      withExtras: baseline,
      comparison: {
        baselineTotalInterest: baseline.summary.totalInterest,
        withExtrasTotalInterest: baseline.summary.totalInterest,
        interestSaved: 0,
        baselineTotalPaid: baseline.summary.totalPaid,
        withExtrasTotalPaid: baseline.summary.totalPaid,
        totalPaidSaved: 0,
        baselinePeriods: baseline.schedule.length,
        withExtrasPeriods: baseline.schedule.length,
        periodsSaved: 0,
        yearsSaved: 0,
        baselinePayoffYear: payoffYear,
        withExtrasPayoffYear: payoffYear
      }
    };
  }

  const startDate = new Date(inputs.startDate);
  const periodsPerYear = frequencyToPeriodsPerYear(inputs.frequency);

  const extras: ExtraRepayment[] = [];

  for (const rule of extraRules) {
    if (!rule.amount || rule.amount <= 0) continue;

    const effectiveStart = new Date(startDate.getTime());
    effectiveStart.setMonth(effectiveStart.getMonth() + rule.startMonth);
    const effectiveDate = effectiveStart.toISOString().slice(0, 10);

    let effectiveEndDate: string | undefined;
    if (typeof rule.endMonth === 'number' && rule.endMonth >= 0) {
      const effectiveEnd = new Date(startDate.getTime());
      effectiveEnd.setMonth(effectiveEnd.getMonth() + rule.endMonth);
      effectiveEndDate = effectiveEnd.toISOString().slice(0, 10);
    }

    if (rule.frequency === 'oneOff') {
      extras.push({
        effectiveDate,
        amount: rule.amount,
        recurring: false,
        endDate: effectiveEndDate
      });
      continue;
    }

    let perPeriodAmount = rule.amount;

    if (inputs.frequency === 'monthly') {
      switch (rule.frequency) {
        case 'weekly':
          perPeriodAmount = (rule.amount * 52) / 12;
          break;
        case 'fortnightly':
          perPeriodAmount = (rule.amount * 26) / 12;
          break;
        case 'annual':
          perPeriodAmount = rule.amount / 12;
          break;
        case 'customMonths': {
          const interval = rule.intervalMonths && rule.intervalMonths > 0
            ? rule.intervalMonths
            : 1;
          perPeriodAmount = rule.amount / interval;
          break;
        }
        default:
          perPeriodAmount = rule.amount;
      }
    } else {
      perPeriodAmount = rule.amount * (12 / periodsPerYear);
    }

    extras.push({
      effectiveDate,
      amount: perPeriodAmount,
      recurring: true,
      endDate: effectiveEndDate
    });
  }

  const withExtras = extras.length
    ? generateAmortisation({
        ...inputs,
        extraRepayments: extras
      })
    : baseline;

  const baselineInterest = baseline.summary.totalInterest;
  const extrasInterest = withExtras.summary.totalInterest;
  const interestSaved = baselineInterest - extrasInterest;

  const baselineTotalPaid = baseline.summary.totalPaid;
  const extrasTotalPaid = withExtras.summary.totalPaid;
  const totalPaidSaved = baselineTotalPaid - extrasTotalPaid;

  const baselinePeriods = baseline.schedule.length;
  const extrasPeriods = withExtras.schedule.length;
  const periodsSaved = baselinePeriods - extrasPeriods;
  const yearsSaved =
    periodsSaved / frequencyToPeriodsPerYear(inputs.frequency);

  const baselinePayoffYear = new Date(
    baseline.summary.payoffDate
  ).getFullYear();
  const withExtrasPayoffYear = new Date(
    withExtras.summary.payoffDate
  ).getFullYear();

  return {
    baseline,
    withExtras,
    comparison: {
      baselineTotalInterest: baselineInterest,
      withExtrasTotalInterest: extrasInterest,
      interestSaved,
      baselineTotalPaid,
      withExtrasTotalPaid: extrasTotalPaid,
      totalPaidSaved,
      baselinePeriods,
      withExtrasPeriods: extrasPeriods,
      periodsSaved,
      yearsSaved,
      baselinePayoffYear,
      withExtrasPayoffYear
    }
  };
}

export interface IncomeInput {
  amountAnnual: number;
  shadingFactor: number;
}

export interface LiabilityInput {
  monthlyRepayment: number;
}

export interface BorrowingCapacityInputs {
  incomes: IncomeInput[];
  livingExpensesMonthly: number;
  dependants: number;
  creditCardLimits: number;
  personalLoans: LiabilityInput[];
  carLoans: LiabilityInput[];
  hasHECS: boolean;
  baseRate: number;
  bufferRate: number;
  termYears: number;
  repaymentType: RepaymentType;
  expenseFloorMonthly?: number;
  depositPercent?: number;
}

export interface BorrowingCapacityResult {
  maxBorrowing: number;
  estimatedPurchasePrice: number;
  assessmentRate: number;
  limitingFactors: string[];
   monthlyRepaymentAtAssessment: number;
   assessedExpensesMonthly: number;
   totalOtherDebt: number;
  capacityByRate: { rate: number; capacity: number }[];
}

export function estimateBorrowingCapacity(
  inputs: BorrowingCapacityInputs
): BorrowingCapacityResult {
  const {
    incomes,
    livingExpensesMonthly,
    dependants,
    creditCardLimits,
    personalLoans,
    carLoans,
    hasHECS,
    baseRate,
    bufferRate,
    termYears,
    expenseFloorMonthly,
    depositPercent
  } = inputs;

  const shadedIncomeMonthly =
    incomes.reduce(
      (sum, income) => sum + (income.amountAnnual * income.shadingFactor) / 12,
      0
    );

  const minExpenses = expenseFloorMonthly ?? 2000 + dependants * 400;
  const expensesMonthly = Math.max(livingExpensesMonthly, minExpenses);

  const personalDebt = personalLoans.reduce(
    (sum, l) => sum + l.monthlyRepayment,
    0
  );
  const carDebt = carLoans.reduce((sum, l) => sum + l.monthlyRepayment, 0);

  const cardDebt = (creditCardLimits * 0.0375) || 0;
  const hecsDebt = hasHECS ? shadedIncomeMonthly * 0.07 : 0;

  const totalOtherDebt = personalDebt + carDebt + cardDebt + hecsDebt;

  const assessmentRate = baseRate + bufferRate;
  const paymentsPerYear = 12;
  const n = termYears * paymentsPerYear;
  const r = assessmentRate / 100 / paymentsPerYear;

  const availableForMortgage = shadedIncomeMonthly - expensesMonthly - totalOtherDebt;

  let paymentFactor = 0;
  if (r === 0) {
    paymentFactor = 1 / n;
  } else {
    paymentFactor = r / (1 - Math.pow(1 + r, -n));
  }

  const maxBorrowingRaw = availableForMortgage > 0 ? availableForMortgage / paymentFactor : 0;
  const maxBorrowing = Math.max(maxBorrowingRaw, 0);

  const lvr = 1 - (depositPercent ?? 0.2);
  const estimatedPurchasePrice = lvr > 0 ? maxBorrowing / lvr : maxBorrowing;
  const monthlyRepaymentAtAssessment = maxBorrowing * paymentFactor;

  const limitingFactors: string[] = [];
  if (availableForMortgage <= 0) {
    limitingFactors.push('Expenses and existing debts exceed shaded income.');
  } else {
    if (expensesMonthly > shadedIncomeMonthly * 0.5) {
      limitingFactors.push('High living expenses relative to income.');
    }
    if (creditCardLimits > 0) {
      limitingFactors.push('Credit card limits reduce borrowing capacity.');
    }
    if (hasHECS) {
      limitingFactors.push('HECS/HELP reduces net income available.');
    }
  }

  const capacityByRate: { rate: number; capacity: number }[] = [];
  for (let delta = -1; delta <= 3; delta += 1) {
    const rate = assessmentRate + delta;
    const rr = rate / 100 / paymentsPerYear;
    let pf = 0;
    if (rr === 0) {
      pf = 1 / n;
    } else {
      pf = rr / (1 - Math.pow(1 + rr, -n));
    }
    const capacity = availableForMortgage > 0 ? availableForMortgage / pf : 0;
    capacityByRate.push({ rate, capacity: Math.max(capacity, 0) });
  }

  return {
    maxBorrowing,
    estimatedPurchasePrice,
    assessmentRate,
    monthlyRepaymentAtAssessment,
    assessedExpensesMonthly: expensesMonthly,
    totalOtherDebt,
    limitingFactors,
    capacityByRate
  };
}

// Pay calculation types
export type {
  PayCalculateRequest,
  PayCalculateResponse,
  TaxYearId,
  PayFrequency,
  Residency
} from './pay/types';

// Tax year data types
export type { TaxYearConfig } from './pay/taxYearData';

// Pay calculation functions
export { calculatePaySummary } from './pay/calculatePaySummary';
export { calculateLITO } from './pay/calculateLITO';
export { calculateMedicareSurcharge } from './pay/calculateMedicareSurcharge';
export { getConcessionalCap } from './pay/getConcessionalCap';

// Tax year configuration data
export { TAX_YEAR_CONFIGS, TAX_YEAR_MAP, DEFAULT_TAX_YEAR } from './pay/taxYearData';
