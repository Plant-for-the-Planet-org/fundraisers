'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getDaysLeft, getFundraiserUrl } from '@/lib/utils/fundraiser';
import { deriveDisplayStatus, isLiveStatus } from '@/lib/utils/fundraiser-list';
import {
  ArrowLeftIcon,
  ArrowUpRightFromSquareIcon,
  PenIcon,
} from '@/components/ui/ui-icons';
import { FundraiserStatusBadge } from '../fundraiser-status-badge';

const LINK_CLASS =
  'inline-flex items-center gap-1.5 text-accent-color hover:underline';

export function FundraiserDetailHeader({
  fundraiser,
  canEdit,
}: {
  fundraiser: Fundraiser;
  canEdit: boolean;
}) {
  const t = useTranslations('Dashboard.fundraiser');
  const tItem = useTranslations('Dashboard.list.item');

  const displayStatus = deriveDisplayStatus(fundraiser);
  const daysLeft = getDaysLeft(fundraiser.endDate);
  const showDaysLeft = isLiveStatus(displayStatus) && daysLeft > 0;

  return (
    <div className='space-y-4'>
      <Link
        href='/dashboard/fundraisers'
        className='inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground'
      >
        <ArrowLeftIcon className='size-3.5' />
        {t('back')}
      </Link>

      {/* Title and status read as one block: tight together, with more room above (back link) and below (tabs). */}
      <div className='space-y-2'>
        {/* The title gets the full width, so long names are not squeezed by the buttons. */}
        <h1 className='text-3xl font-bold break-words text-foreground'>
          {fundraiser.title}
        </h1>

        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <FundraiserStatusBadge status={displayStatus} />
            {showDaysLeft && (
              <span>{tItem('daysLeft', { count: daysLeft })}</span>
            )}
          </div>

          {/* Plain links rather than buttons: they sit quietly next to the status instead of competing with the title. */}
          <div className='flex items-center gap-4 text-sm font-medium'>
            <a
              href={getFundraiserUrl(fundraiser)}
              target='_blank'
              rel='noopener noreferrer'
              className={LINK_CLASS}
            >
              <ArrowUpRightFromSquareIcon className='size-3.5' />
              {t('viewPage')}
            </a>
            {canEdit && (
              <Link
                href={`/dashboard/fundraisers/edit/${fundraiser.slug}`}
                className={LINK_CLASS}
              >
                <PenIcon className='size-3.5' />
                {t('edit')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
