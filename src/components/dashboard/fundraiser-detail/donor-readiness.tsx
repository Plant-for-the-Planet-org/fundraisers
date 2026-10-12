'use client';

import type { ReactNode } from 'react';
import type { ShareDonorProgress } from '@/lib/share/share-data';
import type { Fundraiser } from '@/lib/types/fundraiser';

import { createContext, useContext, useEffect, useState } from 'react';
import { getLeaderboard } from '@/lib/api/leaderboard-service';
import {
  getShareDonorProgress,
  previewDonorProgress,
  previewLeaderboard,
  SHARE_LEADERBOARD_LIMIT,
} from '@/lib/share/share-data';

const DonorReadinessContext = createContext<ShareDonorProgress | null>(null);

/**
 * Whether this fundraiser's donors can be named on a story, by the public page's rules, loaded once for the tabs and the pages under them.
 * It is what lets the dashboard say when it is time to refresh the story.
 */
export function DonorReadinessProvider({
  fundraiser,
  children,
}: {
  fundraiser: Fundraiser;
  children: ReactNode;
}) {
  const [loaded, setLoaded] = useState<{
    slug: string;
    progress: ShareDonorProgress;
  } | null>(null);
  useEffect(() => {
    let ignore = false;
    // A development server can stand in made-up donors (`?donors=4`), as the Share tab does.
    const previewBoard = previewLeaderboard(window.location.search);
    (previewBoard
      ? Promise.resolve(previewBoard)
      : getLeaderboard(fundraiser.slug, SHARE_LEADERBOARD_LIMIT)
    )
      .then(board => {
        if (!ignore)
          setLoaded({
            slug: fundraiser.slug,
            progress:
              previewDonorProgress(window.location.search) ??
              getShareDonorProgress(fundraiser, board),
          });
      })
      // Nothing to say when the leaderboard cannot be loaded: no dot and no card.
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, [fundraiser]);
  const progress = loaded?.slug === fundraiser.slug ? loaded.progress : null;
  return (
    <DonorReadinessContext.Provider value={progress}>
      {children}
    </DonorReadinessContext.Provider>
  );
}

/** Null until it is known. */
export function useDonorReadiness(): ShareDonorProgress | null {
  return useContext(DonorReadinessContext);
}
