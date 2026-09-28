'use client';

import type { ReactNode } from 'react';
import type { DashboardSummaryStats } from '@/lib/api/fundraisers-service';
import type { Fundraiser } from '@/lib/types/fundraiser';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getDashboardSummary,
  getFundraisers,
} from '@/lib/api/fundraisers-service';
import { useAuthStore } from '@/stores/auth-store';

const EMPTY_SUMMARY: DashboardSummaryStats = {
  totalFundraiserCount: 0,
  activeFundraiserCount: 0,
  donationsCount: 0,
  consolidatedTotalRaised: null,
};

interface DashboardFundraisersValue {
  fundraisers: Fundraiser[];
  summary: DashboardSummaryStats;
  isLoading: boolean;
  hasError: boolean;
  refetch: () => void;
  onFundraiserUpdated: (updatedFundraiser: Fundraiser) => void;
  onFundraiserRemoved: (id: string) => void;
}

const DashboardFundraisersContext =
  createContext<DashboardFundraisersValue | null>(null);

/**
 * Holds the signed-in user's fundraiser list for the Overview and Fundraisers pages.
 *
 * It sits in a layout so moving between those two pages keeps the list instead of fetching it again.
 */
export function DashboardFundraisersProvider({
  children,
}: {
  children: ReactNode;
}) {
  const accessToken = useAuthStore(state => state.accessToken);

  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Derived from the list so the stat tiles stay in sync with every mutation (delete, activate, pause, resume) without a refetch.
  const summary = useMemo<DashboardSummaryStats>(
    () =>
      fundraisers.length > 0 ? getDashboardSummary(fundraisers) : EMPTY_SUMMARY,
    [fundraisers]
  );

  const fetchFundraisers = useCallback(
    async (signal?: { aborted: boolean }) => {
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setHasError(false);

      try {
        const data = await getFundraisers(accessToken);

        if (signal?.aborted) return;
        setFundraisers(data);
      } catch (error) {
        if (!signal?.aborted) {
          console.error('[Dashboard] Failed to fetch fundraisers:', error);
          setHasError(true);
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [accessToken]
  );

  useEffect(() => {
    // Mocks AbortSignal (AbortController) so stale responses are ignored if the effect re-runs before a fetch completes, for example when the access token changes.
    const signal = { aborted: false };

    // A client-side fetch has no way to satisfy this rule without a data library this app does not use. PendingInvitations does the same.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchFundraisers(signal);
    return () => {
      signal.aborted = true;
    };
  }, [fetchFundraisers]);

  const refetch = useCallback(() => {
    void fetchFundraisers();
  }, [fetchFundraisers]);

  const onFundraiserUpdated = useCallback((updatedFundraiser: Fundraiser) => {
    setFundraisers(prev =>
      prev.map(fundraiser =>
        fundraiser.id === updatedFundraiser.id
          ? { ...fundraiser, ...updatedFundraiser }
          : fundraiser
      )
    );
  }, []);

  // Both 204 (deleted) and 200 (`status: 'archived'`) count as a successful delete.
  const onFundraiserRemoved = useCallback((id: string) => {
    setFundraisers(prev => prev.filter(fundraiser => fundraiser.id !== id));
  }, []);

  const value = useMemo<DashboardFundraisersValue>(
    () => ({
      fundraisers,
      summary,
      isLoading,
      hasError,
      refetch,
      onFundraiserUpdated,
      onFundraiserRemoved,
    }),
    [
      fundraisers,
      summary,
      isLoading,
      hasError,
      refetch,
      onFundraiserUpdated,
      onFundraiserRemoved,
    ]
  );

  return (
    <DashboardFundraisersContext.Provider value={value}>
      {children}
    </DashboardFundraisersContext.Provider>
  );
}

export function useDashboardFundraisers(): DashboardFundraisersValue {
  const value = useContext(DashboardFundraisersContext);
  if (!value) {
    throw new Error(
      'useDashboardFundraisers must be used inside DashboardFundraisersProvider'
    );
  }
  return value;
}
