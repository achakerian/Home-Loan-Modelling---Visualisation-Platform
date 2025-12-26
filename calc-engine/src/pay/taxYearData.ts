/**
 * Comprehensive Australian Tax Year Data (2020-21 through 2025-26)
 *
 * This is the single source of truth for all tax calculations.
 * Ported from frontend/src/lib/taxConfig.ts with corrections and extensions.
 *
 * Data sources:
 * - ATO Tax Rates: https://www.ato.gov.au/rates/individual-income-tax-rates/
 * - HELP Repayment Thresholds: https://www.ato.gov.au/individuals-and-families/study-and-training-support-loans/help-repayment-thresholds-and-rates
 * - Medicare Levy: https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy
 * - Super Caps: https://www.ato.gov.au/super-and-retirement/super-contributions/caps-and-rates
 */

export type TaxYearId =
  | '2020-21'
  | '2021-22'
  | '2022-23'
  | '2023-24'
  | '2024-25'
  | '2025-26';

/**
 * Tax bracket definition for all residency types
 */
export interface TaxBracket {
  /** Start of income range */
  from: number;
  /** End of income range (undefined = open-ended top bracket) */
  to?: number;
  /** Base tax amount at start of bracket */
  baseTax: number;
  /** Marginal tax rate for income in this bracket */
  rate: number;
}

/**
 * Medicare levy configuration
 */
export interface MedicareConfig {
  /** Standard Medicare levy rate (typically 2%) */
  fullRate: number;
  /** Reduced rate for eligible retirees (typically 1%) */
  reducedRate: number;
  /** Income threshold where phase-in begins (0 = no phase-in) */
  lowIncomeThreshold: number;
  /** Income where full rate applies (0 = no phase-in) */
  lowIncomePhaseInEnd: number;
}

/**
 * HELP/HECS repayment threshold
 */
export interface HelpThreshold {
  /** Minimum repayment income for this band */
  minIncome: number;
  /** Repayment rate */
  rate: number;
  /** Base repayment amount (for marginal system from 2025-26) */
  baseRepayment?: number;
  /** If true, rate applies to whole income (used for top tier in 2025-26) */
  wholeIncome?: boolean;
}

/**
 * Low Income Tax Offset (LITO) configuration
 */
export interface LitoConfig {
  /** Maximum offset amount */
  maxOffset: number;
  /** Income where first phase-out starts */
  phaseOut1Start: number;
  /** Phase-out rate for first zone */
  phaseOut1Rate: number;
  /** Income where second phase-out starts */
  phaseOut2Start: number;
  /** Phase-out rate for second zone */
  phaseOut2Rate: number;
}

/**
 * Complete tax configuration for a single financial year
 */
export interface TaxYearConfig {
  /** Tax year identifier (e.g., '2024-25') */
  id: TaxYearId;
  /** Display label (e.g., '2024–25 (current)') */
  label: string;

  /** Resident tax brackets and tax-free threshold */
  resident: {
    brackets: TaxBracket[];
    taxFreeThreshold: number;
  };

  /** Non-resident tax brackets (no tax-free threshold) */
  nonResident: {
    brackets: TaxBracket[];
  };

  /** Working Holiday Maker (WHM) tax brackets */
  whm: {
    brackets: TaxBracket[];
  };

  /** Medicare levy configuration */
  medicare: MedicareConfig;

  /** HELP/HECS repayment thresholds and system type */
  help: {
    thresholds: HelpThreshold[];
    /** True for 2025-26+ marginal system, false for legacy whole-income system */
    isMarginalSystem: boolean;
  };

  /** Low Income Tax Offset configuration */
  lito: LitoConfig;

  /** Concessional superannuation contribution cap */
  concessionalCap: number;
}

/**
 * All 6 tax years (2020-21 through 2025-26)
 * Ordered chronologically from oldest to newest
 */
