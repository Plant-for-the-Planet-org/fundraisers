import type { Fundraiser } from '@/lib/types/fundraiser';

import { platformFetch } from '@/lib/api/platform-fetch';

interface FundraisersApiEnvelope {
  fundraisers?: unknown;
  data?: unknown;
  items?: unknown;
}

export interface DashboardSummaryStats {
  totalFundraiserCount: number;
  activeFundraiserCount: number;
  donationsCount: number;
  totalRaisedByCurrency: DashboardRaisedSummary[];
}

export interface DashboardRaisedSummary {
  currency: string;
  totalRaised: number;
  fundraiserCount: number;
}

function normalizeFundraisersResponse(payload: unknown): Fundraiser[] {
  if (Array.isArray(payload)) {
    return payload as Fundraiser[];
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const envelope = payload as FundraisersApiEnvelope;
  const candidates = [envelope.fundraisers, envelope.data, envelope.items];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as Fundraiser[];
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

  const raisedByCurrency = new Map<string, DashboardRaisedSummary>();

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

    // Count each fundraiser once in its primary currency bucket
    const primaryCurrency = fundraiser.currency.toUpperCase();
    const primaryEntry = raisedByCurrency.get(primaryCurrency) ?? {
      currency: primaryCurrency,
      totalRaised: 0,
      fundraiserCount: 0,
    };
    primaryEntry.fundraiserCount += 1;
    raisedByCurrency.set(primaryCurrency, primaryEntry);
  }

  const totalRaisedByCurrency = Array.from(raisedByCurrency.values()).sort(
    (a, b) => {
      return (
        b.totalRaised - a.totalRaised || a.currency.localeCompare(b.currency)
      );
    }
  );

  return {
    totalFundraiserCount: fundraisers.length,
    activeFundraiserCount,
    donationsCount,
    totalRaisedByCurrency,
  };
}
