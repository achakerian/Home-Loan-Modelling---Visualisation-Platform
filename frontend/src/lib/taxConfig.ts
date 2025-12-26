/**
 * @deprecated This file has been superseded by calc-engine package.
 *
 * All tax calculations have been consolidated into the calc-engine package
 * as the single source of truth. This file is maintained for backward
 * compatibility but will be removed in a future release.
 *
 * Migration Guide:
 * - Import TaxYearId from '@financial-calc/calc-engine' or '../../../calc-engine/src'
 * - Use calculatePaySummary() from calc-engine for all tax calculations
 * - Use getConcessionalCap() from calc-engine for super contribution caps
 * - Use TAX_YEAR_CONFIGS and TAX_YEAR_MAP from calc-engine for tax year data
 *
 * Benefits of using calc-engine:
 * - Supports 6 tax years (2020-21 through 2025-26)
 * - Includes resident, non-resident, and Working Holiday Maker calculations
 * - Implements both legacy and marginal HELP systems
 * - Medicare low-income phase-in support
 * - Low Income Tax Offset (LITO) calculations
 * - Medicare Levy Surcharge (MLS) calculations
 * - Comprehensive test coverage (163 tests)
 *
 * @see /calc-engine/src/pay/taxYearData.ts
 * @see /calc-engine/src/pay/calculatePaySummary.ts
 */

import type { TaxResidency, MedicareOption } from './payTypes';

export type TaxYearId =
  | '2025-26'
  | '2024-25'
  | '2023-24'
  | '2022-23'
  | '2021-22'
  | '2020-21';

interface ResidentTaxConfig {
  taxFreeThreshold: number;
  bracket2Upper: number;
  bracket3Upper: number;
  bracket4Upper: number;
  bracket2Rate: number;
  bracket3BaseTax: number;
  bracket3Rate: number;
  bracket4BaseTax: number;
  bracket4Rate: number;
  bracket5BaseTax: number;
  bracket5Rate: number;
}

interface NonResidentTaxConfig {
  bracket1Upper: number;
  bracket2Upper: number;
  bracket1Rate: number;
  bracket2BaseTax: number;
  bracket2Rate: number;
  bracket3BaseTax: number;
  bracket3Rate: number;
}

interface MedicareYearConfig {
  fullRate: number;
  reducedRate: number;
  // Low-income threshold where levy starts to phase in.
  // If set to 0, we treat the levy as applying from the first dollar
  // using the flat rate.
  lowIncomeThreshold: number;
  // Income where the full levy rate applies. If equal to
  // lowIncomeThreshold, no phase-in is applied.
  lowIncomePhaseInEnd: number;
}

interface HelpThreshold {
  minIncome: number;
  // For legacy HELP years (up to 2024–25), `rate` is the
  // repayment rate on the whole income once this band is
  // reached (we pick the last matching band and apply
  // income * rate).
  //
  // From 2025–26, HELP uses a marginal scheme, where bands
  // may include a baseRepayment and apply `rate` only to
  // income above `minIncome`, or to the whole income.
  rate: number;
  baseRepayment?: number;
  wholeIncome?: boolean;
}

export interface TaxYearConfig {
  id: TaxYearId;
  label: string;
  resident: ResidentTaxConfig;
  nonResident: NonResidentTaxConfig;
  medicare: MedicareYearConfig;
  helpThresholds: HelpThreshold[];
  concessionalCap?: number;
}

export interface TaxBandSegment {
  id: string;
  bandStart: number;
  bandEnd: number | null; // null => open-ended top band
  rate: number;
  incomeInBand: number;
  taxInBand: number;
}

