import { describe, it, expect } from 'vitest';
import { calculateLITO } from './calculateLITO';
import type { TaxYearId } from './types';

describe('calculateLITO', () => {
  describe('2024-25 tax year', () => {
    const taxYear: TaxYearId = '2024-25';

    it('should return full $700 offset for income at or below $37,500', () => {
      expect(calculateLITO(taxYear, 0)).toBe(700);
      expect(calculateLITO(taxYear, 18200)).toBe(700);
      expect(calculateLITO(taxYear, 30000)).toBe(700);
      expect(calculateLITO(taxYear, 37500)).toBe(700);
    });

    it('should phase out in first zone ($37,500 - $45,000) at $0.05 per dollar', () => {
      // At $38,500 (i.e., $1,000 over threshold): offset reduces by $50
      const income1 = 38500;
      const expected1 = 700 - 0.05 * (income1 - 37500);
      expect(calculateLITO(taxYear, income1)).toBe(expected1);
      expect(calculateLITO(taxYear, income1)).toBe(650);

      // At $40,000 (i.e., $2,500 over threshold): offset reduces by $125
      const income2 = 40000;
      const expected2 = 700 - 0.05 * (income2 - 37500);
      expect(calculateLITO(taxYear, income2)).toBe(expected2);
      expect(calculateLITO(taxYear, income2)).toBe(575);

      // At $45,000 (end of first phase-out): offset reduces by $375 to $325
      const income3 = 45000;
      const expected3 = 700 - 0.05 * (income3 - 37500);
      expect(calculateLITO(taxYear, income3)).toBe(expected3);
      expect(calculateLITO(taxYear, income3)).toBe(325);
    });

    it('should phase out in second zone ($45,000 - $66,667) at $0.015 per dollar', () => {
      // At $50,000: first zone reduces offset by $375, second zone by $75
      const income1 = 50000;
      const firstPhaseReduction = 0.05 * (45000 - 37500); // $375
      const secondPhaseReduction = 0.015 * (income1 - 45000); // $75
      const expected1 = 700 - firstPhaseReduction - secondPhaseReduction;
      expect(calculateLITO(taxYear, income1)).toBeCloseTo(expected1, 2);
      expect(calculateLITO(taxYear, income1)).toBeCloseTo(250, 2);

      // At $60,000: first zone reduces by $375, second zone by $225
      const income2 = 60000;
      const secondPhaseReduction2 = 0.015 * (income2 - 45000); // $225
      const expected2 = 700 - firstPhaseReduction - secondPhaseReduction2;
      expect(calculateLITO(taxYear, income2)).toBeCloseTo(expected2, 2);
      expect(calculateLITO(taxYear, income2)).toBeCloseTo(100, 2);
    });

    it('should return zero offset for income at or above $66,667', () => {
      // At $66,667: offset should be approximately 0
      // First phase: 700 - 0.05 * (45000 - 37500) = 700 - 375 = 325
      // Second phase: 325 - 0.015 * (66667 - 45000) = 325 - 325 = 0
      expect(calculateLITO(taxYear, 66667)).toBeCloseTo(0, 0);
      expect(calculateLITO(taxYear, 70000)).toBe(0);
      expect(calculateLITO(taxYear, 100000)).toBe(0);
      expect(calculateLITO(taxYear, 180000)).toBe(0);
    });

    it('should handle edge cases', () => {
      // Exactly at first phase-out threshold
      expect(calculateLITO(taxYear, 37500)).toBe(700);

      // Just after first threshold
      expect(calculateLITO(taxYear, 37501)).toBeCloseTo(699.95, 2);

      // Exactly at second phase-out threshold
      expect(calculateLITO(taxYear, 45000)).toBe(325);

      // Just after second threshold
      expect(calculateLITO(taxYear, 45001)).toBeCloseTo(324.985, 2);
    });

    it('should never return negative offsets', () => {
      expect(calculateLITO(taxYear, 100000)).toBeGreaterThanOrEqual(0);
      expect(calculateLITO(taxYear, 1000000)).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero and negative income', () => {
      expect(calculateLITO(taxYear, 0)).toBe(700);
      expect(calculateLITO(taxYear, -1000)).toBe(700); // Negative income treated as 0
    });

    it('should handle non-finite inputs', () => {
      expect(calculateLITO(taxYear, NaN)).toBe(700);
      expect(calculateLITO(taxYear, Infinity)).toBe(0);
      expect(calculateLITO(taxYear, -Infinity)).toBe(700);
    });
  });

  describe('2025-26 tax year', () => {
    const taxYear: TaxYearId = '2025-26';

    it('should use same LITO structure as 2024-25', () => {
      // Basic sanity checks - values should be similar to 2024-25
      expect(calculateLITO(taxYear, 0)).toBeGreaterThan(0);
      expect(calculateLITO(taxYear, 30000)).toBeGreaterThan(0);
      expect(calculateLITO(taxYear, 100000)).toBe(0);
    });

    it('should never return negative offsets', () => {
      expect(calculateLITO(taxYear, 50000)).toBeGreaterThanOrEqual(0);
      expect(calculateLITO(taxYear, 100000)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Historical tax years', () => {
    const historicalYears: TaxYearId[] = [
      '2020-21',
      '2021-22',
      '2022-23',
      '2023-24',
    ];

    historicalYears.forEach((taxYear) => {
      describe(taxYear, () => {
        it('should calculate LITO for low income', () => {
          const offset = calculateLITO(taxYear, 20000);
          expect(offset).toBeGreaterThan(0);
        });

        it('should return zero LITO for high income', () => {
          expect(calculateLITO(taxYear, 100000)).toBe(0);
        });

        it('should never return negative offsets', () => {
          expect(calculateLITO(taxYear, 40000)).toBeGreaterThanOrEqual(0);
          expect(calculateLITO(taxYear, 80000)).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });

  describe('LITO calculation accuracy', () => {
    const taxYear: TaxYearId = '2024-25';

    it('should match known calculation examples', () => {
      // Example 1: Income $35,000 - below first threshold
      expect(calculateLITO(taxYear, 35000)).toBe(700);

      // Example 2: Income $40,000 - in first phase-out
      // Reduction = 0.05 × (40,000 - 37,500) = 0.05 × 2,500 = 125
      // Offset = 700 - 125 = 575
      expect(calculateLITO(taxYear, 40000)).toBe(575);

      // Example 3: Income $50,000 - in second phase-out
      // First reduction = 0.05 × (45,000 - 37,500) = 375
      // Remaining = 700 - 375 = 325
      // Second reduction = 0.015 × (50,000 - 45,000) = 0.015 × 5,000 = 75
      // Offset = 325 - 75 = 250
      expect(calculateLITO(taxYear, 50000)).toBeCloseTo(250, 2);

      // Example 4: Income $66,667 - should be approximately zero
      expect(calculateLITO(taxYear, 66667)).toBeCloseTo(0, 0);
    });
  });

  describe('Monotonic decrease property', () => {
    const taxYear: TaxYearId = '2024-25';

    it('should never increase as income increases', () => {
      const incomes = [0, 20000, 37500, 40000, 45000, 50000, 60000, 70000];

      for (let i = 1; i < incomes.length; i++) {
        const offset1 = calculateLITO(taxYear, incomes[i - 1]);
        const offset2 = calculateLITO(taxYear, incomes[i]);
        expect(offset2).toBeLessThanOrEqual(offset1);
      }
    });

    it('should decrease continuously in phase-out zones', () => {
      // Test first phase-out zone ($37,500 - $45,000)
      for (let income = 37500; income <= 45000; income += 100) {
        const offset = calculateLITO(taxYear, income);
        expect(offset).toBeGreaterThanOrEqual(325);
        expect(offset).toBeLessThanOrEqual(700);
      }

      // Test second phase-out zone ($45,000 - $66,667)
      for (let income = 45000; income <= 66667; income += 1000) {
        const offset = calculateLITO(taxYear, income);
        expect(offset).toBeGreaterThanOrEqual(0);
        expect(offset).toBeLessThanOrEqual(325);
      }
    });
  });
});