export const TAX_YEAR_CONFIGS: TaxYearConfig[] = [
  // 2020-21
  {
    id: '2025-26',
    label: '2025–26 (current)',
    resident: {
      taxFreeThreshold: 18200,
      brackets: [
        { from: 0, to: 18200, baseTax: 0, rate: 0 },
        { from: 18200, to: 45000, baseTax: 0, rate: 0.16 },
        { from: 45000, to: 135000, baseTax: 4288, rate: 0.3 },
        { from: 135000, to: 190000, baseTax: 31288, rate: 0.37 },
        { from: 190000, baseTax: 51638, rate: 0.45 },
      ],
    },
    nonResident: {
      brackets: [
        { from: 0, to: 135000, baseTax: 0, rate: 0.3 },
        { from: 135000, to: 190000, baseTax: 40500, rate: 0.37 },
        { from: 190000, baseTax: 61350, rate: 0.45 },
      ],
    },
    whm: {
      brackets: [
        { from: 0, to: 45000, baseTax: 0, rate: 0.15 },
        { from: 45000, to: 135000, baseTax: 6750, rate: 0.325 },
        { from: 135000, to: 190000, baseTax: 35625, rate: 0.37 },
        { from: 190000, baseTax: 55975, rate: 0.45 },
      ],
    },
    medicare: {
      fullRate: 0.02,
      reducedRate: 0.01,
      lowIncomeThreshold: 27222,
      lowIncomePhaseInEnd: 34027,
    },
    help: {
      isMarginalSystem: true,
      thresholds: [
        // $67,000 – $125,000: 15% on amount over $67,000
        { minIncome: 67000, rate: 0.15, baseRepayment: 0 },
        // $125,001 – $179,285: $8,700 + 17% on amount over $125,000
        { minIncome: 125001, rate: 0.17, baseRepayment: 8700 },
        // $179,286+: 10% on entire repayment income
        { minIncome: 179286, rate: 0.1, baseRepayment: 0, wholeIncome: true },
      ],
    },
    lito: {
      maxOffset: 700,
      phaseOut1Start: 37500,
      phaseOut1Rate: 0.05,
      phaseOut2Start: 45000,
      phaseOut2Rate: 0.015,
    },
    concessionalCap: 30000,
  },

  // 2024-25
  {
    id: '2024-25',
    label: '2024–25',
    resident: {
      taxFreeThreshold: 18200,
      brackets: [
        { from: 0, to: 18200, baseTax: 0, rate: 0 },
        { from: 18200, to: 45000, baseTax: 0, rate: 0.16 },
        { from: 45000, to: 135000, baseTax: 4288, rate: 0.3 },
        { from: 135000, to: 190000, baseTax: 31288, rate: 0.37 },
        { from: 190000, baseTax: 51638, rate: 0.45 },
      ],
    },
    nonResident: {
      brackets: [
        { from: 0, to: 135000, baseTax: 0, rate: 0.3 },
        { from: 135000, to: 190000, baseTax: 40500, rate: 0.37 },
        { from: 190000, baseTax: 61350, rate: 0.45 },
      ],
    },
    whm: {
      brackets: [
        { from: 0, to: 45000, baseTax: 0, rate: 0.15 },
        { from: 45000, to: 135000, baseTax: 6750, rate: 0.325 },
        { from: 135000, to: 190000, baseTax: 35625, rate: 0.37 },
        { from: 190000, baseTax: 55975, rate: 0.45 },
      ],
    },
    medicare: {
      fullRate: 0.02,
      reducedRate: 0.01,
      lowIncomeThreshold: 27222,
      lowIncomePhaseInEnd: 34027,
    },
    help: {
      isMarginalSystem: false,
      thresholds: [
        // CORRECTED: Was $51,850 in taxConfig.ts, but ATO uses $54,435
        { minIncome: 54435, rate: 0.01 },
        { minIncome: 62850, rate: 0.02 },
        { minIncome: 66620, rate: 0.025 },
        { minIncome: 70618, rate: 0.03 },
        { minIncome: 74855, rate: 0.035 },
        { minIncome: 79346, rate: 0.04 },
        { minIncome: 84107, rate: 0.045 },
        { minIncome: 89153, rate: 0.05 },
        { minIncome: 94502, rate: 0.055 },
        { minIncome: 100173, rate: 0.06 },
        { minIncome: 106183, rate: 0.065 },
        { minIncome: 112554, rate: 0.07 },
        { minIncome: 119307, rate: 0.075 },
        { minIncome: 126465, rate: 0.08 },
        { minIncome: 134053, rate: 0.085 },
        { minIncome: 142097, rate: 0.09 },
        { minIncome: 150623, rate: 0.095 },
        { minIncome: 159660, rate: 0.1 },
      ],
    },
    lito: {
      maxOffset: 700,
      phaseOut1Start: 37500,
      phaseOut1Rate: 0.05,
      phaseOut2Start: 45000,
      phaseOut2Rate: 0.015,
    },
    concessionalCap: 30000,
  },

  // 2023-24
  {
    id: '2023-24',
    label: '2023–24',
    resident: {
      taxFreeThreshold: 18200,
      brackets: [
        { from: 0, to: 18200, baseTax: 0, rate: 0 },
        { from: 18200, to: 45000, baseTax: 0, rate: 0.19 },
        { from: 45000, to: 120000, baseTax: 5092, rate: 0.325 },
        { from: 120000, to: 180000, baseTax: 29467, rate: 0.37 },
        { from: 180000, baseTax: 51667, rate: 0.45 },
      ],
    },
    nonResident: {
      brackets: [
        { from: 0, to: 120000, baseTax: 0, rate: 0.325 },
        { from: 120000, to: 180000, baseTax: 39000, rate: 0.37 },
        { from: 180000, baseTax: 61200, rate: 0.45 },
      ],
    },
    whm: {
      brackets: [
        { from: 0, to: 45000, baseTax: 0, rate: 0.15 },
        { from: 45000, to: 120000, baseTax: 6750, rate: 0.325 },
        { from: 120000, to: 180000, baseTax: 31125, rate: 0.37 },
        { from: 180000, baseTax: 53325, rate: 0.45 },
      ],
    },
    medicare: {
      fullRate: 0.02,
      reducedRate: 0.01,
      lowIncomeThreshold: 24276,
      lowIncomePhaseInEnd: 30345,
    },
    help: {
      isMarginalSystem: false,
      thresholds: [
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
        { minIncome: 143852, rate: 0.1 },
      ],
    },
    lito: {
      maxOffset: 700,
      phaseOut1Start: 37500,
      phaseOut1Rate: 0.05,
      phaseOut2Start: 45000,
      phaseOut2Rate: 0.015,
    },
    concessionalCap: 27500,
  },

  // 2022-23
  {
    id: '2022-23',
    label: '2022–23',
    resident: {
      taxFreeThreshold: 18200,
      brackets: [
        { from: 0, to: 18200, baseTax: 0, rate: 0 },
        { from: 18200, to: 45000, baseTax: 0, rate: 0.19 },
        { from: 45000, to: 120000, baseTax: 5092, rate: 0.325 },
        { from: 120000, to: 180000, baseTax: 29467, rate: 0.37 },
        { from: 180000, baseTax: 51667, rate: 0.45 },
      ],
    },
    nonResident: {
      brackets: [
        { from: 0, to: 120000, baseTax: 0, rate: 0.325 },
        { from: 120000, to: 180000, baseTax: 39000, rate: 0.37 },
        { from: 180000, baseTax: 61200, rate: 0.45 },
      ],
    },
    whm: {
      brackets: [
        { from: 0, to: 45000, baseTax: 0, rate: 0.15 },
        { from: 45000, to: 120000, baseTax: 6750, rate: 0.325 },
        { from: 120000, to: 180000, baseTax: 31125, rate: 0.37 },
        { from: 180000, baseTax: 53325, rate: 0.45 },
      ],
    },
    medicare: {
      fullRate: 0.02,
      reducedRate: 0.01,
      lowIncomeThreshold: 0,
      lowIncomePhaseInEnd: 0,
    },
    help: {
      isMarginalSystem: false,
      thresholds: [
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
        { minIncome: 139782, rate: 0.1 },
      ],
    },
    lito: {
      maxOffset: 700,
      phaseOut1Start: 37500,
      phaseOut1Rate: 0.05,
      phaseOut2Start: 45000,
      phaseOut2Rate: 0.015,
    },
    concessionalCap: 27500,
  },

  // 2021-22
  {
    id: '2021-22',
    label: '2021–22',
    resident: {
      taxFreeThreshold: 18200,
      brackets: [
        { from: 0, to: 18200, baseTax: 0, rate: 0 },
        { from: 18200, to: 45000, baseTax: 0, rate: 0.19 },
        { from: 45000, to: 120000, baseTax: 5092, rate: 0.325 },
        { from: 120000, to: 180000, baseTax: 29467, rate: 0.37 },
        { from: 180000, baseTax: 51667, rate: 0.45 },
      ],
    },
    nonResident: {
      brackets: [
        { from: 0, to: 120000, baseTax: 0, rate: 0.325 },
        { from: 120000, to: 180000, baseTax: 39000, rate: 0.37 },
        { from: 180000, baseTax: 61200, rate: 0.45 },
      ],
    },
    whm: {
      brackets: [
        { from: 0, to: 45000, baseTax: 0, rate: 0.15 },
        { from: 45000, to: 120000, baseTax: 6750, rate: 0.325 },
        { from: 120000, to: 180000, baseTax: 31125, rate: 0.37 },
        { from: 180000, baseTax: 53325, rate: 0.45 },
      ],
    },
    medicare: {
      fullRate: 0.02,
      reducedRate: 0.01,
      lowIncomeThreshold: 0,
      lowIncomePhaseInEnd: 0,
    },
    help: {
      isMarginalSystem: false,
      thresholds: [
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
        { minIncome: 135667, rate: 0.1 },
      ],
    },
    lito: {
      maxOffset: 700,
      phaseOut1Start: 37500,
      phaseOut1Rate: 0.05,
      phaseOut2Start: 45000,
      phaseOut2Rate: 0.015,
    },
    concessionalCap: 27500,
  },

  // 2020-21
  {
    id: '2020-21',
    label: '2020–21',
    resident: {
      taxFreeThreshold: 18200,
      brackets: [
        { from: 0, to: 18200, baseTax: 0, rate: 0 },
        { from: 18200, to: 45000, baseTax: 0, rate: 0.19 },
        { from: 45000, to: 120000, baseTax: 5092, rate: 0.325 },
        { from: 120000, to: 180000, baseTax: 29467, rate: 0.37 },
        { from: 180000, baseTax: 51667, rate: 0.45 },
      ],
    },
    nonResident: {
      brackets: [
        { from: 0, to: 120000, baseTax: 0, rate: 0.325 },
        { from: 120000, to: 180000, baseTax: 39000, rate: 0.37 },
        { from: 180000, baseTax: 61200, rate: 0.45 },
      ],
    },
    whm: {
      brackets: [
        { from: 0, to: 45000, baseTax: 0, rate: 0.15 },
        { from: 45000, to: 120000, baseTax: 6750, rate: 0.325 },
        { from: 120000, to: 180000, baseTax: 31125, rate: 0.37 },
        { from: 180000, baseTax: 53325, rate: 0.45 },
      ],
    },
    medicare: {
      fullRate: 0.02,
      reducedRate: 0.01,
      lowIncomeThreshold: 0,
      lowIncomePhaseInEnd: 0,
    },
    help: {
      isMarginalSystem: false,
      thresholds: [
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
        { minIncome: 133149, rate: 0.1 },
      ],
    },
    lito: {
      maxOffset: 700,
      phaseOut1Start: 37500,
      phaseOut1Rate: 0.05,
      phaseOut2Start: 45000,
      phaseOut2Rate: 0.015,
    },
    concessionalCap: 25000,
  },
];

/**
 * Map for O(1) lookup by tax year ID
 */
export const TAX_YEAR_MAP: Record<TaxYearId, TaxYearConfig> =
  TAX_YEAR_CONFIGS.reduce(
    (acc, config) => {
      acc[config.id] = config;
      return acc;
    },
    {} as Record<TaxYearId, TaxYearConfig>
  );

/**
 * Default tax year (current year)
 */
export const DEFAULT_TAX_YEAR: TaxYearId = '2025-26';
