import type { RawFundraiser } from '@/lib/api/normalize-fundraiser';
import type { Fundraiser } from '@/lib/types/fundraiser';

import { normalizeFundraiser } from '@/lib/api/normalize-fundraiser';
import { platformFetch } from '@/lib/api/platform-fetch';
import { convertTotalRaisedToSingleCurrency } from '@/lib/utils/fundraiser';

interface FundraisersApiEnvelope {
  fundraisers?: unknown;
  data?: unknown;
  items?: unknown;
}

export interface DashboardSummaryStats {
  totalFundraiserCount: number;
  activeFundraiserCount: number;
  donationsCount: number;
  consolidatedTotalRaised: { amount: number; currency: string } | null;
}

function normalizeFundraisersResponse(payload: unknown): Fundraiser[] {
  if (Array.isArray(payload)) {
    return (payload as RawFundraiser[]).map(normalizeFundraiser);
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const envelope = payload as FundraisersApiEnvelope;
  const candidates = [envelope.fundraisers, envelope.data, envelope.items];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return (candidate as RawFundraiser[]).map(normalizeFundraiser);
    }
  }

  return [];
}

export async function getFundraisers(token: string): Promise<Fundraiser[]> {
  const payload = await platformFetch<unknown>('/fundraisers', { token });

  return normalizeFundraisersResponse(payload);
}

export function getDashboardSummary(
  fundraisers: Fundraiser[]
): DashboardSummaryStats {
  let activeFundraiserCount = 0;
  let donationsCount = 0;

  const CURRENCY_PRIORITY: Record<string, number> = {
    EUR: 0,
    USD: 1,
    CHF: 2,
    BRL: 3,
    CZK: 4,
  };

  const raisedByCurrency = new Map<
    string,
    { currency: string; totalRaised: number; fundraiserCount: number }
  >();

  for (const fundraiser of fundraisers) {
    if (fundraiser.status === 'active') {
      activeFundraiserCount += 1;
    }

    if (Number.isFinite(fundraiser.donationCount)) {
      donationsCount += fundraiser.donationCount;
    }

    // Distribute raised amounts across currency buckets
    for (const [currencyKey, amount] of Object.entries(
      fundraiser.totalRaised
    )) {
      if (!currencyKey) continue;
      const safeAmount = Number.isFinite(amount) ? amount : 0;
      const currency = currencyKey.toUpperCase();
      const existing = raisedByCurrency.get(currency);
      if (existing) {
        existing.totalRaised += safeAmount;
      } else {
        raisedByCurrency.set(currency, {
          currency,
          totalRaised: safeAmount,
          fundraiserCount: 0,
        });
      }
    }

    // Count each fundraiser once against its primary currency (skip when a
    // fundraiser has no currency set yet, e.g. a draft).
    if (fundraiser.currency) {
      const primaryCurrency = fundraiser.currency.toUpperCase();
      const primaryEntry = raisedByCurrency.get(primaryCurrency) ?? {
        currency: primaryCurrency,
        totalRaised: 0,
        fundraiserCount: 0,
      };
      primaryEntry.fundraiserCount += 1;
      raisedByCurrency.set(primaryCurrency, primaryEntry);
    }
  }

  const sortedRaisedByCurrency = Array.from(raisedByCurrency.values()).sort(
    (a, b) => {
      const byCount = b.fundraiserCount - a.fundraiserCount;
      if (byCount !== 0) return byCount;
      const priorityA = CURRENCY_PRIORITY[a.currency] ?? Infinity;
      const priorityB = CURRENCY_PRIORITY[b.currency] ?? Infinity;
      return priorityA - priorityB || a.currency.localeCompare(b.currency);
    }
  );

  const dominant = sortedRaisedByCurrency[0] ?? null;
  const consolidatedTotalRaised = dominant
    ? {
        amount: convertTotalRaisedToSingleCurrency(
          Object.fromEntries(
            sortedRaisedByCurrency.map(({ currency, totalRaised }) => [
              currency,
              totalRaised,
            ])
          ),
          dominant.currency
        ),
        currency: dominant.currency,
      }
    : null;

  return {
    totalFundraiserCount: fundraisers.length,
    activeFundraiserCount,
    donationsCount,
    consolidatedTotalRaised,
  };
}
