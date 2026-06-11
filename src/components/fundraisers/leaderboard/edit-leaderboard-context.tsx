'use client';

import type { ReactNode } from 'react';
import type { LeaderboardDonation } from '@/lib/types/leaderboard';

import { createContext, useContext, useEffect, useState } from 'react';
import { getLeaderboard } from '@/lib/api/leaderboard-service';

interface EditLeaderboardState {
  /** True while the initial fetch is in flight; consumers should show a skeleton. */
  isLoading: boolean;
  recent: LeaderboardDonation[];
  top: LeaderboardDonation[];
  /** Total recent donations across all pages (for the view-all overlay). */
  recentTotal: number;
  /** Total top entries across all pages (for the view-all overlay). */
  topTotal: number;
  donationCount: number;
  donorCount: number;
}

interface EditLeaderboardContextValue extends EditLeaderboardState {
  idOrSlug: string;
  /** Whether the fundraiser has any real donations to show instead of mocks. */
  hasRealDonations: boolean;
}

const EMPTY_STATE: EditLeaderboardState = {
  isLoading: true,
  recent: [],
  top: [],
  recentTotal: 0,
  topTotal: 0,
  donationCount: 0,
  donorCount: 0,
};

const EditLeaderboardContext =
  createContext<EditLeaderboardContextValue | null>(null);

/**
 * Fetches the fundraiser's real leaderboard donations once and shares them with
 * the edit-form preview components. Only mounted in edit mode; create mode has
 * no provider, so consumers fall back to mock data.
 */
export function EditLeaderboardProvider({
  idOrSlug,
  children,
}: {
  idOrSlug: string;
  children: ReactNode;
}) {
  const [state, setState] = useState<EditLeaderboardState>(EMPTY_STATE);

  useEffect(() => {
    let active = true;

    getLeaderboard(idOrSlug)
      .then(response => {
        if (!active) return;
        setState({
          isLoading: false,
          recent: response.recent,
          top: response.top,
          recentTotal: response.recentTotal,
          topTotal: response.topTotal,
          donationCount: response.donationCount,
          donorCount: response.donorCount,
        });
      })
      .catch(() => {
        // On error, stop loading with empty data so consumers fall back to mocks.
        if (!active) return;
        setState({ ...EMPTY_STATE, isLoading: false });
      });

    return () => {
      active = false;
    };
  }, [idOrSlug]);

  const value: EditLeaderboardContextValue = {
    ...state,
    idOrSlug,
    hasRealDonations: !state.isLoading && state.donationCount > 0,
  };

  return (
    <EditLeaderboardContext.Provider value={value}>
      {children}
    </EditLeaderboardContext.Provider>
  );
}

/** Returns the edit-mode leaderboard data, or null when not in edit mode. */
export function useEditLeaderboard(): EditLeaderboardContextValue | null {
  return useContext(EditLeaderboardContext);
}
