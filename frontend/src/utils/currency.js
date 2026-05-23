/**
 * Currency utilities — DriveCare (INR / en-IN locale)
 *
 * formatINR(1500)      → "₹1,500.00"
 * formatINR(150000)    → "₹1,50,000.00"   (Indian lakh grouping)
 * formatINRCompact(1500) → "₹1,500"        (no decimals, for display cards)
 */

const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const INR_COMPACT_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format a number as Indian Rupees with 2 decimal places.
 * e.g. formatINR(150000) → "₹1,50,000.00"
 */
export function formatINR(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return '₹0.00';
  return INR_FORMATTER.format(num);
}

/**
 * Format a number as Indian Rupees with no decimal places.
 * e.g. formatINRCompact(150000) → "₹1,50,000"
 */
export function formatINRCompact(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return '₹0';
  return INR_COMPACT_FORMATTER.format(num);
}

/**
 * Currency symbol constant — use this instead of hardcoding "₹"
 */
export const CURRENCY_SYMBOL = '₹';

/**
 * Currency label for input field hints
 */
export const CURRENCY_LABEL = 'INR (₹)';
