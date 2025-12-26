/**
 * Pay Summary Calculator
 *
 * Calculates tax withholding, net pay, and superannuation for Australian taxpayers.
 * Supports resident, non-resident, and Working Holiday Maker (WHM) tax treatments.
 */

import { TAX_YEAR_MAP, type TaxBracket } from './taxYearData';
import {
  PayCalculateRequest,
  PayCalculateResponse,
  PayBreakdown,
  Residency,
  TaxYearId,
} from './types';

const clamp0 = (n: number) => (Number.isFinite(n) ? Math.max(0, n) : 0);

const periodsPerYear = {
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
  annually: 1,
} as const;

/**
 * Calculate income tax based on residency status
 */
function calculateIncomeTax(
  taxYear: TaxYearId,
  taxableIncome: number,
  residency: Residency,
  claimTaxFree: boolean
): number {
  const config = TAX_YEAR_MAP[taxYear];
  const income = clamp0(taxableIncome);

  let brackets: TaxBracket[];

  if (residency === 'nonResident') {
    brackets = config.nonResident.brackets;
  } else if (residency === 'workingHoliday') {
    brackets = config.whm.brackets;
  } else {
    // Resident
    brackets = config.resident.brackets;

    // If not claiming tax-free threshold, remove the first bracket
    if (!claimTaxFree) {
      // Apply rate from bracket 2 to all income
      brackets = brackets.slice(1);
    }
  }

  // Find the applicable bracket
  const bracket = brackets.find(
    (b) => income >= b.from && (b.to === undefined || income <= b.to)
  );

  if (!bracket) return 0;

  return clamp0(bracket.baseTax + (income - bracket.from) * bracket.rate);
}

/**
 * Calculate Medicare levy with low-income phase-in support
 */
function calculateMedicare(
  taxYear: TaxYearId,
  taxableIncome: number,
  option: 'full' | 'reduced' | 'exempt'
): number {
  if (option === 'exempt') return 0;

  const config = TAX_YEAR_MAP[taxYear].medicare;
  const income = clamp0(taxableIncome);

  const baseRate = option === 'reduced' ? config.reducedRate : config.fullRate;

  // If thresholds are not configured (set to 0), use flat rate
  if (
    config.lowIncomeThreshold <= 0 ||
    config.lowIncomePhaseInEnd <= config.lowIncomeThreshold
  ) {
    return income * baseRate;
  }

  // Below threshold: no levy
  if (income <= config.lowIncomeThreshold) {
    return 0;
  }

  // In phase-in zone: shade-in formula
  if (income < config.lowIncomePhaseInEnd) {
    // The ATO uses a formula where the levy is a percentage of the excess
    // over the threshold, calibrated so it equals the full levy at phaseInEnd
    const shadeRate =
      (baseRate * config.lowIncomePhaseInEnd) /
      (config.lowIncomePhaseInEnd - config.lowIncomeThreshold);
    return shadeRate * (income - config.lowIncomeThreshold);
  }

  // Above phase-in zone: full levy
  return income * baseRate;
}

/**
 * Calculate HELP/HECS repayment
 * Supports both legacy (whole-income rate) and marginal systems
 */
function calculateHELP(taxYear: TaxYearId, taxableIncome: number): number {
  const config = TAX_YEAR_MAP[taxYear].help;
  const income = clamp0(taxableIncome);

  if (config.isMarginalSystem) {
    // 2025-26+ marginal system
    // Find the active band
    let activeBand = config.thresholds[0]; // Start with first band
    for (const band of config.thresholds) {
      if (income >= band.minIncome) {
        activeBand = band;
      } else {
        break;
      }
    }

    // No repayment if rate is 0
    if (!activeBand || activeBand.rate <= 0) return 0;

    // If wholeIncome flag is set, apply rate to whole income
    if (activeBand.wholeIncome) {
      return income * activeBand.rate;
    }

    // Otherwise, marginal calculation: base + rate on excess
    const base = activeBand.baseRepayment ?? 0;
    const excess = Math.max(income - activeBand.minIncome, 0);
    return base + excess * activeBand.rate;
  } else {
    // Legacy system (2024-25 and earlier): flat rate on whole income
    // Find the last band where income >= minIncome
    let currentRate = 0;
    for (const band of config.thresholds) {
      if (income >= band.minIncome) {
        currentRate = band.rate;
      } else {
        break;
      }
    }

    return currentRate > 0 ? income * currentRate : 0;
  }
}

