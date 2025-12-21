export type RepaymentFrequency = 'weekly' | 'fortnightly' | 'monthly';
export type RepaymentType = 'principal-interest' | 'interest-only';
export type ExtraRepaymentFrequency = 'one-off' | 'weekly' | 'fortnightly' | 'monthly' | 'annual' | 'custom';
export interface ExtraRepaymentRule {
    frequency: ExtraRepaymentFrequency;
    startMonth: number;
    endMonth?: number;
    amount: number;
    intervalMonths?: number;
}
export interface LoanInput {
    amount: number;
    annualInterestRate: number;
    years: number;
    frequency: RepaymentFrequency;
    type: RepaymentType;
    extraRepayment?: number;
    extraRepaymentRules?: ExtraRepaymentRule[];
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
export declare function calculateLoanSchedule(input: LoanInput): LoanSummary;
//# sourceMappingURL=index.d.ts.map