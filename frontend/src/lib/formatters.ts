/**
 * Formats a number as Australian currency
 * @param value - The number to format
 * @returns Formatted currency string (e.g., "$1,000")
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace('A$', '$');
};

/**
 * Formats a number with thousand separators (no currency symbol)
 * @param value - The number to format
 * @returns Formatted number string (e.g., "1,000")
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-AU', {
    maximumFractionDigits: 0,
  }).format(value);
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
