'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Clock, Users } from 'lucide-react';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { getDaysLeft, getFundraiserUrl } from '@/lib/utils/fundraiser';
import { getImageUrl } from '@/lib/utils/images';
import { FundraiserCardImage } from '@/components/explore/fundraiser-card-image';

interface FundraiserListItemProps {
  fundraiser: Fundraiser;
}

export function FundraiserListItem({ fundraiser }: FundraiserListItemProps) {
  const t = useTranslations('Dashboard.list.item');
  const tFundraisers = useTranslations('Fundraisers');
  const locale = useLocale();

  const imageUrl = getImageUrl('fundraiser', 'thumb', fundraiser.image);
  const daysLeft = getDaysLeft(fundraiser.endDate);

  const hostNames = fundraiser.hosts
    .map(host => host.displayName ?? host.user?.name)
    .filter((name): name is string => Boolean(name));
  const hostName =
    hostNames.length === 0
      ? tFundraisers('unknownHost')
      : new Intl.ListFormat(locale, {
          style: 'long',
          type: 'conjunction',
        }).format(hostNames);

  const raised = formatCurrencyFromDecimal(
    fundraiser.totalRaised,
    fundraiser.currency
  );
  const goal = formatCurrencyFromDecimal(
    fundraiser.goalAmount,
    fundraiser.currency
  );

  const showEnded =
    fundraiser.status === 'completed' || fundraiser.status === 'cancelled';

  return (
    <li className='fundraiser-list-item group flex items-start gap-4 py-4'>
      <Link
        href={getFundraiserUrl(fundraiser)}
        className='shrink-0 h-20 w-20 overflow-hidden rounded-lg bg-muted transition-transform duration-300 group-hover:scale-110'
        aria-label={fundraiser.title}
      >
        <FundraiserCardImage
          imageUrl={imageUrl}
          alt={tFundraisers('coverImageAlt', { title: fundraiser.title })}
        />
      </Link>

      <div className='min-w-0 flex-1'>
        <h3 className='line-clamp-1 text-base font-semibold text-foreground'>
          <Link
            href={getFundraiserUrl(fundraiser)}
            className='hover:text-primary transition-colors'
          >
            {fundraiser.title}
          </Link>
        </h3>

        <p className='mt-0.5 truncate text-sm text-muted-foreground'>
          {t('byHost', { host: hostName })}
        </p>

        <div className='mt-2 flex flex-wrap items-center gap-x-7 gap-y-1 text-sm text-muted-foreground'>
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
          <span className='inline-flex items-center gap-1'>
            <Clock className='h-3.5 w-3.5' aria-hidden='true' />
            {showEnded ? t('ended') : t('daysLeft', { count: daysLeft })}
          </span>
        </div>
      </div>
    </li>
  );
}
