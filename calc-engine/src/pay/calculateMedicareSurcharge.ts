/**
 * Medicare Levy Surcharge (MLS) Calculation
 *
 * The MLS is a levy paid by Australian taxpayers who don't have private hospital cover
 * and earn above certain income thresholds. The surcharge is in addition to the
 * standard 2% Medicare levy.
 *
 * MLS Tiers for singles (2024-25, 2025-26):
 * - $0 - $97,000: No surcharge
 * - $97,001 - $113,000: 1%
 * - $113,001 - $151,000: 1.25%
 * - $151,001+: 1.5%
 *
 * Note: Family thresholds are higher and include additional amounts per dependent.
 * This function implements single thresholds only.
 *
 * @see https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy-surcharge
 */

import type { TaxYearId } from './types';

const clamp0 = (n: number) => (Number.isFinite(n) ? Math.max(0, n) : 0);

/**
 * Medicare Levy Surcharge tiers
 * Note: These are relatively stable across tax years, but could be moved to
 * taxYearData.ts if they start varying significantly.
 */
const MLS_TIERS = [
  { from: 0, to: 97000, rate: 0 },
  { from: 97000, to: 113000, rate: 0.01 },
  { from: 113000, to: 151000, rate: 0.0125 },
  { from: 151000, rate: 0.015 },
] as const;

/**
 * Calculate Medicare Levy Surcharge
 *
 * @param taxYear - Tax year ID (currently unused, but included for future-proofing)
 * @param taxableIncome - Annual taxable income
 * @param hasPrivateHealth - Whether taxpayer has private hospital cover
 * @returns MLS amount (always >= 0)
 *
 * @example
 * calculateMedicareSurcharge('2024-25', 90000, false)   // Returns 0 (below threshold)
 * calculateMedicareSurcharge('2024-25', 100000, false)  // Returns 1000 (1% of income)
 * calculateMedicareSurcharge('2024-25', 100000, true)   // Returns 0 (has private health)
 * calculateMedicareSurcharge('2024-25', 120000, false)  // Returns 1500 (1.25% of income)
 */
export function calculateMedicareSurcharge(
  taxYear: TaxYearId,
  taxableIncome: number,
  hasPrivateHealth: boolean
): number {
  // No surcharge if has private health insurance
  if (hasPrivateHealth) {
    return 0;
  }

  // Handle Infinity: return highest tier rate * Infinity = Infinity
  if (taxableIncome === Infinity) {
    return Infinity;
  }

  const income = clamp0(taxableIncome);

  // Find applicable tier
  const tier = MLS_TIERS.find(
    (t) => income >= t.from && (!('to' in t) || income <= t.to)
  );

  return (tier?.rate ?? 0) * income;
}