/**
 * Calculate pay summary for a given request
 */
export function calculatePaySummary(
  req: PayCalculateRequest
): PayCalculateResponse {
  // Extract and default parameters
  const residency: Residency = req.residency ?? 'resident';
  const claimTaxFree = req.claimTaxFreeThreshold ?? true;

  // Non-residents and WHM are automatically exempt from Medicare levy
  const medicareOption: 'full' | 'reduced' | 'exempt' =
    residency === 'nonResident' || residency === 'workingHoliday'
      ? 'exempt'
      : req.medicareExempt
        ? 'exempt'
        : req.medicareReduced
          ? 'reduced'
          : 'full';

  const deductions = clamp0(req.deductions);
  const superRate = clamp0(req.superRate);

  // Handle includeSuper flag
  let annualSalary: number;
  let employerSuper: number;

  if (req.includeSuper && superRate > 0) {
    // Total package includes super, back-calculate base salary
    const totalPackage = clamp0(req.annualSalary);
    annualSalary = totalPackage / (1 + superRate);
    employerSuper = totalPackage - annualSalary;
  } else {
    // Base salary only, super is on top
    annualSalary = clamp0(req.annualSalary);
    employerSuper = annualSalary * superRate;
  }

  const taxableAnnual = clamp0(annualSalary - deductions);

  // Calculate tax components
  const incomeTaxAnnual = calculateIncomeTax(
    req.taxYear,
    taxableAnnual,
    residency,
    claimTaxFree
  );

  const medicareAnnual = calculateMedicare(
    req.taxYear,
    taxableAnnual,
    medicareOption
  );

  const helpAnnual = req.hasHELP
    ? calculateHELP(req.taxYear, taxableAnnual)
    : 0;

  const totalWithheldAnnual = incomeTaxAnnual + medicareAnnual + helpAnnual;
  const netAnnual = annualSalary - totalWithheldAnnual;

  const periods = periodsPerYear[req.frequency];

  // Build annual breakdown
  const annual: PayBreakdown = {
    gross: annualSalary,
    taxable: taxableAnnual,
    incomeTax: incomeTaxAnnual,
    medicareLevy: medicareAnnual,
    help: helpAnnual,
    totalWithheld: totalWithheldAnnual,
    net: netAnnual,
    employerSuper,
  };

  // Build per-period breakdown
  const perPeriod: PayBreakdown = {
    gross: annual.gross / periods,
    taxable: annual.taxable / periods,
    incomeTax: annual.incomeTax / periods,
    medicareLevy: annual.medicareLevy / periods,
    help: annual.help / periods,
    totalWithheld: annual.totalWithheld / periods,
    net: annual.net / periods,
    employerSuper: annual.employerSuper / periods,
  };

  const effectiveTaxRate =
    annual.gross > 0 ? annual.totalWithheld / annual.gross : 0;

  // Build meta description
  const config = TAX_YEAR_MAP[req.taxYear];
  const residencyLabel =
    residency === 'resident'
      ? 'Resident'
      : residency === 'nonResident'
        ? 'Non-resident'
        : 'WHM';

  return {
    meta: {
      taxYear: req.taxYear,
      residency,
      tables: {
        residentIncomeTax: `${residencyLabel} rates (${config.label})`,
        helpRepayment: config.help.isMarginalSystem
          ? 'HELP marginal system'
          : 'HELP legacy rates',
        medicareLevy:
          medicareOption === 'exempt'
            ? 'Medicare levy exempt'
            : medicareOption === 'reduced'
              ? 'Medicare levy (reduced rate)'
              : 'Medicare levy (standard rate)',
        super: 'Employer super = gross × superRate',
      },
    },
    perPeriod,
    annual,
    effectiveTaxRate,
  };
}
