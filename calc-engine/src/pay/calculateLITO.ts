/**
 * Low Income Tax Offset (LITO) Calculation
 *
 * The LITO reduces the amount of tax payable for Australian resident taxpayers
 * with taxable income below certain thresholds.
 *
 * For 2024-25 and 2025-26:
 * - Maximum offset: $700
 * - Phase-out 1: $700 reduced by 5c for each $1 above $37,500
 * - Phase-out 2: Remaining offset reduced by 1.5c for each $1 above $45,000
 * - Fully phased out at approximately $66,667
 *
 * @see https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/offsets-and-rebates/lito
 */

import { TAX_YEAR_MAP } from './taxYearData';
import type { TaxYearId } from './types';

const clamp0 = (n: number) => (Number.isFinite(n) ? Math.max(0, n) : 0);

/**
 * Calculate Low Income Tax Offset for a given tax year and taxable income
 *
 * @param taxYear - Tax year ID (e.g., '2024-25')
 * @param taxableIncome - Annual taxable income
 * @returns LITO amount (always >= 0)
 *
 * @example
 * calculateLITO('2024-25', 30000)  // Returns 700 (full offset)
 * calculateLITO('2024-25', 40000)  // Returns 575 (partially phased out)
 * calculateLITO('2024-25', 50000)  // Returns 125 (heavily phased out)
 * calculateLITO('2024-25', 70000)  // Returns 0 (fully phased out)
 */
export function calculateLITO(
  taxYear: TaxYearId,
  taxableIncome: number
): number {
  // Handle Infinity: high income = no offset
  if (taxableIncome === Infinity) {
    return 0;
  }

  const config = TAX_YEAR_MAP[taxYear].lito;
  const income = clamp0(taxableIncome);

  // Below first phase-out threshold: full offset
  if (income <= config.phaseOut1Start) {
    return config.maxOffset;
  }

  // In first phase-out zone
  if (income <= config.phaseOut2Start) {
    const reduction = config.phaseOut1Rate * (income - config.phaseOut1Start);
    return clamp0(config.maxOffset - reduction);
  }

  // In second phase-out zone
  const firstPhaseReduction =
    config.phaseOut1Rate * (config.phaseOut2Start - config.phaseOut1Start);
  const remainingOffset = config.maxOffset - firstPhaseReduction;
  const secondPhaseReduction =
    config.phaseOut2Rate * (income - config.phaseOut2Start);

  return clamp0(remainingOffset - secondPhaseReduction);
}
