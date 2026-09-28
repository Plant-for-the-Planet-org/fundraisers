'use client';

import type { LeaderboardDonation } from '@/lib/types/leaderboard';

import { useEffect, useRef, useState } from 'react';

const AMOUNTS = [25, 10, 50, 15, 100, 20, 5, 40, 30, 75];
const SEED_COUNT = 5;
const MAX_RECENT = 10;

export interface StageDemoState {
  recent: LeaderboardDonation[];
  raised: number;
  donationCount: number;
}

function timestamp(msAgo: number): string {
  return new Date(Date.now() - msAgo).toISOString().slice(0, 19);
}

function seed(
  donors: string[],
  currency: string,
  startRaised: number
): StageDemoState {
  const recent: LeaderboardDonation[] = [];
  for (let i = 0; i < Math.min(SEED_COUNT, donors.length); i++) {
    recent.unshift({
      id: `demo-${i}`,
      donorName: donors[i],
      amount: AMOUNTS[i % AMOUNTS.length],
      currency,
      created: timestamp((SEED_COUNT - i) * 90_000),
    });
  }
  return {
    recent,
    raised: startRaised + recent.reduce((sum, d) => sum + d.amount, 0),
    donationCount: SEED_COUNT,
  };
}

// Sample donations for the About page demo, so the stage reacts the way it does at a real event. Nothing here touches the API.
export function useStageDemo(
  donors: string[],
  currency: string,
  startRaised: number,
  intervalMs = 6000
): StageDemoState {
  const [state, setState] = useState(() => seed(donors, currency, startRaised));
  // Survives effect restarts, so a re-render never hands out an id twice.
  const nextId = useRef(SEED_COUNT);

  useEffect(() => {
    const id = setInterval(() => {
      const next = nextId.current;
      nextId.current += 1;
      setState(prev => {
        const donation: LeaderboardDonation = {
          id: `demo-${next}`,
          donorName: donors[next % donors.length],
          amount: AMOUNTS[next % AMOUNTS.length],
          currency,
          created: timestamp(0),
        };
        return {
          recent: [donation, ...prev.recent].slice(0, MAX_RECENT),
          raised: prev.raised + donation.amount,
          donationCount: prev.donationCount + 1,
        };
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [donors, currency, intervalMs]);

  return state;
}
