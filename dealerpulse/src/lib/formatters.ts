/**
 * Format a number as Indian Rupees with lakhs/crores abbreviation.
 */
export function formatCurrency(value: number, compact = true): string {
  if (compact) {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(1)}Cr`;
    }
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(0)}K`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  }
  return `₹${value.toLocaleString('en-IN')}`;
}

/**
 * Format a number compactly.
 */
export function formatNumber(value: number): string {
  if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}

/**
 * Format a percentage.
 */
export function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a month string "2025-06" to "Jun 2025".
 */
export function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

/**
 * Format a date string to short form.
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Calculate days between two dates.
 */
export function daysBetween(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  return Math.floor(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Days since a given date string from "now" (Dec 31 2025, the latest data point).
 */
export function daysSinceLastActivity(dateStr: string): number {
  const reference = new Date('2025-12-31T23:59:59Z');
  const d = new Date(dateStr);
  return Math.floor((reference.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get the month string "YYYY-MM" from a date string.
 */
export function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
