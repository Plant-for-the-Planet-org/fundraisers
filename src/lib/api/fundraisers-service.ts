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

  const byCurrency = new Map<string, DashboardRaisedSummary>();

  for (const fundraiser of fundraisers) {
    if (fundraiser.status === 'active') {
      activeFundraiserCount += 1;
    }

    if (Number.isFinite(fundraiser.donationCount)) {
      donationsCount += fundraiser.donationCount;
    }

    if (typeof fundraiser.currency !== 'string' || fundraiser.currency === '') {
      continue;
    }

    const currency = fundraiser.currency.toUpperCase();
    const existing = byCurrency.get(currency);
    const safeTotalRaised = Number.isFinite(fundraiser.totalRaised)
      ? fundraiser.totalRaised
      : 0;

    if (existing) {
      existing.totalRaised += safeTotalRaised;
      existing.fundraiserCount += 1;
      continue;
    }

    byCurrency.set(currency, {
      currency,
      totalRaised: safeTotalRaised,
      fundraiserCount: 1,
    });
  }

  const totalRaisedByCurrency = Array.from(byCurrency.values()).sort((a, b) => {
    return (
      b.totalRaised - a.totalRaised || a.currency.localeCompare(b.currency)
    );
  });

  return {
    totalFundraiserCount: fundraisers.length,
    activeFundraiserCount,
    donationsCount,
    totalRaisedByCurrency,
  };
}
