import type { Fundraiser } from '@/lib/types/fundraiser';

import { platformAPIClient } from '@/lib/api/external-client';

interface FundraisersApiEnvelope {
  fundraisers?: unknown;
  data?: unknown;
  items?: unknown;
}

export interface DashboardFundraiserStats {
  activeFundraisersCount: number;
  totalRaised: number;
  totalRaisedCurrency: string;
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

  // TODO: This is a raw sum across all fundraiser currencies.
  // Keep this value internal until we add currency conversion or per-currency totals.
  const totalRaised = fundraisers.reduce((sum, fundraiser) => {
    return (
      sum +
      (Number.isFinite(fundraiser.totalRaised) ? fundraiser.totalRaised : 0)
    );
  }, 0);

  const totalRaisedCurrency =
    fundraisers.find(fundraiser => typeof fundraiser.currency === 'string')
      ?.currency ?? 'EUR';

  return {
    activeFundraisersCount,
    totalRaised,
    totalRaisedCurrency,
  };
}
