# calc-engine

Pure TypeScript calculation engine for Australian financial calculations.

## Overview

This package provides framework-agnostic calculation functions for:
- **Loan amortisation** - Mortgage/loan repayment schedules with support for:
  - Principal & Interest or Interest Only loans
  - Extra repayments and offset accounts
  - Rate changes over time
  - Weekly, fortnightly, or monthly frequencies
- **Borrowing capacity** - Estimate maximum borrowing power based on income, expenses, and debts
- **Pay calculations** - Australian PAYG tax, Medicare levy, and HELP/HECS repayments

## Design Principles

- **Zero dependencies** - Pure TypeScript with no runtime dependencies
- **Framework agnostic** - No React, Vue, or other framework coupling
- **Type safe** - Full TypeScript type definitions
- **Pure functions** - All calculations are deterministic and side-effect free
- **Tree shakeable** - Import only what you need

## Usage

### Loan Amortisation

```typescript
import { generateAmortisation, type LoanInputs } from 'calc-engine';

const inputs: LoanInputs = {
  amount: 650000,
  annualRate: 5.85,
  years: 30,
  frequency: 'monthly',
  repaymentType: 'principalAndInterest',
  repaymentStrategy: 'reduceTerm',
  startDate: '2024-01-01'
};

const result = generateAmortisation(inputs);
console.log(result.summary.regularPayment); // Monthly payment
console.log(result.summary.totalInterest); // Total interest over life of loan
console.log(result.schedule); // Array of period-by-period breakdown
```

### Borrowing Capacity

```typescript
import { estimateBorrowingCapacity, type BorrowingCapacityInputs } from 'calc-engine';

const inputs: BorrowingCapacityInputs = {
  incomes: [{ amountAnnual: 90000, shadingFactor: 1.0 }],
  livingExpensesMonthly: 3000,
  dependants: 0,
  creditCardLimits: 10000,
  personalLoans: [],
  carLoans: [],
  hasHECS: false,
  baseRate: 6.5,
  bufferRate: 3.0,
  termYears: 30,
  repaymentType: 'principalAndInterest'
};

const result = estimateBorrowingCapacity(inputs);
console.log(result.maxBorrowing); // Maximum loan amount
console.log(result.estimatedPurchasePrice); // Including deposit
```

### Pay Calculations

**Comprehensive Australian Tax Calculations** - Single source of truth for all tax years.

**Supported Tax Years:** 2020-21 through 2025-26 (6 years)

**Features:**
- ✅ Resident, Non-resident, and Working Holiday Maker (WHM) tax calculations
- ✅ Both legacy (2024-25 and earlier) and marginal (2025-26+) HELP systems
- ✅ Medicare levy with low-income phase-in support
- ✅ Medicare Levy Surcharge (MLS) for those without private health
- ✅ Low Income Tax Offset (LITO) calculations
- ✅ Superannuation (with support for package vs base salary)
- ✅ Pay frequency support: weekly, fortnightly, monthly, annually

#### Basic Example

```typescript
import { calculatePaySummary, type PayCalculateRequest } from 'calc-engine';

const request: PayCalculateRequest = {
  taxYear: '2025-26',
  residency: 'resident', // 'resident' | 'nonResident' | 'workingHoliday'
  annualSalary: 90000,
  frequency: 'fortnightly',
  hasHELP: false,
  medicareExempt: false,
  deductions: 0,
  includeSuper: false,
  superRate: 0.115
};

const result = calculatePaySummary(request);
console.log(result.perPeriod.net); // Net pay per fortnight
console.log(result.annual.incomeTax); // Annual income tax
console.log(result.annual.medicareLevy); // Medicare levy
console.log(result.annual.help); // HELP repayment
console.log(result.effectiveTaxRate); // Effective tax rate
```

#### Advanced Example - Detailed Pay Calculator

```typescript
import {
  calculatePaySummary,
  calculateLITO,
  calculateMedicareSurcharge
} from 'calc-engine';

// Base calculation
const baseCalc = calculatePaySummary({
  taxYear: '2024-25',
  residency: 'resident',
  annualSalary: 95000,
  frequency: 'monthly',
  hasHELP: true,
  medicareExempt: false,
  deductions: 5000, // Salary sacrifice, etc.
  includeSuper: false,
  superRate: 0.115
});

// Additional calculations
const lito = calculateLITO('2024-25', baseCalc.annual.taxable);
const mls = calculateMedicareSurcharge(
  '2024-25',
  baseCalc.annual.taxable,
  false // hasPrivateHealth
);

console.log('Low Income Tax Offset:', lito);
console.log('Medicare Levy Surcharge:', mls);
```

#### Non-Resident Example

```typescript
const nonResidentCalc = calculatePaySummary({
  taxYear: '2024-25',
  residency: 'nonResident',
  annualSalary: 80000,
  frequency: 'monthly',
  hasHELP: false,
  medicareExempt: false, // Auto-exempt for non-residents
  deductions: 0,
  includeSuper: false,
  superRate: 0
});

// Non-residents automatically exempt from Medicare levy
console.log(nonResidentCalc.annual.medicareLevy); // 0
```

#### Tax Year Data Access

```typescript
import { TAX_YEAR_CONFIGS, TAX_YEAR_MAP, getConcessionalCap } from 'calc-engine';

// Get all available tax years
console.log(TAX_YEAR_CONFIGS.map(y => y.label));
// ['2025–26 (current)', '2024–25', '2023–24', ...]

// Access specific year configuration
const config2025 = TAX_YEAR_MAP['2025-26'];
console.log(config2025.help.isMarginalSystem); // true (marginal HELP)

const config2024 = TAX_YEAR_MAP['2024-25'];
console.log(config2024.help.isMarginalSystem); // false (legacy HELP)

// Get concessional super cap
const cap = getConcessionalCap('2025-26'); // $30,000
```

## API Reference

### Loan Functions

- `generateAmortisation(inputs: LoanInputs): AmortisationResult`
- `generateScenarioWithExtras(inputs: LoanInputs, extraRules: ExtraRule[]): ScenarioWithExtrasResult`

### Capacity Functions

- `estimateBorrowingCapacity(inputs: BorrowingCapacityInputs): BorrowingCapacityResult`

### Pay Functions

- `calculatePaySummary(request: PayCalculateRequest): PayCalculateResponse` - Main pay calculation function
- `calculateLITO(taxYear: TaxYearId, taxableIncome: number): number` - Low Income Tax Offset
- `calculateMedicareSurcharge(taxYear: TaxYearId, taxableIncome: number, hasPrivateHealth: boolean): number` - Medicare Levy Surcharge
- `getConcessionalCap(taxYear: TaxYearId): number` - Superannuation concessional contribution cap

### Tax Year Data

- `TAX_YEAR_CONFIGS: TaxYearConfig[]` - Array of all 6 tax year configurations
- `TAX_YEAR_MAP: Record<TaxYearId, TaxYearConfig>` - O(1) lookup map by tax year ID
- `DEFAULT_TAX_YEAR: TaxYearId` - Current default tax year ('2025-26')

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build
pnpm build

# Lint
pnpm lint
```

## Type Exports

All TypeScript types and interfaces are exported for use in consuming applications:

```typescript
import type {
  LoanInputs,
  AmortisationResult,
  BorrowingCapacityInputs,
  BorrowingCapacityResult,
  PayCalculateRequest,
  PayCalculateResponse,
  // ... and many more
} from 'calc-engine';
```
