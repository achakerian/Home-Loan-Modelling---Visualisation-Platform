export type RepaymentFrequency = 'weekly' | 'fortnightly' | 'monthly';
export type RepaymentType = 'principal-interest' | 'interest-only';
export type ExtraRepaymentFrequency = 'one-off' | 'weekly' | 'fortnightly' | 'monthly' | 'annual' | 'custom';
export type ExtraRepaymentType = 'deposit' | 'withdraw';

export interface ExtraRepaymentRule {
  frequency: ExtraRepaymentFrequency;
  startMonth: number;
  endMonth?: number;
  amount: number;
  intervalMonths?: number;
  type?: ExtraRepaymentType;
}

export interface RateChange {
  startMonth: number;
  newRate: number;
}

export interface LoanInput {
  amount: number;
  annualInterestRate: number;
  years: number;
  frequency: RepaymentFrequency;
  type: RepaymentType;
  extraRepayment?: number;
  extraRepaymentRules?: ExtraRepaymentRule[];
  rateChanges?: RateChange[];
}

export interface LoanPeriod {
  period: number;
  repayment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface LoanSummary {
  repayment: number;
  totalInterest: number;
  totalPrincipal: number;
  schedule: LoanPeriod[];
}

const periodsPerYear: Record<RepaymentFrequency, number> = {
  weekly: 52,
  fortnightly: 26,
  monthly: 12
};

function calculateExtraRepaymentForPeriod(
  period: number,
  frequency: RepaymentFrequency,
  rules?: ExtraRepaymentRule[]
): number {
  if (!rules || rules.length === 0) return 0;

  const periodsInYear = periodsPerYear[frequency];
  const currentMonth = Math.floor((period - 1) / periodsInYear * 12);

  let totalExtra = 0;

  for (const rule of rules) {
    // Check if we're within the time range
    if (currentMonth < rule.startMonth) continue;
    if (rule.endMonth !== undefined && currentMonth > rule.endMonth) continue;

    // Determine sign based on type (deposit reduces loan, withdraw increases it)
    const sign = rule.type === 'withdraw' ? -1 : 1;

    // Handle different frequencies
    if (rule.frequency === 'one-off') {
      // One-off payment only at start month
      const startPeriod = Math.floor(rule.startMonth / 12 * periodsInYear) + 1;
      if (period === startPeriod) {
        totalExtra += rule.amount * sign;
      }
    } else if (rule.frequency === 'custom' && rule.intervalMonths) {
      // Custom interval in months
      const monthsSinceStart = currentMonth - rule.startMonth;
      if (monthsSinceStart >= 0 && monthsSinceStart % rule.intervalMonths < (12 / periodsInYear)) {
        totalExtra += rule.amount * sign;
      }
    } else if (rule.frequency === 'annual') {
      // Annual payment
      const monthsSinceStart = currentMonth - rule.startMonth;
      if (monthsSinceStart >= 0 && monthsSinceStart % 12 < (12 / periodsInYear)) {
        totalExtra += rule.amount * sign;
      }
    } else {
      // Weekly, fortnightly, monthly
      const rulePeriodsPerYear: Record<ExtraRepaymentFrequency, number> = {
        'one-off': 0,
        'weekly': 52,
        'fortnightly': 26,
        'monthly': 12,
        'annual': 1,
        'custom': 0
      };

      const rulePeriods = rulePeriodsPerYear[rule.frequency];
      if (rulePeriods > 0) {
        // Convert to the loan's frequency
        const extraPerLoanPeriod = rule.amount * (rulePeriods / periodsInYear);
        totalExtra += extraPerLoanPeriod * sign;
      }
    }
  }

  return totalExtra;
}

function getInterestRateForPeriod(
  period: number,
  frequency: RepaymentFrequency,
  baseRate: number,
  rateChanges?: RateChange[]
): number {
  if (!rateChanges || rateChanges.length === 0) return baseRate;

  const periodsInYear = periodsPerYear[frequency];
  const currentMonth = Math.floor((period - 1) / periodsInYear * 12);

  // Find the applicable rate change (use the most recent one before or at current month)
  let applicableRate = baseRate;
  for (const change of rateChanges) {
    if (change.startMonth <= currentMonth) {
      applicableRate = change.newRate;
    }
  }

  return applicableRate;
}

export function calculateLoanSchedule(input: LoanInput): LoanSummary {
  const initialRatePerPeriod = input.annualInterestRate / 100 / periodsPerYear[input.frequency];
  const totalPeriods = input.years * periodsPerYear[input.frequency];
  const schedule: LoanPeriod[] = [];

  // Calculate initial repayment based on initial rate
  let repayment = input.type === 'interest-only'
    ? input.amount * initialRatePerPeriod
    : initialRatePerPeriod === 0
      ? input.amount / totalPeriods
      : (input.amount * initialRatePerPeriod) / (1 - Math.pow(1 + initialRatePerPeriod, -totalPeriods));

  let balance = input.amount;
  let totalInterest = 0;
  let totalPrincipal = 0;
  let lastRateChangeMonth = -1;

  for (let period = 1; period <= totalPeriods; period++) {
    // Get current interest rate (may vary due to rate changes)
    const currentAnnualRate = getInterestRateForPeriod(
      period,
      input.frequency,
      input.annualInterestRate,
      input.rateChanges
    );
    const currentRatePerPeriod = currentAnnualRate / 100 / periodsPerYear[input.frequency];

    // Check if we've hit a new rate change period
    const periodsInYear = periodsPerYear[input.frequency];
    const currentMonth = Math.floor((period - 1) / periodsInYear * 12);

    // Find if there's a rate change at this month
    const rateChangeAtCurrentMonth = input.rateChanges?.find(
      rc => rc.startMonth === currentMonth && currentMonth !== lastRateChangeMonth
    );

    // Recalculate repayment when rate changes (only for P&I loans)
    if (rateChangeAtCurrentMonth && input.type === 'principal-interest') {
      const remainingPeriods = totalPeriods - period + 1;
      const newRatePerPeriod = rateChangeAtCurrentMonth.newRate / 100 / periodsInYear;

      repayment = newRatePerPeriod === 0
        ? balance / remainingPeriods
        : (balance * newRatePerPeriod) / (1 - Math.pow(1 + newRatePerPeriod, -remainingPeriods));

      lastRateChangeMonth = currentMonth;
    } else if (rateChangeAtCurrentMonth && input.type === 'interest-only') {
      // For interest-only, just update based on current balance and rate
      repayment = balance * currentRatePerPeriod;
      lastRateChangeMonth = currentMonth;
    }

    const interest = balance * currentRatePerPeriod;
    let principal = input.type === 'interest-only' ? 0 : repayment - interest;

    // Add simple extra repayment (legacy support)
    if (input.extraRepayment) {
      principal += input.extraRepayment;
    }

    // Add scheduled extra repayments (can be positive for deposits or negative for withdrawals)
    const scheduledExtra = calculateExtraRepaymentForPeriod(
      period,
      input.frequency,
      input.extraRepaymentRules
    );
    principal += scheduledExtra;

    // For positive principal, cap at balance to avoid negative balance
    // For negative principal (withdrawals), allow balance to increase
    if (principal > 0 && principal > balance) {
      principal = balance;
    }

    balance = Math.max(0, balance - principal);

    totalInterest += interest;
    totalPrincipal += principal;

    schedule.push({
      period,
      repayment: principal + interest,
      principal,
      interest,
      balance
    });

    if (balance === 0 && principal >= 0) break;
  }

  return {
    repayment,
    totalInterest,
    totalPrincipal,
    schedule
  };
}
