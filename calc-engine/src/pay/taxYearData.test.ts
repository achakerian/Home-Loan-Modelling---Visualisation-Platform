import { describe, it, expect } from 'vitest';
import {
  TAX_YEAR_CONFIGS,
  TAX_YEAR_MAP,
  DEFAULT_TAX_YEAR,
  type TaxYearId,
} from './taxYearData';

describe('taxYearData', () => {
  describe('TAX_YEAR_CONFIGS', () => {
    it('should contain exactly 6 tax years', () => {
      expect(TAX_YEAR_CONFIGS).toHaveLength(6);
    });

    it('should have unique IDs', () => {
      const ids = TAX_YEAR_CONFIGS.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should include all expected tax years', () => {
      const expectedYears: TaxYearId[] = [
        '2025-26',
        '2024-25',
        '2023-24',
        '2022-23',
        '2021-22',
        '2020-21',
      ];
      const actualYears = TAX_YEAR_CONFIGS.map((c) => c.id);
      expect(actualYears).toEqual(expectedYears);
    });

    it('should have valid labels', () => {
      TAX_YEAR_CONFIGS.forEach((config) => {
        expect(config.label).toBeTruthy();
        expect(typeof config.label).toBe('string');
        expect(config.label.length).toBeGreaterThan(0);
      });
    });
  });

  describe('TAX_YEAR_MAP', () => {
    it('should map all tax year IDs to configs', () => {
      TAX_YEAR_CONFIGS.forEach((config) => {
        expect(TAX_YEAR_MAP[config.id]).toBeDefined();
        expect(TAX_YEAR_MAP[config.id]).toBe(config);
      });
    });

    it('should allow direct access by ID', () => {
      expect(TAX_YEAR_MAP['2024-25']).toBeDefined();
      expect(TAX_YEAR_MAP['2025-26']).toBeDefined();
    });
  });

  describe('DEFAULT_TAX_YEAR', () => {
    it('should be 2025-26', () => {
      expect(DEFAULT_TAX_YEAR).toBe('2025-26');
    });

    it('should exist in TAX_YEAR_MAP', () => {
      expect(TAX_YEAR_MAP[DEFAULT_TAX_YEAR]).toBeDefined();
    });
  });

  describe('Tax Year Structure', () => {
    TAX_YEAR_CONFIGS.forEach((config) => {
      describe(`${config.id}`, () => {
        it('should have valid resident tax brackets', () => {
          expect(config.resident.brackets).toBeDefined();
          expect(Array.isArray(config.resident.brackets)).toBe(true);
          expect(config.resident.brackets.length).toBeGreaterThan(0);

          // Verify bracket structure
          config.resident.brackets.forEach((bracket, index) => {
            expect(typeof bracket.from).toBe('number');
            expect(typeof bracket.baseTax).toBe('number');
            expect(typeof bracket.rate).toBe('number');
            expect(bracket.rate).toBeGreaterThanOrEqual(0);
            expect(bracket.rate).toBeLessThanOrEqual(1);

            // All brackets except the last should have a 'to' value
            if (index < config.resident.brackets.length - 1) {
              expect(bracket.to).toBeDefined();
              expect(typeof bracket.to).toBe('number');
              expect(bracket.to!).toBeGreaterThan(bracket.from);
            }
          });

          // Verify brackets are in ascending order
          for (let i = 1; i < config.resident.brackets.length; i++) {
            expect(config.resident.brackets[i].from).toBeGreaterThanOrEqual(
              config.resident.brackets[i - 1].from
            );
          }
        });

        it('should have valid tax-free threshold', () => {
          expect(typeof config.resident.taxFreeThreshold).toBe('number');
          expect(config.resident.taxFreeThreshold).toBeGreaterThanOrEqual(0);
          // Should be $18,200 for all years
          expect(config.resident.taxFreeThreshold).toBe(18200);
        });

        it('should have valid non-resident tax brackets', () => {
          expect(config.nonResident.brackets).toBeDefined();
          expect(Array.isArray(config.nonResident.brackets)).toBe(true);
          expect(config.nonResident.brackets.length).toBeGreaterThan(0);

          config.nonResident.brackets.forEach((bracket) => {
            expect(typeof bracket.from).toBe('number');
            expect(typeof bracket.baseTax).toBe('number');
            expect(typeof bracket.rate).toBe('number');
            expect(bracket.rate).toBeGreaterThanOrEqual(0);
            expect(bracket.rate).toBeLessThanOrEqual(1);
          });
        });

        it('should have valid WHM tax brackets', () => {
          expect(config.whm.brackets).toBeDefined();
          expect(Array.isArray(config.whm.brackets)).toBe(true);
          expect(config.whm.brackets.length).toBeGreaterThan(0);

          config.whm.brackets.forEach((bracket) => {
            expect(typeof bracket.from).toBe('number');
            expect(typeof bracket.baseTax).toBe('number');
            expect(typeof bracket.rate).toBe('number');
            expect(bracket.rate).toBeGreaterThanOrEqual(0);
            expect(bracket.rate).toBeLessThanOrEqual(1);
          });
        });

        it('should have valid Medicare configuration', () => {
          expect(typeof config.medicare.fullRate).toBe('number');
          expect(config.medicare.fullRate).toBe(0.02); // Should be 2%
          expect(typeof config.medicare.reducedRate).toBe('number');
          expect(config.medicare.reducedRate).toBe(0.01); // Should be 1%
          expect(typeof config.medicare.lowIncomeThreshold).toBe('number');
          expect(config.medicare.lowIncomeThreshold).toBeGreaterThanOrEqual(0); // 0 = no phase-in
          expect(typeof config.medicare.lowIncomePhaseInEnd).toBe('number');
          expect(config.medicare.lowIncomePhaseInEnd).toBeGreaterThanOrEqual(
            config.medicare.lowIncomeThreshold
          );
        });

        it('should have valid HELP configuration', () => {
          expect(config.help.thresholds).toBeDefined();
          expect(Array.isArray(config.help.thresholds)).toBe(true);
          expect(config.help.thresholds.length).toBeGreaterThan(0);
          expect(typeof config.help.isMarginalSystem).toBe('boolean');

          config.help.thresholds.forEach((threshold) => {
            expect(typeof threshold.minIncome).toBe('number');
            expect(threshold.minIncome).toBeGreaterThanOrEqual(0);
            expect(typeof threshold.rate).toBe('number');
            expect(threshold.rate).toBeGreaterThanOrEqual(0);
            expect(threshold.rate).toBeLessThanOrEqual(1);
          });

          // Verify thresholds are in ascending order
          for (let i = 1; i < config.help.thresholds.length; i++) {
            expect(config.help.thresholds[i].minIncome).toBeGreaterThan(
              config.help.thresholds[i - 1].minIncome
            );
          }
        });

        it('should have valid LITO configuration', () => {
          expect(typeof config.lito.maxOffset).toBe('number');
          expect(config.lito.maxOffset).toBeGreaterThanOrEqual(0);
          expect(typeof config.lito.phaseOut1Start).toBe('number');
          expect(config.lito.phaseOut1Start).toBeGreaterThan(0);
          expect(typeof config.lito.phaseOut1Rate).toBe('number');
          expect(config.lito.phaseOut1Rate).toBeGreaterThanOrEqual(0);
          expect(typeof config.lito.phaseOut2Start).toBe('number');
          expect(config.lito.phaseOut2Start).toBeGreaterThan(
            config.lito.phaseOut1Start
          );
          expect(typeof config.lito.phaseOut2Rate).toBe('number');
          expect(config.lito.phaseOut2Rate).toBeGreaterThanOrEqual(0);
        });

        it('should have valid concessional cap', () => {
          expect(typeof config.concessionalCap).toBe('number');
          expect(config.concessionalCap).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Tax Year Specifics', () => {
    it('2024-25 should have correct HELP first threshold ($54,435)', () => {
      const config = TAX_YEAR_MAP['2024-25'];
      expect(config.help.thresholds[0].minIncome).toBe(54435);
    });

    it('2024-25 should use legacy HELP system', () => {
      const config = TAX_YEAR_MAP['2024-25'];
      expect(config.help.isMarginalSystem).toBe(false);
    });

    it('2025-26 should use marginal HELP system', () => {
      const config = TAX_YEAR_MAP['2025-26'];
      expect(config.help.isMarginalSystem).toBe(true);
    });

    it('2025-26 should have first marginal HELP threshold at $67,000', () => {
      const config = TAX_YEAR_MAP['2025-26'];
      expect(config.help.thresholds[0].minIncome).toBe(67000);
    });

    it('2025-26 top HELP tier should use wholeIncome calculation', () => {
      const config = TAX_YEAR_MAP['2025-26'];
      const topTier = config.help.thresholds[config.help.thresholds.length - 1];
      expect(topTier.wholeIncome).toBe(true);
      expect(topTier.rate).toBe(0.1); // 10%
    });

    it('concessional caps should increase over time', () => {
      expect(TAX_YEAR_MAP['2020-21'].concessionalCap).toBe(25000);
      expect(TAX_YEAR_MAP['2021-22'].concessionalCap).toBe(27500);
      expect(TAX_YEAR_MAP['2022-23'].concessionalCap).toBe(27500);
      expect(TAX_YEAR_MAP['2023-24'].concessionalCap).toBe(27500);
      expect(TAX_YEAR_MAP['2024-25'].concessionalCap).toBe(30000);
      expect(TAX_YEAR_MAP['2025-26'].concessionalCap).toBe(30000);
    });

    it('2024-25 should have LITO max offset of $700', () => {
      const config = TAX_YEAR_MAP['2024-25'];
      expect(config.lito.maxOffset).toBe(700);
    });

    it('2024-25 LITO should start phasing out at $37,500', () => {
      const config = TAX_YEAR_MAP['2024-25'];
      expect(config.lito.phaseOut1Start).toBe(37500);
    });
  });

  describe('Data Consistency', () => {
    it('all years should have the same Medicare rates', () => {
      TAX_YEAR_CONFIGS.forEach((config) => {
        expect(config.medicare.fullRate).toBe(0.02);
        expect(config.medicare.reducedRate).toBe(0.01);
      });
    });

    it('all years should have the same tax-free threshold', () => {
      TAX_YEAR_CONFIGS.forEach((config) => {
        expect(config.resident.taxFreeThreshold).toBe(18200);
      });
    });

    it('all years should have WHM brackets starting at 15%', () => {
      TAX_YEAR_CONFIGS.forEach((config) => {
        expect(config.whm.brackets[0].rate).toBe(0.15);
      });
    });
  });
});
