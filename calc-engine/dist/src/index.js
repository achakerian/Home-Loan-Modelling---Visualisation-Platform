const periodsPerYear = {
    weekly: 52,
    fortnightly: 26,
    monthly: 12
};
function calculateExtraRepaymentForPeriod(period, frequency, rules) {
    if (!rules || rules.length === 0)
        return 0;
    const periodsInYear = periodsPerYear[frequency];
    const currentMonth = Math.floor((period - 1) / periodsInYear * 12);
    let totalExtra = 0;
    for (const rule of rules) {
        // Check if we're within the time range
        if (currentMonth < rule.startMonth)
            continue;
        if (rule.endMonth !== undefined && currentMonth > rule.endMonth)
            continue;
        // Handle different frequencies
        if (rule.frequency === 'one-off') {
            // One-off payment only at start month
            const startPeriod = Math.floor(rule.startMonth / 12 * periodsInYear) + 1;
            if (period === startPeriod) {
                totalExtra += rule.amount;
            }
        }
        else if (rule.frequency === 'custom' && rule.intervalMonths) {
            // Custom interval in months
            const monthsSinceStart = currentMonth - rule.startMonth;
            if (monthsSinceStart >= 0 && monthsSinceStart % rule.intervalMonths < (12 / periodsInYear)) {
                totalExtra += rule.amount;
            }
        }
        else if (rule.frequency === 'annual') {
            // Annual payment
            const monthsSinceStart = currentMonth - rule.startMonth;
            if (monthsSinceStart >= 0 && monthsSinceStart % 12 < (12 / periodsInYear)) {
                totalExtra += rule.amount;
            }
        }
        else {
            // Weekly, fortnightly, monthly
            const rulePeriodsPerYear = {
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
                totalExtra += extraPerLoanPeriod;
            }
        }
    }
    return totalExtra;
}
export function calculateLoanSchedule(input) {
    const ratePerPeriod = input.annualInterestRate / 100 / periodsPerYear[input.frequency];
    const totalPeriods = input.years * periodsPerYear[input.frequency];
    const schedule = [];
    const repayment = input.type === 'interest-only'
        ? input.amount * ratePerPeriod
        : ratePerPeriod === 0
            ? input.amount / totalPeriods
            : (input.amount * ratePerPeriod) / (1 - Math.pow(1 + ratePerPeriod, -totalPeriods));
    let balance = input.amount;
    let totalInterest = 0;
    let totalPrincipal = 0;
    for (let period = 1; period <= totalPeriods; period++) {
        const interest = balance * ratePerPeriod;
        let principal = input.type === 'interest-only' ? 0 : repayment - interest;
        // Add simple extra repayment (legacy support)
        if (input.extraRepayment) {
            principal += input.extraRepayment;
        }
        // Add scheduled extra repayments
        const scheduledExtra = calculateExtraRepaymentForPeriod(period, input.frequency, input.extraRepaymentRules);
        principal += scheduledExtra;
        if (principal > balance) {
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
        if (balance === 0)
            break;
    }
    return {
        repayment,
        totalInterest,
        totalPrincipal,
        schedule
    };
}
//# sourceMappingURL=index.js.map