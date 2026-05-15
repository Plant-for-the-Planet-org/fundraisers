import type { LeaderboardModuleSettings } from './fundraiser';

export interface LeaderboardDonation {
  id: string;
  amount: number;
  currency: string;
  donorName: string;
  /**
   * Timestamp without timezone, treated as UTC.
   * Summary endpoint uses "T" separator (e.g. "2026-04-10T11:24:59"),
   * paginated endpoints use space separator (e.g. "2026-04-10 11:24:59").
   */
  created: string;
  /** Image filename (not a full URL), e.g. "69f9df4177c13956008505.png" */
  avatarUrl?: string | null;
  isAnonymous?: boolean;
}

export interface LeaderboardApiResponse {
  recent: LeaderboardDonation[];
  top: LeaderboardDonation[];
  /** Total number of recent donations across all pages */
  recentTotal: number;
  /** Total number of top entries across all pages */
  topTotal: number;
  donorCount: number;
  donationCount: number;
  settings: LeaderboardModuleSettings;
}

export interface LeaderboardPageLinks {
  self: string;
  first: string;
  last: string;
  next?: string;
  prev?: string;
}

export interface LeaderboardPageResponse {
  items: LeaderboardDonation[];
  total: number;
  count: number;
  _links: LeaderboardPageLinks;
}
