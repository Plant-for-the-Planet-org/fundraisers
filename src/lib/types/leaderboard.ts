import type { LeaderboardModuleSettings } from './fundraiser';

export interface LeaderboardDonation {
  id: string;
  amount: number;
  currency: string;
  donorName: string;
  /** ISO 8601 timestamp without timezone, e.g. "2001-04-24T09:12:24" — treat as UTC */
  created: string;
  avatarUrl?: string | null;
  isAnonymous?: boolean;
}

export interface LeaderboardApiResponse {
  recent: LeaderboardDonation[];
  top: LeaderboardDonation[];
  recentTotal: number;
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
