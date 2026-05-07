import type { LeaderboardModuleSettings } from '@/lib/types/fundraiser';

import { getLeaderboardWithRetry } from '@/lib/api/leaderboard-service';
import { Skeleton } from '@/components/ui/skeleton';
import { LeaderboardView } from './leaderboard-view';

interface LeaderboardLoaderProps {
  idOrSlug: string;
  settings: LeaderboardModuleSettings;
}

export async function LeaderboardLoader({
  idOrSlug,
  settings,
}: LeaderboardLoaderProps) {
  let data;
  try {
    data = await getLeaderboardWithRetry(idOrSlug);
  } catch {
    return null;
  }

  return (
    <LeaderboardView
      idOrSlug={idOrSlug}
      recentDonations={data.recent}
      topDonations={data.top}
      settings={settings}
    />
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className='w-full flex flex-col gap-3'>
      <div className='flex gap-2'>
        <Skeleton className='h-9 w-20' />
        <Skeleton className='h-9 w-28' />
      </div>
      <div className='flex items-center gap-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='flex items-center gap-3 shrink-0'>
            <Skeleton className='h-8 w-8 rounded-full' />
            <div className='flex flex-col gap-1'>
              <Skeleton className='h-3.5 w-24' />
              <Skeleton className='h-3 w-16' />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
