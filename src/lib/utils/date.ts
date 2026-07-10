// Utilities for working with the YYYY-MM-DD format used by the fundraiser API
// and native date inputs.

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns a date offset from today as YYYY-MM-DD.
 * Negative values return past dates, 0 returns today.
 */
export function getDateOffsetFromToday(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return formatLocalDate(date);
}

/**
 * Validates that a value is a real YYYY-MM-DD date.
 */
export function isValidDateInput(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Converts an API date/datetime value to YYYY-MM-DD for date inputs.
 * Returns an empty string for missing or invalid values.
 */
export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return '';
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : '';
}
