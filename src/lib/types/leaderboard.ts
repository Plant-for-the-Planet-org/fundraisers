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
  donorCount: number;
  donationCount: number;
  settings: LeaderboardModuleSettings;
}
