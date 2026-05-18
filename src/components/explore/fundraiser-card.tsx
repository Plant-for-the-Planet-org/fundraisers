import type { Fundraiser } from '@/lib/types/fundraiser';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { UsersRound } from 'lucide-react';
import { getLocalizedAbbreviatedCount } from '@/lib/utils';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { getFundraiserUrl } from '@/lib/utils/fundraiser';
import { getImageUrl } from '@/lib/utils/images';
import { FundraiserCardImage } from './fundraiser-card-image';

interface FundraiserCardProps {
  fundraiser: Fundraiser;
}

export function FundraiserCard({ fundraiser }: FundraiserCardProps) {
  const tFundraisers = useTranslations('Fundraisers');
  const locale = useLocale();

  const imageUrl = getImageUrl('fundraiser', 'thumb', fundraiser.image);

  const hostDisplay = (() => {
    const hosts = fundraiser.hosts;
    if (hosts.length === 0) return tFundraisers('anonymousHost');

    const firstHost = hosts[0];
    // Although we expect user to be always present, keeping a fallback to avoid runtime errors in case of unexpected data
    const hostName =
      firstHost.displayName ??
      firstHost.user?.name ??
      tFundraisers('unknownHost');

    if (hosts.length === 1) {
      return tFundraisers('hostedBy', { hostName });
    }

    return tFundraisers('hostedByWithOthers', {
      hostName,
      othersCount: hosts.length - 1,
    });
  })();

  return (
    <article className='fundraiser-card'>
      <Link
        href={getFundraiserUrl(fundraiser)}
        className='group block hover:bg-accent/50 rounded-lg transition-colors'
        aria-label={fundraiser.title}
      >
        <div className='flex items-start space-x-4'>
          <div className='fundraiser-image w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0 transition-transform duration-300 group-hover:scale-110'>
            <FundraiserCardImage
              imageUrl={imageUrl}
              alt={tFundraisers('coverImageAlt', { title: fundraiser.title })}
            />
          </div>

          <div className='fundraiser-content flex-1 min-w-0'>
            <h3 className='fundraiser-title font-medium text-foreground group-hover:text-primary transition-colors mb-1 line-clamp-2'>
              {fundraiser.title}
            </h3>

            <div className='space-y-1'>
              <div className='fundraiser-stats text-sm text-muted-foreground flex items-center gap-3'>
                <div className='amount-raised flex items-center gap-1'>
                  <dt className='sr-only'>
                    {tFundraisers('amountRaisedLabel')}
                  </dt>
                  <dd>
                    {tFundraisers('amountRaised', {
                      formattedAmountWithCurrency: formatCurrencyFromDecimal(
                        fundraiser.totalRaised,
                        fundraiser.currency
                      ),
                    })}
                  </dd>
                </div>
                <div className='donation-count flex items-center gap-1'>
                  <UsersRound className='w-3 h-3' />
                  <dt className='sr-only'>
                    {tFundraisers('donationCountLabel')}
                  </dt>
                  <dd>
                    {tFundraisers('donationCount', {
                      count: fundraiser.donationCount,
                      formattedCount: getLocalizedAbbreviatedCount(
                        fundraiser.donationCount,
                        locale
                      ),
                    })}
                  </dd>
                </div>
              </div>

              <div className='fundraiser-hosts text-sm text-muted-foreground'>
                <dt className='sr-only'>{tFundraisers('hostedByLabel')}</dt>
                <dd>{hostDisplay}</dd>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
