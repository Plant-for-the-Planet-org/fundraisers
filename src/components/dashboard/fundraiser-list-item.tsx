'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Clock, Users } from 'lucide-react';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { getDaysLeft, getFundraiserUrl } from '@/lib/utils/fundraiser';
import { deriveDisplayStatus, getHostNames } from '@/lib/utils/fundraiser-list';
import { getImageUrl } from '@/lib/utils/images';
import { cn } from '@/lib/utils/index';
import { FundraiserCardImage } from '@/components/explore/fundraiser-card-image';
import { FundraiserActionMenu } from './fundraiser-action-menu';
import { FundraiserStatusBadge } from './fundraiser-status-badge';

interface FundraiserListItemProps {
  fundraiser: Fundraiser;
  onFundraiserUpdated: (updatedFundraiser: Fundraiser) => void;
}

export function FundraiserListItem({
  fundraiser,
  onFundraiserUpdated,
}: FundraiserListItemProps) {
  const t = useTranslations('Dashboard.list.item');
  const tFundraisers = useTranslations('Fundraisers');
  const locale = useLocale();

  const imageUrl = getImageUrl('fundraiser', 'thumb', fundraiser.image);
  const daysLeft = getDaysLeft(fundraiser.endDate);
  const displayStatus = deriveDisplayStatus(fundraiser);

  const hostNames = getHostNames(fundraiser);
  const hostName =
    hostNames.length === 0
      ? tFundraisers('unknownHost')
      : new Intl.ListFormat(locale, {
          style: 'long',
          type: 'conjunction',
        }).format(hostNames);

  const raised = formatCurrencyFromDecimal(
    fundraiser.totalRaised,
    fundraiser.currency,
    { compact: true }
  );
  const goal = formatCurrencyFromDecimal(
    fundraiser.goalAmount,
    fundraiser.currency,
    { compact: true }
  );

  const showEnded =
    fundraiser.status === 'completed' || fundraiser.status === 'cancelled';

  return (
    <li className='fundraiser-list-item group flex items-start gap-4 py-4'>
      <Link
        href={getFundraiserUrl(fundraiser)}
        className='shrink-0 h-20 w-20 overflow-hidden rounded-lg bg-muted transition-transform duration-300 group-hover:scale-110'
        aria-hidden
        tabIndex={-1}
      >
        <FundraiserCardImage imageUrl={imageUrl} alt='' />
      </Link>

      <div className='min-w-0 flex-1'>
        <div className='flex items-center justify-between gap-x-2 gap-y-1'>
          <h3 className='text-base font-semibold text-foreground line-clamp-2'>
            <Link
              href={getFundraiserUrl(fundraiser)}
              className='hover:text-primary transition-colors'
            >
              {fundraiser.title}
            </Link>
          </h3>
          <FundraiserActionMenu
            fundraiser={fundraiser}
            onFundraiserUpdated={onFundraiserUpdated}
          />
        </div>

        <div className='mt-1 flex items-center gap-2'>
          <FundraiserStatusBadge status={displayStatus} />
          {displayStatus !== 'draft' && daysLeft > 0 && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-sm text-muted-foreground',
                displayStatus === 'ending-soon' && 'text-warning'
              )}
            >
              <Clock className='h-3.5 w-3.5' aria-hidden='true' />
              {showEnded ? t('ended') : t('daysLeft', { count: daysLeft })}
            </span>
          )}
        </div>

        <div className='mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground'>
          <span>
            {t.rich('goalProgress', {
              achievedAmount: raised,
              goal,
              b: chunks => (
                <span className='font-semibold text-foreground'>{chunks}</span>
              ),
            })}
          </span>
          <span className='inline-flex items-center gap-1'>
            <Users className='h-3.5 w-3.5' aria-hidden='true' />
            {t('donations', { count: fundraiser.donationCount })}
          </span>
        </div>

        <p className='mt-1 truncate text-sm text-muted-foreground'>
          {t('byHost', { host: hostName })}
        </p>
      </div>
    </li>
  );
}