export const TAX_YEAR_CONFIGS: TaxYearConfig[] = [
  {
    id: '2025-26',
    label: '2025–26 (current)',
    resident: {
      taxFreeThreshold: 18200,
      bracket2Upper: 45000,
      bracket3Upper: 135000,
      bracket4Upper: 190000,
      bracket2Rate: 0.16,
      bracket3BaseTax: 4288,
      bracket3Rate: 0.3,
      bracket4BaseTax: 31288,
      bracket4Rate: 0.37,
      bracket5BaseTax: 59888,
      bracket5Rate: 0.45
    },
    nonResident: {
      bracket1Upper: 135000,
      bracket2Upper: 190000,
      bracket1Rate: 0.3,
      bracket2BaseTax: 40500,
      bracket2Rate: 0.37,
      bracket3BaseTax: 61350,
      bracket3Rate: 0.45
    },
    medicare: {
      fullRate: 0.02,
      reducedRate: 0.01,
      lowIncomeThreshold: 27222,
      lowIncomePhaseInEnd: 34027
    },
    helpThresholds: [
      { minIncome: 0, rate: 0, baseRepayment: 0 },
      // $67,001 – $125,000: 15% on amount over $67,000
      { minIncome: 67001, rate: 0.15, baseRepayment: 0 },
      // $125,001 – $179,285: $8,700 + 17% on amount over $125,000
      { minIncome: 125001, rate: 0.17, baseRepayment: 8700 },
      // $179,286+: 10% on entire repayment income
      { minIncome: 179286, rate: 0.1, baseRepayment: 0, wholeIncome: true }
    ],
    concessionalCap: 30000
  },
  {
    id: '2024-25',
    label: '2024–25',
    resident: {
      taxFreeThreshold: 18200,
      bracket2Upper: 45000,
      bracket3Upper: 135000,
      bracket4Upper: 190000,
      bracket2Rate: 0.16,
      bracket3BaseTax: 4288,
      bracket3Rate: 0.3,
      bracket4BaseTax: 31288,
      bracket4Rate: 0.37,
      bracket5BaseTax: 59888,
      bracket5Rate: 0.45
    },
    nonResident: {
      bracket1Upper: 135000,
      bracket2Upper: 190000,
      bracket1Rate: 0.3,
      bracket2BaseTax: 40500,
      bracket2Rate: 0.37,
      bracket3BaseTax: 61350,
      bracket3Rate: 0.45
    },
    medicare: {
      fullRate: 0.02,
      reducedRate: 0.01,
      lowIncomeThreshold: 27222,
      lowIncomePhaseInEnd: 34027
    },
    helpThresholds: [
      { minIncome: 0, rate: 0 },
      { minIncome: 51850, rate: 0.01 },
      { minIncome: 60000, rate: 0.02 },
      { minIncome: 67466, rate: 0.025 },
      { minIncome: 71518, rate: 0.03 },
      { minIncome: 75827, rate: 0.035 },
      { minIncome: 80387, rate: 0.04 },
      { minIncome: 85202, rate: 0.045 },
      { minIncome: 90336, rate: 0.05 },
      { minIncome: 95755, rate: 0.055 },
      { minIncome: 101509, rate: 0.06 },
      { minIncome: 107614, rate: 0.065 },
      { minIncome: 114107, rate: 0.07 },
      { minIncome: 120961, rate: 0.075 },
      { minIncome: 128216, rate: 0.08 },
      { minIncome: 135959, rate: 0.085 },
      { minIncome: 144099, rate: 0.09 },
      { minIncome: 152728, rate: 0.095 },
      { minIncome: 162000, rate: 0.1 }
    ],
    concessionalCap: 27500
  },
  {
    id: '2023-24',
    label: '2023–24',
    resident: {
      taxFreeThreshold: 18200,
      bracket2Upper: 45000,
      bracket3Upper: 120000,
      bracket4Upper: 180000,
      bracket2Rate: 0.19,
      bracket3BaseTax: 5092,
      bracket3Rate: 0.325,
      bracket4BaseTax: 29467,
      bracket4Rate: 0.37,
      bracket5BaseTax: 51667,
      bracket5Rate: 0.45
    },
    nonResident: {
      bracket1Upper: 120000,
      bracket2Upper: 180000,
      bracket1Rate: 0.325,
      bracket2BaseTax: 39000,
      bracket2Rate: 0.37,
      bracket3BaseTax: 61200,
      bracket3Rate: 0.45
    },
    medicare: {
      fullRate: 0.02,
      reducedRate: 0.01,
      lowIncomeThreshold: 24276,
      lowIncomePhaseInEnd: 30345
    },
    helpThresholds: [
      { minIncome: 0, rate: 0 },
      { minIncome: 48763, rate: 0.01 },
      { minIncome: 56384, rate: 0.02 },
      { minIncome: 59827, rate: 0.025 },
      { minIncome: 63418, rate: 0.03 },
      { minIncome: 67247, rate: 0.035 },
      { minIncome: 71302, rate: 0.04 },
      { minIncome: 75608, rate: 0.045 },
      { minIncome: 80196, rate: 0.05 },
      { minIncome: 85035, rate: 0.055 },
      { minIncome: 90140, rate: 0.06 },
      { minIncome: 95555, rate: 0.065 },
      { minIncome: 101289, rate: 0.07 },
      { minIncome: 107389, rate: 0.075 },
      { minIncome: 113859, rate: 0.08 },
      { minIncome: 120704, rate: 0.085 },
      { minIncome: 127947, rate: 0.09 },
      { minIncome: 135643, rate: 0.095 },
      { minIncome: 143852, rate: 0.1 }
    ],
    concessionalCap: 27500
  },
  {
    id: '2022-23',
    label: '2022–23',
    resident: {
      taxFreeThreshold: 18200,
      bracket2Upper: 45000,
      bracket3Upper: 120000,
      bracket4Upper: 180000,
      bracket2Rate: 0.19,
      bracket3BaseTax: 5092,
      bracket3Rate: 0.325,
      bracket4BaseTax: 29467,
      bracket4Rate: 0.37,
      bracket5BaseTax: 51667,
      bracket5Rate: 0.45
    },
    nonResident: {
      bracket1Upper: 120000,
      bracket2Upper: 180000,
      bracket1Rate: 0.325,
      bracket2BaseTax: 39000,
      bracket2Rate: 0.37,
      bracket3BaseTax: 61200,
      bracket3Rate: 0.45
    },
    medicare: {
      fullRate: 0.02,
      reducedRate: 0.01,
      lowIncomeThreshold: 0,
      lowIncomePhaseInEnd: 0
    },
    helpThresholds: [
      { minIncome: 47346, rate: 0.01 },
      { minIncome: 54749, rate: 0.02 },
      { minIncome: 58066, rate: 0.025 },
      { minIncome: 61582, rate: 0.03 },
      { minIncome: 65321, rate: 0.035 },
      { minIncome: 69260, rate: 0.04 },
      { minIncome: 73465, rate: 0.045 },
      { minIncome: 77939, rate: 0.05 },
      { minIncome: 82609, rate: 0.055 },
      { minIncome: 87591, rate: 0.06 },
      { minIncome: 92872, rate: 0.065 },
      { minIncome: 98468, rate: 0.07 },
      { minIncome: 104367, rate: 0.075 },
      { minIncome: 110644, rate: 0.08 },
      { minIncome: 117327, rate: 0.085 },
      { minIncome: 124358, rate: 0.09 },
      { minIncome: 131843, rate: 0.095 },
      { minIncome: 139782, rate: 0.1 }
    ],
    concessionalCap: 27500
  },
  {
    id: '2021-22',
    label: '2021–22',
    resident: {
      taxFreeThreshold: 18200,
      bracket2Upper: 45000,
      bracket3Upper: 120000,
      bracket4Upper: 180000,
      bracket2Rate: 0.19,
      bracket3BaseTax: 5092,
      bracket3Rate: 0.325,
      bracket4BaseTax: 29467,
      bracket4Rate: 0.37,
      bracket5BaseTax: 51667,
      bracket5Rate: 0.45
    },
    nonResident: {
      bracket1Upper: 120000,
      bracket2Upper: 180000,
      bracket1Rate: 0.325,
      bracket2BaseTax: 39000,
      bracket2Rate: 0.37,
      bracket3BaseTax: 61200,
      bracket3Rate: 0.45
    },
    medicare: {
      fullRate: 0.02,
      reducedRate: 0.01,
      lowIncomeThreshold: 0,
      lowIncomePhaseInEnd: 0
    },
    helpThresholds: [
      { minIncome: 45936, rate: 0.01 },
      { minIncome: 53115, rate: 0.02 },
      { minIncome: 56327, rate: 0.025 },
      { minIncome: 59731, rate: 0.03 },
      { minIncome: 63337, rate: 0.035 },
      { minIncome: 67177, rate: 0.04 },
      { minIncome: 71252, rate: 0.045 },
      { minIncome: 75571, rate: 0.05 },
      { minIncome: 80126, rate: 0.055 },
      { minIncome: 84960, rate: 0.06 },
      { minIncome: 90095, rate: 0.065 },
      { minIncome: 95518, rate: 0.07 },
      { minIncome: 101289, rate: 0.075 },
      { minIncome: 107379, rate: 0.08 },
      { minIncome: 113845, rate: 0.085 },
      { minIncome: 120704, rate: 0.09 },
      { minIncome: 127942, rate: 0.095 },
      { minIncome: 135667, rate: 0.1 }
    ],
    concessionalCap: 27500
  },
  {
    id: '2020-21',
    label: '2020–21',
    resident: {
      taxFreeThreshold: 18200,
      bracket2Upper: 45000,
      bracket3Upper: 120000,
      bracket4Upper: 180000,
      bracket2Rate: 0.19,
      bracket3BaseTax: 5092,
      bracket3Rate: 0.325,
      bracket4BaseTax: 29467,
      bracket4Rate: 0.37,
      bracket5BaseTax: 51667,
      bracket5Rate: 0.45
    },
    nonResident: {
      bracket1Upper: 120000,
      bracket2Upper: 180000,
      bracket1Rate: 0.325,
      bracket2BaseTax: 39000,
      bracket2Rate: 0.37,
      bracket3BaseTax: 61200,
      bracket3Rate: 0.45
    },
    medicare: {
      fullRate: 0.02,
      reducedRate: 0.01,
      lowIncomeThreshold: 0,
      lowIncomePhaseInEnd: 0
    },
    helpThresholds: [
      { minIncome: 45168, rate: 0.01 },
      { minIncome: 52229, rate: 0.02 },
      { minIncome: 55395, rate: 0.025 },
      { minIncome: 58706, rate: 0.03 },
      { minIncome: 62239, rate: 0.035 },
      { minIncome: 65976, rate: 0.04 },
      { minIncome: 69953, rate: 0.045 },
      { minIncome: 74193, rate: 0.05 },
      { minIncome: 78608, rate: 0.055 },
      { minIncome: 83357, rate: 0.06 },
      { minIncome: 88390, rate: 0.065 },
      { minIncome: 93701, rate: 0.07 },
      { minIncome: 99350, rate: 0.075 },
      { minIncome: 105340, rate: 0.08 },
      { minIncome: 111691, rate: 0.085 },
      { minIncome: 118437, rate: 0.09 },
      { minIncome: 125568, rate: 0.095 },
      { minIncome: 133149, rate: 0.1 }
    ],
    concessionalCap: 25000
  }
];

