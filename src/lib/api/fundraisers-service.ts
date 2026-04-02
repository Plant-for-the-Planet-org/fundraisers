import type { Fundraiser } from '@/lib/types/fundraiser';

import { platformAPIClient } from '@/lib/api/external-client';

interface FundraisersApiEnvelope {
  fundraisers?: unknown;
  data?: unknown;
  items?: unknown;
}

export interface DashboardFundraiserStats {
  activeFundraisersCount: number;
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
  const payload = await platformAPIClient.getAuthenticated<unknown>(
    '/fundraisers',
    token
  );

  return normalizeFundraisersResponse(payload);
}

export function getDashboardFundraiserStats(
  fundraisers: Fundraiser[]
): DashboardFundraiserStats {
  const activeFundraisersCount = fundraisers.filter(
    fundraiser => fundraiser.canDonate === true
  ).length;

  const byCurrency = new Map<string, DashboardRaisedSummary>();

  for (const fundraiser of fundraisers) {
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
    activeFundraisersCount,
    totalRaisedByCurrency,
  };
}
