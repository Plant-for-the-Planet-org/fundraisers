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
 * Converts a Date to YYYY-MM-DD.
 */
export function formatDateInput(date: Date): string {
  return formatLocalDate(date);
}
// Shared numeric date format used for display, parsing, and placeholders.
const NUMERIC_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
};

// Uses different day/month values so Intl can reveal the locale's date order.
const ORDER_REFERENCE_DATE = new Date(Date.UTC(2000, 0, 2));

// Cache formatters and parsed date parts per locale.
const numericDateFormatters = new Map<string, Intl.DateTimeFormat>();
const numericDatePartsCache = new Map<string, Intl.DateTimeFormatPart[]>();

function getNumericDateFormat(locale: string): Intl.DateTimeFormat {
  let formatter = numericDateFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, NUMERIC_DATE_OPTIONS);
    numericDateFormatters.set(locale, formatter);
  }
  return formatter;
}

// Returns localized date parts (day/month/year and separators).
function getNumericDateParts(locale: string): Intl.DateTimeFormatPart[] {
  let parts = numericDatePartsCache.get(locale);
  if (!parts) {
    parts = getNumericDateFormat(locale).formatToParts(ORDER_REFERENCE_DATE);
    numericDatePartsCache.set(locale, parts);
  }
  return parts;
}

// Returns the locale-specific field order (e.g. day-month-year).
function getLocaleDateOrder(locale: string): ('day' | 'month' | 'year')[] {
  return getNumericDateParts(locale)
    .filter(p => p.type === 'day' || p.type === 'month' || p.type === 'year')
    .map(p => p.type as 'day' | 'month' | 'year');
}

/**
 * Formats a YYYY-MM-DD value using the locale's numeric date format.
 */
export function formatDateInputLocalized(
  value: string,
  locale: string
): string {
  const date = parseDateInput(value);
  if (!date) return '';
  return getNumericDateFormat(locale).format(date);
}

/**
 * Returns a localized date placeholder (e.g. dd.mm.yyyy or mm/dd/yyyy).
 */
export function getLocaleDatePlaceholder(locale: string): string {
  return getNumericDateParts(locale)
    .map(p => {
      if (p.type === 'day') return 'dd';
      if (p.type === 'month') return 'mm';
      if (p.type === 'year') return 'yyyy';
      return p.value;
    })
    .join('');
}

/**
 * Parses a localized date string into YYYY-MM-DD.
 * Returns:
 * - '' for empty input
 * - null for invalid input
 */
export function parseLocalizedDateInput(
  text: string,
  locale: string
): string | null {
  const trimmed = text.trim();
  if (trimmed === '') return '';

  const numbers = trimmed.split(/\D+/).filter(Boolean);
  if (numbers.length !== 3) return null;

  const order = getLocaleDateOrder(locale);
  if (order.length !== 3) return null;

  const fields = { day: 0, month: 0, year: 0 };
  order.forEach((field, index) => {
    fields[field] = Number(numbers[index]);
  });

  const iso = `${String(fields.year).padStart(4, '0')}-${String(
    fields.month
  ).padStart(2, '0')}-${String(fields.day).padStart(2, '0')}`;
  return isValidDateInput(iso) ? iso : null;
}

/**
 * Parses a YYYY-MM-DD value into a Date.
 */
export function parseDateInput(value: string): Date | undefined {
  if (!isValidDateInput(value)) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year!, month! - 1, day!);
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

/**
 * Returns a YYYY-MM-DD date offset by `days` from the given YYYY-MM-DD value.
 * Returns the input unchanged when it is not a valid date.
 */
export function addDaysToDateInput(value: string, days: number): string {
  if (!isValidDateInput(value)) return value;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year!, month! - 1, day!);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

/**
 * Whole-day difference between two YYYY-MM-DD values (`to` minus `from`).
 * Positive when `to` is later than `from`; 0 when either value is invalid.
 */
export function daysBetweenDateInputs(from: string, to: string): number {
  if (!isValidDateInput(from) || !isValidDateInput(to)) return 0;
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const fromDate = new Date(fy!, fm! - 1, fd!);
  const toDate = new Date(ty!, tm! - 1, td!);
  return Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000);
}
