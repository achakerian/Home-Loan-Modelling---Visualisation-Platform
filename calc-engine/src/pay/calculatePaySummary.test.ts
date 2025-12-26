import { describe, it, expect } from 'vitest';
import { calculatePaySummary } from './calculatePaySummary';
import type { TaxYearId } from './types';

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

  describe('All tax years', () => {
    const taxYears: TaxYearId[] = [
      '2020-21',
      '2021-22',
      '2022-23',
      '2023-24',
      '2024-25',
      '2025-26',
    ];

    taxYears.forEach((taxYear) => {
      describe(taxYear, () => {
        it('should calculate valid pay summary for typical salary', () => {
          const res = calculatePaySummary({
            taxYear,
            residency: 'resident',
            annualSalary: 80000,
            frequency: 'monthly',
            hasHELP: false,
            medicareExempt: false,
            deductions: 0,
            includeSuper: false,
            superRate: 0,
          });

          expect(res.annual.gross).toBe(80000);
          expect(res.annual.taxable).toBe(80000);
          expect(res.annual.incomeTax).toBeGreaterThan(0);
          expect(res.annual.medicareLevy).toBeGreaterThan(0);
          expect(res.annual.help).toBe(0);
          expect(res.annual.net).toBeLessThan(80000);
          expect(res.perPeriod.net).toBeGreaterThan(0);
        });

        it('should handle low income below tax-free threshold', () => {
          const res = calculatePaySummary({
            taxYear,
            residency: 'resident',
            annualSalary: 15000,
            frequency: 'monthly',
            hasHELP: false,
            medicareExempt: false,
            deductions: 0,
            includeSuper: false,
            superRate: 0,
          });

          expect(res.annual.incomeTax).toBe(0);
          // Historical years (2020-23) have no Medicare low-income threshold (0),
          // so they apply flat 2%. Newer years have phase-in.
          if (taxYear.startsWith('202') && !taxYear.includes('24') && !taxYear.includes('25')) {
            expect(res.annual.medicareLevy).toBe(300); // 2% of $15,000
          } else {
            expect(res.annual.medicareLevy).toBe(0); // Below threshold
          }
        });
      });
    });
  });

  describe('Residency types', () => {
    describe('Resident', () => {
      it('should apply tax-free threshold when claimTaxFreeThreshold is true', () => {
        const res = calculatePaySummary({
          taxYear: '2024-25',
          residency: 'resident',
          annualSalary: 18000, // Below $18,200 threshold
          frequency: 'monthly',
          hasHELP: false,
          medicareExempt: false,
          deductions: 0,
          includeSuper: false,
          superRate: 0,
          claimTaxFreeThreshold: true,
        });

        expect(res.annual.incomeTax).toBe(0);
      });

      it('should NOT apply tax-free threshold when claimTaxFreeThreshold is false', () => {
        const res = calculatePaySummary({
          taxYear: '2024-25',
          residency: 'resident',
          annualSalary: 20000,
          frequency: 'monthly',
          hasHELP: false,
          medicareExempt: false,
          deductions: 0,
          includeSuper: false,
          superRate: 0,
          claimTaxFreeThreshold: false,
        });

        expect(res.annual.incomeTax).toBeGreaterThan(0);
      });

      it('should default to claiming tax-free threshold', () => {
        const res = calculatePaySummary({
          taxYear: '2024-25',
          residency: 'resident',
          annualSalary: 18000, // Below $18,200 threshold
          frequency: 'monthly',
          hasHELP: false,
          medicareExempt: false,
          deductions: 0,
          includeSuper: false,
          superRate: 0,
        });

        expect(res.annual.incomeTax).toBe(0);
      });
    });

    describe('Non-resident', () => {
      it('should use non-resident tax rates', () => {
        const res = calculatePaySummary({
          taxYear: '2024-25',
          residency: 'nonResident',
          annualSalary: 50000,
          frequency: 'monthly',
          hasHELP: false,
          medicareExempt: true,
          deductions: 0,
          includeSuper: false,
          superRate: 0,
        });

        // Non-residents pay 30% on income $0-$135,000 (2024-25 rate)
        expect(res.annual.incomeTax).toBeCloseTo(50000 * 0.3, 0);
        expect(res.annual.medicareLevy).toBe(0);
      });

      it('should not apply Medicare levy to non-residents', () => {
        const res = calculatePaySummary({
          taxYear: '2024-25',
          residency: 'nonResident',
          annualSalary: 80000,
          frequency: 'monthly',
          hasHELP: false,
          medicareExempt: false,
          deductions: 0,
          includeSuper: false,
          superRate: 0,
        });

        expect(res.annual.medicareLevy).toBe(0);
      });
    });

    describe('Working Holiday Maker', () => {
      it('should use WHM tax rates (15% up to $45K)', () => {
        const res = calculatePaySummary({
          taxYear: '2024-25',
          residency: 'workingHoliday',
          annualSalary: 40000,
          frequency: 'monthly',
          hasHELP: false,
          medicareExempt: true,
          deductions: 0,
          includeSuper: false,
          superRate: 0,
        });

        // WHM pays 15% on income up to $45,000
        expect(res.annual.incomeTax).toBeCloseTo(40000 * 0.15, 0);
      });

      it('should apply higher WHM rate above $45K', () => {
        const res = calculatePaySummary({
          taxYear: '2024-25',
          residency: 'workingHoliday',
          annualSalary: 50000,
          frequency: 'monthly',
          hasHELP: false,
          medicareExempt: true,
          deductions: 0,
          includeSuper: false,
          superRate: 0,
        });

        // WHM pays 15% on first $45K, then 32.5% on excess
        const expectedTax = 45000 * 0.15 + (50000 - 45000) * 0.325;
        expect(res.annual.incomeTax).toBeCloseTo(expectedTax, 0);
      });

      it('should not apply Medicare levy to WHM', () => {
        const res = calculatePaySummary({
          taxYear: '2024-25',
          residency: 'workingHoliday',
          annualSalary: 50000,
          frequency: 'monthly',
          hasHELP: false,
          medicareExempt: false,
          deductions: 0,
          includeSuper: false,
          superRate: 0,
        });

        expect(res.annual.medicareLevy).toBe(0);
      });
    });
  });

  describe('HELP repayment', () => {
    describe('Legacy HELP system (2024-25 and earlier)', () => {
      it('should apply no HELP below $54,435 threshold for 2024-25', () => {
        const res = calculatePaySummary({
          taxYear: '2024-25',
          residency: 'resident',
          annualSalary: 54000,
          frequency: 'monthly',
          hasHELP: true,
          medicareExempt: false,
          deductions: 0,
          includeSuper: false,
          superRate: 0,
        });

        expect(res.annual.help).toBe(0);
      });

      it('should apply 1% HELP for income just above threshold (2024-25)', () => {
        const res = calculatePaySummary({
          taxYear: '2024-25',
          residency: 'resident',
          annualSalary: 55000,
          frequency: 'monthly',
          hasHELP: true,
          medicareExempt: false,
          deductions: 0,
          includeSuper: false,
          superRate: 0,
        });

        // First tier: 1% on whole income
        expect(res.annual.help).toBeCloseTo(550, 0);
      });

      it('should increase HELP rate with higher income (2024-25)', () => {
        const res = calculatePaySummary({
          taxYear: '2024-25',
          residency: 'resident',
          annualSalary: 80000,
          frequency: 'monthly',
          hasHELP: true,
          medicareExempt: false,
          deductions: 0,
          includeSuper: false,
          superRate: 0,
        });

        // Should be in a higher HELP tier
        expect(res.annual.help).toBeGreaterThan(800); // More than 1%
      });
    });

    describe('Marginal HELP system (2025-26)', () => {
      it('should apply no HELP below $67,000 threshold for 2025-26', () => {
        const res = calculatePaySummary({
          taxYear: '2025-26',
          residency: 'resident',
          annualSalary: 66000,
          frequency: 'monthly',
          hasHELP: true,
          medicareExempt: false,
          deductions: 0,
          includeSuper: false,
          superRate: 0,
        });

        expect(res.annual.help).toBe(0);
      });

      it('should use marginal calculation for 2025-26', () => {
        const res = calculatePaySummary({
          taxYear: '2025-26',
          residency: 'resident',
          annualSalary: 70000,
          frequency: 'monthly',
          hasHELP: true,
          medicareExempt: false,
          deductions: 0,
          includeSuper: false,
          superRate: 0,
        });

        // Marginal system: base repayment + rate on excess over $67,000
        expect(res.annual.help).toBeGreaterThan(0);
        expect(res.annual.help).toBeLessThan(700); // Should be small for $3K excess
      });

      it('should respect tax year parameter (bug fix verification)', () => {
        // This test verifies the bug fix where HELP was ignoring taxYear parameter
        const res2024 = calculatePaySummary({
          taxYear: '2024-25',
          residency: 'resident',
          annualSalary: 65000,
          frequency: 'monthly',
          hasHELP: true,
          medicareExempt: false,
          deductions: 0,
          includeSuper: false,
          superRate: 0,
        });

        const res2025 = calculatePaySummary({
          taxYear: '2025-26',
          residency: 'resident',
          annualSalary: 65000,
          frequency: 'monthly',
          hasHELP: true,
          medicareExempt: false,
          deductions: 0,
          includeSuper: false,
          superRate: 0,
        });

        // 2024-25: $65K is above $54,435 threshold, should have HELP
        expect(res2024.annual.help).toBeGreaterThan(0);

        // 2025-26: $65K is below $67,000 threshold, should have NO HELP
        expect(res2025.annual.help).toBe(0);

        // This is the critical test: they should be different!
        expect(res2024.annual.help).not.toBe(res2025.annual.help);
      });
    });
  });

  describe('Medicare levy', () => {
    it('should apply 2% Medicare levy by default', () => {
      const res = calculatePaySummary({
        taxYear: '2024-25',
        residency: 'resident',
        annualSalary: 80000,
        frequency: 'monthly',
        hasHELP: false,
        medicareExempt: false,
        deductions: 0,
        includeSuper: false,
        superRate: 0,
      });

      expect(res.annual.medicareLevy).toBeCloseTo(80000 * 0.02, 0);
    });

    it('should apply 1% reduced Medicare levy when medicareReduced is true', () => {
      const res = calculatePaySummary({
        taxYear: '2024-25',
        residency: 'resident',
        annualSalary: 80000,
        frequency: 'monthly',
        hasHELP: false,
        medicareExempt: false,
        medicareReduced: true,
        deductions: 0,
        includeSuper: false,
        superRate: 0,
      });

      expect(res.annual.medicareLevy).toBeCloseTo(80000 * 0.01, 0);
    });

    it('should not apply Medicare levy when medicareExempt is true', () => {
      const res = calculatePaySummary({
        taxYear: '2024-25',
        residency: 'resident',
        annualSalary: 80000,
        frequency: 'monthly',
        hasHELP: false,
        medicareExempt: true,
        deductions: 0,
        includeSuper: false,
        superRate: 0,
      });

      expect(res.annual.medicareLevy).toBe(0);
    });

    it('should apply low-income phase-in for Medicare levy', () => {
      // Test income in the phase-in zone (between 27,222 and 34,027 for 2024-25)
      const res = calculatePaySummary({
        taxYear: '2024-25',
        residency: 'resident',
        annualSalary: 30000,
        frequency: 'monthly',
        hasHELP: false,
        medicareExempt: false,
        deductions: 0,
        includeSuper: false,
        superRate: 0,
      });

      // Should be less than full 2% but more than 0
      expect(res.annual.medicareLevy).toBeGreaterThan(0);
      expect(res.annual.medicareLevy).toBeLessThan(30000 * 0.02);
    });
  });

  describe('Deductions', () => {
    it('should reduce taxable income by deductions', () => {
      const withoutDeductions = calculatePaySummary({
        taxYear: '2024-25',
        residency: 'resident',
        annualSalary: 80000,
        frequency: 'monthly',
        hasHELP: false,
        medicareExempt: false,
        deductions: 0,
        includeSuper: false,
        superRate: 0,
      });

      const withDeductions = calculatePaySummary({
        taxYear: '2024-25',
        residency: 'resident',
        annualSalary: 80000,
        frequency: 'monthly',
        hasHELP: false,
        medicareExempt: false,
        deductions: 5000,
        includeSuper: false,
        superRate: 0,
      });

      expect(withDeductions.annual.taxable).toBe(75000);
      expect(withDeductions.annual.incomeTax).toBeLessThan(
        withoutDeductions.annual.incomeTax
      );
    });
  });

  describe('Superannuation', () => {
    it('should calculate employer super when includeSuper is false', () => {
      const res = calculatePaySummary({
        taxYear: '2024-25',
        residency: 'resident',
        annualSalary: 100000,
        frequency: 'monthly',
        hasHELP: false,
        medicareExempt: false,
        deductions: 0,
        includeSuper: false,
        superRate: 0.115,
      });

      expect(res.annual.gross).toBe(100000);
      expect(res.annual.employerSuper).toBeCloseTo(100000 * 0.115, 0);
    });

    it('should back-calculate base salary when includeSuper is true', () => {
      const res = calculatePaySummary({
        taxYear: '2024-25',
        residency: 'resident',
        annualSalary: 100000,
        frequency: 'monthly',
        hasHELP: false,
        medicareExempt: false,
        deductions: 0,
        includeSuper: true,
        superRate: 0.115,
      });

      // Total package is $100K, which includes super
      expect(res.annual.gross + res.annual.employerSuper).toBeCloseTo(
        100000,
        0
      );
      expect(res.annual.gross).toBeLessThan(100000);
    });
  });

  describe('Pay frequency calculations', () => {
    const testFrequencies = [
      { frequency: 'weekly' as const, periods: 52 },
      { frequency: 'fortnightly' as const, periods: 26 },
      { frequency: 'monthly' as const, periods: 12 },
    ];

    testFrequencies.forEach(({ frequency, periods }) => {
      it(`should calculate correct per-period amounts for ${frequency}`, () => {
        const res = calculatePaySummary({
          taxYear: '2024-25',
          residency: 'resident',
          annualSalary: 78000,
          frequency,
          hasHELP: false,
          medicareExempt: false,
          deductions: 0,
          includeSuper: false,
          superRate: 0,
        });

        expect(res.perPeriod.gross).toBeCloseTo(78000 / periods, 2);
        expect(res.perPeriod.net).toBeCloseTo(res.annual.net / periods, 2);
        expect(res.perPeriod.totalWithheld).toBeCloseTo(
          res.annual.totalWithheld / periods,
          2
        );
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle zero income', () => {
      const res = calculatePaySummary({
        taxYear: '2024-25',
        residency: 'resident',
        annualSalary: 0,
        frequency: 'monthly',
        hasHELP: false,
        medicareExempt: false,
        deductions: 0,
        includeSuper: false,
        superRate: 0,
      });

      expect(res.annual.gross).toBe(0);
      expect(res.annual.incomeTax).toBe(0);
      expect(res.annual.medicareLevy).toBe(0);
      expect(res.annual.help).toBe(0);
      expect(res.annual.net).toBe(0);
    });

    it('should handle very high income', () => {
      const res = calculatePaySummary({
        taxYear: '2024-25',
        residency: 'resident',
        annualSalary: 500000,
        frequency: 'monthly',
        hasHELP: false,
        medicareExempt: false,
        deductions: 0,
        includeSuper: false,
        superRate: 0,
      });

      expect(res.annual.gross).toBe(500000);
      expect(res.annual.incomeTax).toBeGreaterThan(0);
      expect(res.effectiveTaxRate).toBeGreaterThan(0);
      expect(res.effectiveTaxRate).toBeLessThan(1);
    });
  });

  describe('Effective tax rate', () => {
    it('should calculate effective tax rate correctly', () => {
      const res = calculatePaySummary({
        taxYear: '2024-25',
        residency: 'resident',
        annualSalary: 80000,
        frequency: 'monthly',
        hasHELP: false,
        medicareExempt: false,
        deductions: 0,
        includeSuper: false,
        superRate: 0,
      });

      const expectedRate = res.annual.totalWithheld / res.annual.gross;
      expect(res.effectiveTaxRate).toBeCloseTo(expectedRate, 5);
    });

    it('should be 0 for zero income', () => {
      const res = calculatePaySummary({
        taxYear: '2024-25',
        residency: 'resident',
        annualSalary: 0,
        frequency: 'monthly',
        hasHELP: false,
        medicareExempt: false,
        deductions: 0,
        includeSuper: false,
        superRate: 0,
      });

      expect(res.effectiveTaxRate).toBe(0);
    });
  });
});