export const TAX_YEAR_MAP: Record<TaxYearId, TaxYearConfig> = TAX_YEAR_CONFIGS.reduce(
  (acc, config) => {
    acc[config.id] = config;
    return acc;
  },
  {} as Record<TaxYearId, TaxYearConfig>
);

export const DEFAULT_TAX_YEAR_ID: TaxYearId = '2025-26';

export const createTaxCalculators = (config: TaxYearConfig) => {
  const calculateAnnualTax = (
    taxableIncome: number,
    residency: TaxResidency,
    claimTaxFree: boolean
  ): number => {
    if (taxableIncome <= 0) return 0;

    if (residency !== 'resident') {
      const base = taxableIncome;
      const nonRes = config.nonResident;
      if (base <= nonRes.bracket1Upper) return base * nonRes.bracket1Rate;
      if (base <= nonRes.bracket2Upper)
        return (
          nonRes.bracket2BaseTax + (base - nonRes.bracket1Upper) * nonRes.bracket2Rate
        );
      return (
        nonRes.bracket3BaseTax + (base - nonRes.bracket2Upper) * nonRes.bracket3Rate
      );
    }

    const base = taxableIncome;
    const res = config.resident;

    const thresholdOffset = claimTaxFree ? res.taxFreeThreshold : 0;

    if (claimTaxFree && base <= res.taxFreeThreshold) return 0;
    if (base <= res.bracket2Upper) return (base - thresholdOffset) * res.bracket2Rate;
    if (base <= res.bracket3Upper)
      return res.bracket3BaseTax + (base - res.bracket2Upper) * res.bracket3Rate;
    if (base <= res.bracket4Upper)
      return res.bracket4BaseTax + (base - res.bracket3Upper) * res.bracket4Rate;
    return (
      res.bracket5BaseTax + (base - res.bracket4Upper) * res.bracket5Rate
    );
  };

  const calculateMedicare = (
    taxableIncome: number,
    option: MedicareOption
  ): number => {
    if (option === 'exempt' || taxableIncome <= 0) return 0;
    const m = config.medicare;

    const baseRate = option === 'reduced' ? m.reducedRate : m.fullRate;

    // If thresholds are not configured, fall back to a simple
    // flat-rate approximation from the first dollar.
    if (m.lowIncomeThreshold <= 0 || m.lowIncomePhaseInEnd <= m.lowIncomeThreshold) {
      return taxableIncome * baseRate;
    }

    const income = taxableIncome;

    if (income <= m.lowIncomeThreshold) {
      return 0;
    }

    if (income < m.lowIncomePhaseInEnd) {
      // Phase-in zone: use the standard "shade-in" formula the
      // ATO uses for singles, where the levy is a fixed percentage
      // of the excess over the low-income threshold, chosen so that
      // it equals the full levy at `lowIncomePhaseInEnd`.
      const shadeRate =
        (baseRate * m.lowIncomePhaseInEnd) /
        (m.lowIncomePhaseInEnd - m.lowIncomeThreshold);
      return shadeRate * (income - m.lowIncomeThreshold);
    }

    return income * baseRate;
  };

  const calculateHelpRepayments = (taxableIncome: number): number => {
    if (taxableIncome <= 0) return 0;
    const thresholds = config.helpThresholds;
    if (!thresholds.length) return 0;

    // Determine whether this year uses the newer marginal HELP
    // scheme (baseRepayment / wholeIncome) or the legacy
    // "rate on whole income" approach.
    const usesMarginal = thresholds.some(
      (band) => band.baseRepayment !== undefined || band.wholeIncome
    );

    const income = taxableIncome;

    if (!usesMarginal) {
      // Legacy behaviour: pick the last band whose minIncome is
      // <= income and apply income * rate.
      let currentRate = 0;
      for (const band of thresholds) {
        if (income >= band.minIncome) {
          currentRate = band.rate;
        } else {
          break;
        }
      }
      return currentRate > 0 ? income * currentRate : 0;
    }

    // Marginal behaviour (from 2025–26): find the active band
    // and apply its specific formula.
    let activeBand: HelpThreshold | undefined;
    for (const band of thresholds) {
      if (income >= band.minIncome) {
        activeBand = band;
      } else {
        break;
      }
    }

    if (!activeBand || activeBand.rate <= 0) return 0;

    if (activeBand.wholeIncome) {
      // Flat rate on the whole income (e.g. 10% above top band).
      return income * activeBand.rate;
    }

    const base = activeBand.baseRepayment ?? 0;
    const excess = Math.max(income - activeBand.minIncome, 0);
    return base + excess * activeBand.rate;
  };

  const calculateTaxBreakdown = (
    taxableIncome: number,
    residency: TaxResidency,
    claimTaxFree: boolean
  ): TaxBandSegment[] => {
    const income = Math.max(taxableIncome, 0);
    if (income <= 0) return [];

    const segments: TaxBandSegment[] = [];

    const addSegment = (
      id: string,
      bandStart: number,
      bandEnd: number | null,
      rate: number
    ) => {
      const upper = bandEnd ?? Number.POSITIVE_INFINITY;
      const incomeInBand = Math.max(
        0,
        Math.min(income, upper) - bandStart
      );
      if (incomeInBand <= 0) return;
      const taxInBand = incomeInBand * rate;
      segments.push({ id, bandStart, bandEnd, rate, incomeInBand, taxInBand });
    };

    if (residency !== 'resident') {
      const nonRes = config.nonResident;
      addSegment('non-res-1', 0, nonRes.bracket1Upper, nonRes.bracket1Rate);
      addSegment(
        'non-res-2',
        nonRes.bracket1Upper,
        nonRes.bracket2Upper,
        nonRes.bracket2Rate
      );
      addSegment(
        'non-res-3',
        nonRes.bracket2Upper,
        null,
        nonRes.bracket3Rate
      );
      return segments;
    }

    const res = config.resident;

    const band1Start = 0;
    const band1End = claimTaxFree ? res.taxFreeThreshold : 0;
    if (band1End > band1Start) {
      addSegment('res-1', band1Start, band1End, 0);
    }

    const band2Start = claimTaxFree ? res.taxFreeThreshold : 0;

    addSegment('res-2', band2Start, res.bracket2Upper, res.bracket2Rate);
    addSegment('res-3', res.bracket2Upper, res.bracket3Upper, res.bracket3Rate);
    addSegment('res-4', res.bracket3Upper, res.bracket4Upper, res.bracket4Rate);
    addSegment('res-5', res.bracket4Upper, null, res.bracket5Rate);

    return segments;
  };

  return {
    calculateAnnualTax,
    calculateMedicare,
    calculateHelpRepayments,
    calculateTaxBreakdown
  };
};
