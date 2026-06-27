'use client';

import type { FundraiserHost } from '@/lib/types/fundraiser';
import type { SafeHtml } from '@/lib/types/safe-html';

import { useFormatter, useTranslations } from 'next-intl';
import { RichTextContent } from '@/components/ui/rich-text-content';

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

  // TODO: Once the API surfaces anonymity preferences more granularly,
  // consider showing initials or a customisable anonymous label per host.
  const isAnonymous = publicHosts.length === 0;
  const names: string[] = isAnonymous
    ? [tFundraisers('anonymousHost', { count: hosts.length })]
    : publicHosts.map(
        host =>
          host.displayName ?? host.user?.name ?? tFundraisers('unknownHost')
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
          {t('hostMessageHeading', { count: hosts.length })}
        </h3>
        <RichTextContent
          html={message}
          className='rich-quote text-sm leading-relaxed text-gray-600 [&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_em]:italic [&_u]:underline [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_blockquote]:text-gray-600'
        />
        {signature && <p className='mt-3 text-sm text-gray-500'>{signature}</p>}
      </div>
    </div>
  );
}
