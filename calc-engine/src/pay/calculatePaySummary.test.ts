import { describe, it, expect } from 'vitest';
import { calculatePaySummary } from './calculatePaySummary';

describe('calculatePaySummary', () => {
  it('returns finite results and perPeriod numbers', () => {
    const res = calculatePaySummary({
      taxYear: '2024-25',
      residency: 'resident',
      annualSalary: 90000,
      frequency: 'fortnightly',
      hasHELP: false,
      medicareExempt: false,
      deductions: 0,
      includeSuper: false,
      superRate: 0.115
    });

    expect(res.annual.gross).toBeGreaterThan(0);
    expect(res.perPeriod.net).toBeGreaterThan(0);
    expect(res.effectiveTaxRate).toBeGreaterThanOrEqual(0);
  });

  it('handles bracket boundary around 45,000', () => {
    const res1 = calculatePaySummary({
      taxYear: '2024-25',
      residency: 'resident',
      annualSalary: 45000,
      frequency: 'monthly',
      hasHELP: false,
      medicareExempt: true,
      deductions: 0,
      includeSuper: false,
      superRate: 0
    });

    const res2 = calculatePaySummary({
      taxYear: '2024-25',
      residency: 'resident',
      annualSalary: 45001,
      frequency: 'monthly',
      hasHELP: false,
      medicareExempt: true,
      deductions: 0,
      includeSuper: false,
      superRate: 0
    });

    expect(res2.annual.incomeTax).toBeGreaterThanOrEqual(res1.annual.incomeTax);
  });

  it('applies HELP 2025-26 marginal threshold at 67,000', () => {
    const below = calculatePaySummary({
      taxYear: '2025-26',
      residency: 'resident',
      annualSalary: 67000,
      frequency: 'monthly',
      hasHELP: true,
      medicareExempt: true,
      deductions: 0,
      includeSuper: false,
      superRate: 0
    });

    const above = calculatePaySummary({
      taxYear: '2025-26',
      residency: 'resident',
      annualSalary: 68000,
      frequency: 'monthly',
      hasHELP: true,
      medicareExempt: true,
      deductions: 0,
      includeSuper: false,
      superRate: 0
    });

    expect(below.annual.help).toBeCloseTo(0, 5);
    expect(above.annual.help).toBeGreaterThan(0);
  });
});
