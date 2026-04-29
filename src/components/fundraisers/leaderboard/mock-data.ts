import type { LeaderboardDonation } from '@/lib/types/leaderboard';

type MockBase = Omit<LeaderboardDonation, 'currency' | 'created'>;

const MOCK_RECENT_BASE: MockBase[] = [
  { id: '1', amount: 50, donorName: 'Maria Schmidt' },
  { id: '2', amount: 20, donorName: 'James Kim' },
  { id: '3', amount: 100, donorName: 'Sarah Lindqvist' },
  { id: '4', amount: 35, donorName: 'Ahmed Al-Rashid' },
  { id: '5', amount: 80, donorName: 'Liu Wei' },
  { id: '6', amount: 25, donorName: 'Anna Bergström' },
];

const MOCK_TOP_BASE: MockBase[] = [...MOCK_RECENT_BASE].sort(
  (a, b) => b.amount - a.amount
);

const RECENT_OFFSETS_MS = [2, 5, 12, 60, 120, 180].map(m => m * 60 * 1000);

export function getMockLeaderboardDonations(currency: string): {
  recent: LeaderboardDonation[];
  top: LeaderboardDonation[];
} {
  const now = Date.now();
  return {
    recent: MOCK_RECENT_BASE.map((d, i) => ({
      ...d,
      currency,
      created: new Date(now - (RECENT_OFFSETS_MS[i] ?? 0)).toISOString(),
    })),
    top: MOCK_TOP_BASE.map((d, i) => ({
      ...d,
      currency,
      created: new Date(now - (RECENT_OFFSETS_MS[i] ?? 0)).toISOString(),
    })),
  };
}
