'use client';

import type { FundraiserInsights } from '@/lib/types/fundraiser-insights';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { getReferralCode } from '@/lib/share/referral';
import { formatCompactNumber } from '@/lib/utils';
import { countryCodeToFlag, getCountry } from '@/lib/utils/country';
import { useAuthStore } from '@/stores/auth-store';
import { CountryFlag } from '@/components/ui/country-flag';

/** Sources with a friendly name. Anything else shows as the domain or the raw utm_source value. */
const KNOWN_SOURCES = [
  'linkedin',
  'instagram',
  'facebook',
  'whatsapp',
  'x',
  'google',
  'bing',
  'email',
  'newsletter',
  'stage',
] as const;

type KnownSourceKey = (typeof KNOWN_SOURCES)[number];

function isKnownSource(source: string): source is KnownSourceKey {
  return (KNOWN_SOURCES as readonly string[]).includes(source);
}

// Instagram tags its own outbound links with utm_source=ig.
const UTM_ALIASES: Record<string, string> = { ig: 'instagram' };

function RankedList({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: Array<{ key: string; label: React.ReactNode; value: number }>;
  emptyLabel: string;
}) {
  const locale = useLocale();
  const max = Math.max(1, ...rows.map(row => row.value));

  return (
    <div className='min-w-0 space-y-2'>
      <h3 className='text-sm font-semibold text-foreground'>{title}</h3>
      {rows.length === 0 ? (
        <p className='text-sm text-muted-foreground'>{emptyLabel}</p>
      ) : (
        <ul className='m-0 flex list-none flex-col gap-1.5 p-0'>
          {rows.map(row => (
            <li key={row.key} className='relative overflow-hidden rounded-md'>
              <div
                className='absolute inset-y-0 left-0 rounded-md bg-accent-color/10'
                style={{ width: `${(row.value / max) * 100}%` }}
                aria-hidden='true'
              />
              <div className='relative flex items-center justify-between gap-3 px-2 py-1 text-sm'>
                <span className='flex min-w-0 items-center gap-2 truncate text-foreground'>
                  {row.label}
                </span>
                <span className='shrink-0 text-muted-foreground tabular-nums'>
                  {formatCompactNumber(row.value, locale)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function InsightsAudience({
  data,
  slug,
}: {
  data: FundraiserInsights;
  slug: string;
}) {
  const t = useTranslations('Dashboard.fundraiser.insights.audience');
  const locale = useLocale();
  const ownRef = getReferralCode(useAuthStore(state => state.user?.profile));

  const sourceLabel = (source: string) =>
    isKnownSource(source) ? t(`sources.${source}`) : source;

  const countryRows = data.countries.map(country => ({
    key: country.code,
    label: (
      <>
        <CountryFlag flag={countryCodeToFlag(country.code)} />
        <span className='truncate'>{getCountry(country.code, locale)}</span>
      </>
    ),
    value: country.visitors,
  }));

  const sourceRows = [
    ...data.sources.map(source => ({
      key: source.source,
      label: <span className='truncate'>{sourceLabel(source.source)}</span>,
      value: source.visitors,
    })),
    ...(data.directVisitors > 0
      ? [
          {
            key: '__direct',
            label: <span className='truncate'>{t('direct')}</span>,
            value: data.directVisitors,
          },
        ]
      : []),
  ].sort((a, b) => b.value - a.value);

  const taggedRows = data.taggedSources.map(tagged => {
    const source = UTM_ALIASES[tagged.source] ?? tagged.source;
    return {
      key: tagged.source,
      label: <span className='truncate'>{sourceLabel(source)}</span>,
      value: tagged.visitors,
    };
  });

  // Names for other people's codes need a lookup the platform does not offer yet, so they show as their code.
  const referralRows = (data.referrals ?? []).map(referral => ({
    key: referral.ref,
    label: (
      <span className='truncate'>
        {referral.ref === ownRef
          ? t('referralYou')
          : t('referralSupporter', { code: referral.ref })}
        {referral.donations > 0 && (
          <span className='text-muted-foreground'>
            {' · '}
            {t('referralDonations', { count: referral.donations })}
          </span>
        )}
      </span>
    ),
    value: referral.visits,
  }));

  return (
    <div className='space-y-5'>
      <div className='grid gap-6 sm:grid-cols-2'>
        <RankedList
          title={t('countries')}
          rows={countryRows}
          emptyLabel={t('noData')}
        />
        <RankedList
          title={t('sourcesTitle')}
          rows={sourceRows}
          emptyLabel={t('noData')}
        />
      </div>

      <p className='text-xs text-muted-foreground'>
        {t.rich('tagHint', {
          link: chunks => (
            <Link
              href={`/dashboard/fundraisers/${encodeURIComponent(slug)}/share`}
              className='font-medium text-accent-color hover:underline'
            >
              {chunks}
            </Link>
          ),
        })}
      </p>

      {taggedRows.length > 0 && (
        <RankedList
          title={t('taggedTitle')}
          rows={taggedRows}
          emptyLabel={t('noData')}
        />
      )}

      {referralRows.length > 0 && (
        <div className='space-y-2'>
          <RankedList
            title={t('referralsTitle')}
            rows={referralRows}
            emptyLabel={t('noData')}
          />
          <p className='text-xs text-muted-foreground'>{t('referralHint')}</p>
        </div>
      )}
    </div>
  );
}
