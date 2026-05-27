'use client';

import type { FundraiserHost } from '@/lib/types/fundraiser';
import type { SafeHtml } from '@/lib/types/safe-html';

import { useFormatter, useTranslations } from 'next-intl';

const MAX_NAMED_HOSTS = 3;

export function HostMessageCard({
  hosts,
  message,
}: {
  hosts: FundraiserHost[];
  message: SafeHtml;
}) {
  const t = useTranslations('Donate.thankYou');
  const tFundraisers = useTranslations('Fundraisers');
  const format = useFormatter();

  const publicHosts = hosts.filter(host => host.isPublic);
  const hostsToShow = publicHosts.length > 0 ? publicHosts : hosts;
  const names = hostsToShow.map(
    host => host.displayName ?? host.user?.name ?? tFundraisers('unknownHost')
  );

  const displayNames = names.slice(0, MAX_NAMED_HOSTS);
  const remaining = Math.max(0, names.length - displayNames.length);

  const signature =
    displayNames.length > 0
      ? t('hostMessageSignature', {
          names: format.list(displayNames, {
            type: remaining > 0 ? 'unit' : 'conjunction',
          }),
          remaining,
        })
      : null;

  return (
    <div className='overflow-hidden rounded-2xl border border-gray-100 bg-white'>
      <div className='px-6 py-5'>
        <h3 className='mb-2 text-sm font-semibold text-gray-900'>
          {t('hostMessageHeading', { count: names.length })}
        </h3>
        <div
          className='text-sm leading-relaxed text-gray-600 [&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_em]:italic [&_u]:underline [&_blockquote]:my-1.5 [&_blockquote]:border-l-2 [&_blockquote]:border-l-gray-200 [&_blockquote]:pl-3 [&_blockquote]:italic'
          dangerouslySetInnerHTML={{ __html: message as string }}
        />
        {signature && <p className='mt-3 text-sm text-gray-500'>{signature}</p>}
      </div>
    </div>
  );
}
