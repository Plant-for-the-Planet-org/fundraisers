'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { useId, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import { getFundraiserChecklist } from '@/lib/utils/fundraiser-checklist';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ChevronDownIcon,
  CircleCheckIcon,
  CircleDashedIcon,
} from '@/components/ui/ui-icons';

export function FundraiserChecklistCard({
  fundraiser,
  canEdit,
  onInviteCoHost,
}: {
  fundraiser: Fundraiser;
  /** View-only co-hosts see the steps and can share, but the fixes need edit rights. */
  canEdit: boolean;
  onInviteCoHost: () => void;
}) {
  const t = useTranslations('Dashboard.fundraiser.checklist');
  const [showDone, setShowDone] = useState(false);
  const listId = useId();

  const items = getFundraiserChecklist(fundraiser);
  const doneCount = items.filter(item => item.done).length;
  // Done steps stay out of the way until asked for; shown, they keep their place so the order reads the same.
  const visibleItems = showDone ? items : items.filter(item => !item.done);
  const editHref = `/dashboard/fundraisers/edit/${fundraiser.slug}`;

  return (
    <Card className='gap-4 border-border/60 px-6 py-5 shadow-xs'>
      <div className='flex items-baseline justify-between gap-4'>
        <h2 className='text-lg font-semibold text-foreground'>{t('title')}</h2>
        <span className='text-sm text-muted-foreground'>
          {t('progress', { done: doneCount, total: items.length })}
        </span>
      </div>

      {doneCount === items.length ? (
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <p className='flex items-center gap-2 text-sm text-muted-foreground'>
            <CircleCheckIcon className='size-4 shrink-0 text-success' />
            {fundraiser.canDonate ? t('allDoneShare') : t('allDone')}
          </p>
          {/* Everything is in place, so the next thing that moves the needle is sharing. */}
          {fundraiser.canDonate && (
            <Button asChild size='sm'>
              <Link
                href={`/dashboard/fundraisers/${encodeURIComponent(fundraiser.slug)}/share`}
              >
                {t('share')}
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className='flex flex-col gap-1'>
          <ul
            id={listId}
            className='m-0 flex list-none flex-col divide-y divide-border p-0'
          >
            {visibleItems.map(item => (
              <li key={item.id} className='flex items-start gap-3 py-3'>
                {item.done ? (
                  <CircleCheckIcon className='mt-0.5 size-4 shrink-0 text-success' />
                ) : (
                  <CircleDashedIcon className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                )}
                <div className='min-w-0 flex-1'>
                  <p
                    className={cn(
                      'text-sm font-medium',
                      item.done
                        ? 'text-muted-foreground line-through'
                        : 'text-foreground'
                    )}
                  >
                    {t(`items.${item.id}.title`)}
                  </p>
                  {!item.done && (
                    <p className='mt-0.5 text-sm text-muted-foreground'>
                      {t(`items.${item.id}.hint`)}
                    </p>
                  )}
                </div>
                {!item.done &&
                  (item.id === 'firstDonation' || item.id === 'share' ? (
                    fundraiser.canDonate && (
                      <Button asChild variant='outline' size='sm'>
                        <Link
                          href={`/dashboard/fundraisers/${encodeURIComponent(fundraiser.slug)}/share`}
                        >
                          {t('share')}
                        </Link>
                      </Button>
                    )
                  ) : !canEdit ? null : item.id === 'coHost' ? (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={onInviteCoHost}
                    >
                      {t('invite')}
                    </Button>
                  ) : (
                    <Button asChild variant='outline' size='sm'>
                      <Link href={editHref}>{t('fix')}</Link>
                    </Button>
                  ))}
              </li>
            ))}
          </ul>
          {doneCount > 0 && (
            <Button
              variant='ghost'
              size='sm'
              className='self-start px-2 text-muted-foreground'
              aria-expanded={showDone}
              aria-controls={listId}
              onClick={() => setShowDone(value => !value)}
            >
              {showDone ? t('hideDone') : t('showDone', { count: doneCount })}
              <ChevronDownIcon
                className={cn(
                  'size-3 transition-transform',
                  showDone && 'rotate-180'
                )}
              />
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
