/**
 * Concessional Superannuation Contribution Cap Lookup
 *
 * The concessional (pre-tax) super contributions cap is the maximum amount
 * that can be contributed to superannuation at the concessional 15% tax rate
 * before triggering excess contributions tax.
 *
 * Historical caps:
 * - 2020-21: $25,000
 * - 2021-22: $27,500
 * - 2022-23: $27,500
 * - 2023-24: $27,500
 * - 2024-25: $27,500
 * - 2025-26: $30,000
 *
 * @see https://www.ato.gov.au/super-and-retirement/super-contributions/caps-and-rates
 */

import { TAX_YEAR_MAP } from './taxYearData';
import type { TaxYearId } from './types';

/**
 * Get concessional superannuation contribution cap for a tax year
 *
 * @param taxYear - Tax year ID (e.g., '2024-25')
 * @returns Annual concessional cap in dollars
 *
 * @example
 * getConcessionalCap('2020-21')  // Returns 25000
 * getConcessionalCap('2024-25')  // Returns 27500
 * getConcessionalCap('2025-26')  // Returns 30000
 */
export function getConcessionalCap(taxYear: TaxYearId): number {
  return TAX_YEAR_MAP[taxYear].concessionalCap;
}
