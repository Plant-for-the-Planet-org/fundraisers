'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';
import type { ReshareMoment } from '@/lib/utils/fundraiser-reshare';

import { useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getReshareMoment } from '@/lib/utils/fundraiser-reshare';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDonorReadiness } from './donor-readiness';

/** The fresh news a host can share again, or null: the goal reached, a milestone passed, the first donors. */
export function useReshareMoment(fundraiser: Fundraiser): ReshareMoment | null {
  const donorProgress = useDonorReadiness();
  return useMemo(
    () => getReshareMoment(fundraiser, donorProgress),
    [fundraiser, donorProgress]
  );
}

/**
 * Tells the host when there is news worth sharing again: a milestone, the goal, or their first donors.
 * The story always shows the latest numbers, so a reshare is never stale, and this is the reminder to do it.
 * It follows the fundraiser's data and stores nothing, so each reminder goes by itself once the fundraiser has moved on.
 */
export function ReshareMomentCard({ fundraiser }: { fundraiser: Fundraiser }) {
  const t = useTranslations('Dashboard.fundraiser.reshare');
  const moment = useReshareMoment(fundraiser);
  if (!moment) return null;

  const copy =
    moment.kind === 'goal'
      ? {
          title: t('goal.title'),
          body: t('goal.body'),
          action: t('goal.action'),
        }
      : moment.kind === 'progress'
        ? {
            title: t('progress.title', { percent: moment.percent }),
            body: t('progress.body'),
            action: t('progress.action'),
          }
        : {
            title: t('donors.title'),
            body: t('donors.body', { count: moment.count }),
            action: t('donors.action'),
          };

  return (
    <Card className='gap-3 border-accent-color/30 bg-accent-color/5 px-6 py-5 shadow-xs'>
      <div>
        <h2 className='text-lg font-semibold text-foreground'>{copy.title}</h2>
        <p className='mt-1 text-sm text-muted-foreground'>{copy.body}</p>
      </div>
      <Button asChild size='sm' className='w-max'>
        <Link
          href={`/dashboard/fundraisers/${encodeURIComponent(fundraiser.slug)}/share`}
        >
          {copy.action}
        </Link>
      </Button>
    </Card>
  );
}
