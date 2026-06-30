/**
 * Utility functions for fundraisers
 */

import type { Fundraiser } from '../types/fundraiser';
import type { Nullable } from '../types/utility';

export interface FundraiserUrlData {
  id: string;
  slug?: Nullable<string>;
}

/**
 * True when `userId` matches an `admin` host on `fundraiser`.
 * Returns false when `userId` is missing.
 */
export function isFundraiserOwnerOrAdmin(
  fundraiser: Fundraiser,
  userId: string | null | undefined
): boolean {
  if (!userId) return false;
  return fundraiser.hosts.some(
    host => host.user?.id === userId && host.role === 'admin'
  );
}

/**
 * Generate a fundraiser URL using the new /raise/[id|slug] pattern
 * Prioritizes slug over ID when available
 *
 * @param fundraiser - Object containing id and optional slug
 * @returns URL path for the fundraiser
 */
export function getFundraiserUrl(fundraiser: FundraiserUrlData): string {
  const identifier = fundraiser.slug || fundraiser.id;
  return `/raise/${encodeURIComponent(identifier)}`;
}

export interface SingleCurrencyTotalRaised {
  currency: string;
  amount: number;
}

/**
 * Returns raised amounts as a sorted array (highest first), filtering out zero or non-finite values. Currency keys are normalized to uppercase.
 */
export function getTotalRaisedByCurrency(
  totalRaised: Record<string, number>
): SingleCurrencyTotalRaised[] {
  return Object.entries(totalRaised)
    .filter(([_currency, amount]) => Number.isFinite(amount) && amount > 0)
    .map(([currency, amount]) => ({ currency: currency.toUpperCase(), amount }))
    .sort((a, b) => b.amount - a.amount);
}

// Hardcoded floor exchange rates, one row per workspace (base) currency.
// Every workspace currency needs a row here.
//
// Each value is "base per 1 unit of foreign" — multiply each foreign bucket by
// it, sum, round down. The bias is deliberate: the shown total leans at or
// below the true amount raised.
//
// The table is NOT reciprocal, on purpose — both directions must lose value, so
// EUR-per-CHF is not 1/(CHF-per-EUR). A fundraiser reads only its own row and
// never composes two. Do not "fix" this into a consistent matrix.
//
// Guarantees differ by row:
//   - EUR/CHF/USD crosses sit below the multi-year low → never over-report.
//   - BRL/CZK crosses are ~p25 of the trailing 2 years → lean low, but can
//     slightly over-report on the bottom quarter of days.
//
// TODO: temporary. The durable fix is to freeze the realized rate into
// fundraiser metadata at close, so a closed number never needs a guessed rate.
const FLOOR_RATES: Record<string, Record<string, number>> = {
  EUR: { EUR: 1, CHF: 0.83, USD: 0.8, BRL: 0.15, CZK: 0.04 },
  CHF: { CHF: 1, EUR: 0.85, USD: 0.74, BRL: 0.14, CZK: 0.036 },
  USD: { USD: 1, EUR: 0.93, CHF: 0.93, BRL: 0.18, CZK: 0.046 },
  BRL: { BRL: 1, EUR: 5.9, CHF: 6.4, USD: 5.0, CZK: 0.24 },
  CZK: { CZK: 1, EUR: 24.0, CHF: 26.0, USD: 20.4, BRL: 3.7 },
};

/**
 * Converts a multi-currency totalRaised record to a single amount in
 * `targetCurrency` using hardcoded floor rates (temp until API rates exist).
 *
 * Reads the target currency's row from {@link FLOOR_RATES}, multiplies each
 * currency bucket by its floor factor, sums, then rounds the total down so the
 * result never exceeds the true amount raised.
 *
 * Foreign currencies absent from the row contribute 0 (rather than 1:1) to
 * preserve the never-over-report invariant. A target currency with no row
 * falls back to counting only same-currency donations.
 */
export function convertTotalRaisedToSingleCurrency(
  totalRaised: Record<string, number>,
  targetCurrency: string
): number {
  const target = targetCurrency.toUpperCase();
  const targetRates = FLOOR_RATES[target] ?? { [target]: 1 };
  const total = Object.entries(totalRaised)
    .filter(([, amount]) => Number.isFinite(amount) && amount > 0)
    .reduce((sum, [currency, amount]) => {
      const factor = targetRates[currency.toUpperCase()];
      return factor === undefined ? sum : sum + amount * factor;
    }, 0);
  return Math.floor(total);
}

/**
 * Days remaining until `endDate`, rounded up, never negative.
 */
export function getDaysLeft(endDate: string): number {
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return 0;
  const now = new Date();
  return Math.max(
    0,
    Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );
}
