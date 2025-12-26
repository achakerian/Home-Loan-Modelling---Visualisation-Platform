import { describe, it, expect } from 'vitest';
import { calculateMedicareSurcharge } from './calculateMedicareSurcharge';
import type { TaxYearId } from './types';

describe('calculateMedicareSurcharge', () => {
  const taxYear: TaxYearId = '2024-25';

  describe('Private health insurance exemption', () => {
    it('should return 0 when taxpayer has private health insurance', () => {
      expect(calculateMedicareSurcharge(taxYear, 50000, true)).toBe(0);
      expect(calculateMedicareSurcharge(taxYear, 100000, true)).toBe(0);
      expect(calculateMedicareSurcharge(taxYear, 120000, true)).toBe(0);
      expect(calculateMedicareSurcharge(taxYear, 200000, true)).toBe(0);
    });
  });

  describe('Income tiers without private health', () => {
    describe('Tier 0: $0 - $97,000 (no surcharge)', () => {
      it('should return 0 for income below threshold', () => {
        expect(calculateMedicareSurcharge(taxYear, 0, false)).toBe(0);
        expect(calculateMedicareSurcharge(taxYear, 50000, false)).toBe(0);
        expect(calculateMedicareSurcharge(taxYear, 90000, false)).toBe(0);
        expect(calculateMedicareSurcharge(taxYear, 96999, false)).toBe(0);
        expect(calculateMedicareSurcharge(taxYear, 97000, false)).toBe(0);
      });
    });

    describe('Tier 1: $97,001 - $113,000 (1% surcharge)', () => {
      it('should calculate 1% surcharge for income in tier 1', () => {
        // Just over threshold
        expect(calculateMedicareSurcharge(taxYear, 97001, false)).toBeCloseTo(
          970.01,
          2
        );

        // Middle of tier
        expect(calculateMedicareSurcharge(taxYear, 100000, false)).toBe(1000);

        // Near top of tier
        expect(calculateMedicareSurcharge(taxYear, 110000, false)).toBe(1100);

        // Exactly at top of tier
        expect(calculateMedicareSurcharge(taxYear, 113000, false)).toBe(1130);
      });
    });

    describe('Tier 2: $113,001 - $151,000 (1.25% surcharge)', () => {
      it('should calculate 1.25% surcharge for income in tier 2', () => {
        // Just over tier 1
        expect(calculateMedicareSurcharge(taxYear, 113001, false)).toBeCloseTo(
          1412.5125,
          2
        );

        // Middle of tier
        expect(calculateMedicareSurcharge(taxYear, 120000, false)).toBe(1500);

        // Near top of tier
        expect(calculateMedicareSurcharge(taxYear, 140000, false)).toBe(1750);

        // Exactly at top of tier
        expect(calculateMedicareSurcharge(taxYear, 151000, false)).toBe(1887.5);
      });
    });

    describe('Tier 3: $151,001+ (1.5% surcharge)', () => {
      it('should calculate 1.5% surcharge for income above threshold', () => {
        // Just over tier 2
        expect(calculateMedicareSurcharge(taxYear, 151001, false)).toBeCloseTo(
          2265.015,
          2
        );

        // Well above threshold
        expect(calculateMedicareSurcharge(taxYear, 160000, false)).toBe(2400);
        expect(calculateMedicareSurcharge(taxYear, 180000, false)).toBe(2700);
        expect(calculateMedicareSurcharge(taxYear, 200000, false)).toBe(3000);
        expect(calculateMedicareSurcharge(taxYear, 500000, false)).toBe(7500);
      });
    });
  });

  describe('Known calculation examples', () => {
    it('should match ATO example calculations', () => {
      // Example 1: Income $90,000, no private health
      // Below threshold, no surcharge
      expect(calculateMedicareSurcharge(taxYear, 90000, false)).toBe(0);

      // Example 2: Income $100,000, no private health
      // Tier 1: 1% of $100,000 = $1,000
      expect(calculateMedicareSurcharge(taxYear, 100000, false)).toBe(1000);

      // Example 3: Income $120,000, no private health
      // Tier 2: 1.25% of $120,000 = $1,500
      expect(calculateMedicareSurcharge(taxYear, 120000, false)).toBe(1500);

      // Example 4: Income $160,000, no private health
      // Tier 3: 1.5% of $160,000 = $2,400
      expect(calculateMedicareSurcharge(taxYear, 160000, false)).toBe(2400);

      // Example 5: Income $100,000, with private health
      // No surcharge
      expect(calculateMedicareSurcharge(taxYear, 100000, true)).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle exact tier boundaries', () => {
      // Exactly at tier boundaries
      expect(calculateMedicareSurcharge(taxYear, 97000, false)).toBe(0);
      expect(calculateMedicareSurcharge(taxYear, 97001, false)).toBeCloseTo(
        970.01,
        2
      );
      expect(calculateMedicareSurcharge(taxYear, 113000, false)).toBe(1130);
      expect(calculateMedicareSurcharge(taxYear, 113001, false)).toBeCloseTo(
        1412.5125,
        2
      );
      expect(calculateMedicareSurcharge(taxYear, 151000, false)).toBe(1887.5);
      expect(calculateMedicareSurcharge(taxYear, 151001, false)).toBeCloseTo(
        2265.015,
        2
      );
    });

    it('should handle zero income', () => {
      expect(calculateMedicareSurcharge(taxYear, 0, false)).toBe(0);
      expect(calculateMedicareSurcharge(taxYear, 0, true)).toBe(0);
    });

    it('should handle negative income as zero', () => {
      expect(calculateMedicareSurcharge(taxYear, -1000, false)).toBe(0);
      expect(calculateMedicareSurcharge(taxYear, -50000, false)).toBe(0);
    });

    it('should handle non-finite values', () => {
      expect(calculateMedicareSurcharge(taxYear, NaN, false)).toBe(0);
      expect(calculateMedicareSurcharge(taxYear, Infinity, false)).toBe(
        Infinity
      );
      expect(calculateMedicareSurcharge(taxYear, -Infinity, false)).toBe(0);
    });

    it('should handle very large incomes', () => {
      const income = 10000000; // $10 million
      const expected = income * 0.015; // 1.5%
      expect(calculateMedicareSurcharge(taxYear, income, false)).toBe(expected);
    });
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

    taxYears.forEach((year) => {
      describe(year, () => {
        it('should use same MLS tiers', () => {
          // Below threshold
          expect(calculateMedicareSurcharge(year, 90000, false)).toBe(0);

          // Tier 1
          expect(calculateMedicareSurcharge(year, 100000, false)).toBe(1000);

          // Tier 2
          expect(calculateMedicareSurcharge(year, 120000, false)).toBe(1500);

          // Tier 3
          expect(calculateMedicareSurcharge(year, 160000, false)).toBe(2400);
        });

        it('should respect private health insurance exemption', () => {
          expect(calculateMedicareSurcharge(year, 100000, true)).toBe(0);
          expect(calculateMedicareSurcharge(year, 200000, true)).toBe(0);
        });
      });
    });
  });

  describe('Return value constraints', () => {
    it('should always return a non-negative number (or Infinity)', () => {
      const testIncomes = [0, 50000, 97000, 100000, 120000, 160000, 500000];

      testIncomes.forEach((income) => {
        const result = calculateMedicareSurcharge(taxYear, income, false);
        expect(result).toBeGreaterThanOrEqual(0);
      });
    });

    it('should return 0 when private health is true, regardless of income', () => {
      const testIncomes = [0, 50000, 97000, 100000, 120000, 160000, 500000];

      testIncomes.forEach((income) => {
        expect(calculateMedicareSurcharge(taxYear, income, true)).toBe(0);
      });
    });
  });

  describe('Surcharge rate calculation', () => {
    it('should apply correct rate for each tier', () => {
      // Tier 0: 0%
      const tier0Income = 90000;
      const tier0Rate = 0;
      expect(calculateMedicareSurcharge(taxYear, tier0Income, false)).toBe(
        tier0Income * tier0Rate
      );

      // Tier 1: 1%
      const tier1Income = 100000;
      const tier1Rate = 0.01;
      expect(calculateMedicareSurcharge(taxYear, tier1Income, false)).toBe(
        tier1Income * tier1Rate
      );

      // Tier 2: 1.25%
      const tier2Income = 120000;
      const tier2Rate = 0.0125;
      expect(calculateMedicareSurcharge(taxYear, tier2Income, false)).toBe(
        tier2Income * tier2Rate
      );

      // Tier 3: 1.5%
      const tier3Income = 160000;
      const tier3Rate = 0.015;
      expect(calculateMedicareSurcharge(taxYear, tier3Income, false)).toBe(
        tier3Income * tier3Rate
      );
    });
  });
});
