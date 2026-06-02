/**
 * Shared number utilities for normalizing API data.
 */

/** Raw shape of totalRaised from the platform API — may be a number or a per-currency map. */
export type RawTotalRaised = number | Record<string, unknown> | null;

/**
 * Coerce an unknown value to a finite number, or null if not possible.
 */
export function coerceNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

/**
 * Normalize the API's totalRaised field to a plain number.
 *
 * Handles two API shapes:
 * - Direct numeric value (e.g. 123.45)
 * - Per-currency map (e.g. { EUR: 123.45, USD: 130.2 }) — picks the entry matching `currency`.
 */
export function normalizeTotalRaised(
  totalRaised: RawTotalRaised,
  currency: string
): number {
  const direct = coerceNumber(totalRaised);
  if (direct !== null) {
    return direct;
  }

  if (!totalRaised || typeof totalRaised !== 'object') {
    return 0;
  }

  const byCurrency = totalRaised as Record<string, unknown>;
  const normalizedCurrency = currency.trim().toUpperCase();
  for (const [key, value] of Object.entries(byCurrency)) {
    if (key.trim().toUpperCase() === normalizedCurrency) {
      const amount = coerceNumber(value);
      if (amount !== null) {
        return amount;
      }
    }
  }

  return 0;
}
