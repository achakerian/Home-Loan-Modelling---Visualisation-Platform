/**
 * Formatting Policy:
 * - Currency: Max 8 figures, no decimal places (e.g., $12,345,678)
 * - Input percentages: 2 decimal places (for user input)
 * - Display percentages: 1 decimal place (for showing results)
 */

const MAX_CURRENCY_VALUE = 99_999_999; // 8 figures max

/**
 * Clamps a value to ensure it doesn't exceed maximum currency value
 */
const clampCurrency = (value: number): number => {
  return Math.min(Math.abs(value), MAX_CURRENCY_VALUE) * Math.sign(value);
};

/**
 * Formats a number as Australian currency with no decimal places
 * Values are clamped to max 8 figures (99,999,999)
 * @param value - The number to format
 * @returns Formatted currency string (e.g., "$12,345,678")
 */
export const formatCurrency = (value: number): string => {
  const clamped = clampCurrency(value);
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(clamped)
    .replace('A$', '$');
};

/**
 * Formats a number with thousand separators (no currency symbol, no decimals)
 * @param value - The number to format
 * @returns Formatted number string (e.g., "12,345")
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-AU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Formats a decimal as a percentage for display (1 decimal place)
 * @param value - Decimal value (e.g., 0.155 for 15.5%)
 * @returns Formatted percentage string (e.g., "15.5%")
 */
export const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

/**
 * Formats a percentage value for input fields (2 decimal places)
 * @param value - Decimal value (e.g., 0.1555 for 15.55%)
 * @returns Formatted string for input (e.g., "15.55")
 */
export const formatPercentInput = (value: number): string => {
  return (value * 100).toFixed(2);
};

/**
 * Formats a percentage value for display with no decimals
 * Used in specific cases like pie charts where integer percentages are needed
 * @param value - Decimal value (e.g., 0.155 for 16%)
 * @returns Formatted percentage string (e.g., "16%")
 */
export const formatPercentWhole = (value: number): string => {
  return `${Math.round(value * 100)}%`;
};

/**
 * Removes leading zeros from a string
 * @param value - The string to process
 * @returns String without leading zeros
 */
export const stripLeadingZeros = (value: string): string => {
  return value.replace(/^0+(?=\d)/, '');
};

/**
 * Converts a string to a number, returning 0 for invalid inputs
 * @param value - The string to convert
 * @returns The parsed number or 0
 */
export const toNumberOrZero = (value: string): number => {
  const normalized = stripLeadingZeros(value.trim());
  if (normalized === '' || normalized === '.' || normalized === '-') {
    return 0;
  }
  return Number(normalized);
};

/**
 * Formats a number in thousands (e.g., 5000 becomes "5k")
 * @param value - The number to format
 * @returns Formatted string
 */
export const formatThousands = (value: number): string => {
  if (value >= 1000) {
    return `${Math.round(value / 1000)}k`;
  }
  return `${Math.round(value)}`;
};
