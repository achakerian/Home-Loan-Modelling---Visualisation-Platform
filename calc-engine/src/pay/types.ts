export type TaxYearId = '2024-25' | '2025-26';

export type PayFrequency = 'weekly' | 'fortnightly' | 'monthly' | 'annually';

export type Residency = 'resident' | 'nonResident' | 'workingHoliday' | 'unknown';

export interface PayCalculateRequest {
  taxYear: TaxYearId;
  residency?: Residency;
  annualSalary: number;
  frequency: Exclude<PayFrequency, 'annually'>;
  hasHELP: boolean;
  medicareExempt: boolean;
  deductions: number;
  includeSuper: boolean;
  superRate: number;
}

export interface PayCalculateMeta {
  taxYear: TaxYearId;
  residency: Residency;
  tables: {
    residentIncomeTax: string;
    helpRepayment: string;
    medicareLevy: string;
    super: string;
  };
}

export interface PayBreakdown {
  gross: number;
  taxable: number;
  incomeTax: number;
  medicareLevy: number;
  help: number;
  totalWithheld: number;
  net: number;
  employerSuper: number;
}

export interface PayCalculateResponse {
  meta: PayCalculateMeta;
  perPeriod: PayBreakdown;
  annual: PayBreakdown;
  effectiveTaxRate: number;
}
