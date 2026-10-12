import { useLocale, useTranslations } from 'next-intl';
import { UsersRound } from 'lucide-react';
import { formatCompactNumber } from '@/lib/utils';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { FundraiserCardImage } from '@/components/explore/fundraiser-card-image';

interface AboutExampleCardProps {
  title: string;
  host: string;
  image: string;
  /** Sample numbers. Leave out for real campaigns, so nothing invented is attributed to a real organisation. */
  raised?: number;
  donations?: number;
  currency?: string;
}

// Mirrors the Explore FundraiserCard markup and strings (80px photo, title, raised and donation count, host), with sample numbers instead of API data.
export function AboutExampleCard({
  title,
  host,
  image,
  raised,
  donations,
  currency = 'EUR',
}: AboutExampleCardProps) {
  const t = useTranslations('Fundraisers');
  const locale = useLocale();

  return (
    <article className='fundraiser-card group rounded-lg transition-colors hover:bg-accent/50'>
      <div className='flex items-start space-x-4'>
        <div className='h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted transition-transform duration-300 group-hover:scale-110'>
          <FundraiserCardImage imageUrl={image} alt='' />
        </div>

        <div className='min-w-0 flex-1'>
          <h3 className='mb-1 line-clamp-2 font-medium text-foreground'>
            {title}
          </h3>
          <dl className='space-y-1'>
            {raised !== undefined && donations !== undefined && (
              <div className='flex items-center gap-3 text-sm text-muted-foreground'>
                <div className='flex items-center gap-1'>
                  <dt className='sr-only'>{t('amountRaisedLabel')}</dt>
                  <dd>
                    {t('amountRaised', {
                      formattedAmountWithCurrency: formatCurrencyFromDecimal(
                        raised,
                        currency,
                        locale,
                        { compact: true }
                      ),
                    })}
                  </dd>
                </div>
                <div className='flex items-center gap-1'>
                  <UsersRound className='h-3 w-3' aria-hidden='true' />
                  <dt className='sr-only'>{t('donationCountLabel')}</dt>
                  <dd>
                    {t('donationCount', {
                      count: donations,
                      formattedCount: formatCompactNumber(donations, locale),
                    })}
                  </dd>
                </div>
              </div>
            )}
            <div className='text-sm text-muted-foreground'>
              <dt className='sr-only'>{t('hostedByLabel')}</dt>
              <dd>{t('hostedBy', { hostName: host })}</dd>
            </div>
          </dl>
        </div>
      </div>
    </article>
  );
}
