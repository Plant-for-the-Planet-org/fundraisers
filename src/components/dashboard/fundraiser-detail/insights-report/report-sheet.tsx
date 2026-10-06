'use client';

import type { CSSProperties, ReactNode } from 'react';
import type { FunnelStep, HostsLine } from '@/lib/analytics/insights-report';
import type { FundraiserInsights } from '@/lib/types/fundraiser-insights';

import { useLocale, useTranslations } from 'next-intl';
import { formatPeriod } from '@/lib/analytics/insights-buckets';
import {
  funnelSteps,
  goalProgress,
  otherCountryVisitors,
  rankedSources,
  splitTop,
  sumVisitors,
} from '@/lib/analytics/insights-report';
import { formatCompactNumber } from '@/lib/utils';
import { getCountry } from '@/lib/utils/country';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { Logo } from '@/components/header/logo';
import { LinkIcon } from '@/components/ui/ui-icons';
import { isKnownSource } from '../insights-audience';
import { InsightsFunnel } from '../insights-funnel';
import { ReportChart } from './report-chart';
import { ReportQr } from './report-qr';

interface RankedRow {
  key: string;
  label: string;
  visitors: number;
}

interface ReportSheetProps {
  title: string;
  hosts: HostsLine;
  data: FundraiserInsights;
  raised: number;
  goal: number;
  currency: string | null;
  donations: number;
  /** Null while unknown, shown as a dash. */
  donors: number | null;
  /** The fundraiser accent for bars, and a darker version of it that reads as text on white. */
  accent: string;
  ink: string;
  /** CSS font stacks from the fundraiser theme. */
  bodyFont: string;
  titleFont: string;
  generatedAt: number;
  /** The tagged link the QR code opens. */
  link: string;
}

function Delta({
  current,
  previous,
  context,
}: {
  current: number;
  previous: number;
  context: string;
}) {
  const locale = useLocale();
  // No earlier figure to compare with, so there is no change to show.
  if (previous === 0) return null;
  const rounded = Math.round(((current - previous) / previous) * 100);
  return (
    <span
      title={context}
      className={
        rounded > 0
          ? 'text-[13px] font-bold text-green-800'
          : rounded < 0
            ? 'text-[13px] font-bold text-red-800'
            : 'text-[13px] font-bold text-neutral-600'
      }
    >
      {new Intl.NumberFormat(locale, {
        style: 'percent',
        signDisplay: 'exceptZero',
      }).format(rounded / 100)}
      <span className='sr-only'> {context}</span>
    </span>
  );
}

function Tile({
  label,
  value,
  delta,
  helper,
  emphasized,
}: {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  helper?: ReactNode;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`rounded-[10px] border border-neutral-300 px-3.5 py-3 ${emphasized ? 'bg-neutral-100' : ''}`}
    >
      <p className='text-[13px] leading-[18px] font-semibold text-neutral-600'>
        {label}
      </p>
      <p className='flex flex-wrap items-baseline gap-x-1.5'>
        <span className='font-[family-name:var(--report-title-font)] text-[30px] leading-9 font-bold tabular-nums'>
          {value}
        </span>
        {delta}
      </p>
      {helper}
    </div>
  );
}

function TileHelper({ children }: { children: ReactNode }) {
  return (
    <p className='text-[13px] leading-[18px] text-neutral-600'>{children}</p>
  );
}

function RankedList({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: RankedRow[];
  emptyLabel: string;
}) {
  const locale = useLocale();
  const top = Math.max(1, ...rows.map(row => row.visitors));
  return (
    <div className='flex min-w-0 flex-col gap-2.5'>
      <h2 className='font-[family-name:var(--report-title-font)] text-[17px] leading-6 font-semibold'>
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className='text-sm text-neutral-600'>{emptyLabel}</p>
      ) : (
        <ul className='m-0 flex list-none flex-col gap-2.5 p-0'>
          {rows.map(row => (
            <li
              key={row.key}
              className='relative overflow-hidden rounded-md bg-neutral-100'
            >
              <div
                className='absolute inset-y-0 left-0 bg-[color-mix(in_srgb,var(--report-accent)_22%,white)]'
                style={{
                  width: `${Math.min(100, (row.visitors / top) * 100)}%`,
                }}
                aria-hidden='true'
              />
              <div className='relative flex items-center justify-between gap-3 px-2.5 py-[5px] text-sm'>
                <span className='truncate font-semibold'>{row.label}</span>
                <span className='shrink-0 font-bold tabular-nums'>
                  {formatCompactNumber(row.visitors, locale)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Funnel({ steps }: { steps: FunnelStep[] }) {
  const t = useTranslations('Dashboard.fundraiser.insights');
  return (
    <div className='flex flex-col gap-3'>
      <h2 className='font-[family-name:var(--report-title-font)] text-[17px] leading-6 font-semibold'>
        {t('journey.title')}
      </h2>
      <InsightsFunnel steps={steps} variant='print' />
    </div>
  );
}

/**
 * One A4 page of a fundraiser's insights, for print. Everything is passed in, so the page is a plain picture of the data.
 * Sized in millimetres to the sheet; the page is designed to fit, so content that would not fit is cut rather than spilling onto a second page.
 */
export function ReportSheet({
  title,
  hosts,
  data,
  raised,
  goal,
  currency,
  donations,
  donors,
  accent,
  ink,
  bodyFont,
  titleFont,
  generatedAt,
  link,
}: ReportSheetProps) {
  const t = useTranslations('Dashboard.fundraiser.insights');
  const tReport = useTranslations('Dashboard.fundraiser.insights.report');
  const tStats = useTranslations('Dashboard.fundraiser.stats');
  const tAudience = useTranslations('Dashboard.fundraiser.insights.audience');
  const locale = useLocale();

  const money = (amount: number) =>
    formatCurrencyFromDecimal(amount, currency, locale);
  const progress = goalProgress(raised, goal);

  const sourceLabel = (source: string) =>
    isKnownSource(source) ? tAudience(`sources.${source}`) : source;

  const countryRows: RankedRow[] = data.countries.map(country => ({
    key: country.code,
    label: getCountry(country.code, locale),
    visitors: country.visitors,
  }));
  const sourceRows: RankedRow[] = rankedSources(data).map(row => ({
    key: row.key,
    label: row.source === null ? tAudience('direct') : sourceLabel(row.source),
    visitors: row.visitors,
  }));

  const countries = splitTop(countryRows);
  const sources = splitTop(sourceRows);
  const otherCountries = otherCountryVisitors(data.visitors, countries.shown);
  const otherSources = sumVisitors(sources.hidden);
  const shownCountries = [
    ...countries.shown,
    ...(countries.shown.length > 0 && otherCountries > 0
      ? [
          {
            key: '__other',
            label: tReport('otherCountries'),
            visitors: otherCountries,
          },
        ]
      : []),
  ];
  const shownSources = [
    ...sources.shown,
    ...(otherSources > 0
      ? [
          {
            key: '__other',
            label: tReport('otherSources'),
            visitors: otherSources,
          },
        ]
      : []),
  ];

  const listFormat = new Intl.ListFormat(locale, {
    style: 'long',
    type: 'conjunction',
  });
  const byLine =
    hosts.names.length === 0
      ? null
      : hosts.others > 0
        ? tReport('byOthers', {
            names: hosts.names.join(', '),
            count: hosts.others,
          })
        : tReport('by', { names: listFormat.format(hosts.names) });

  const generated = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(generatedAt);

  const linkUrl = new URL(link);
  const shownLink = `${linkUrl.host}${linkUrl.pathname}`;

  return (
    <article
      data-report-sheet
      style={
        {
          '--report-accent': accent,
          // The logo reads this for "PLANTING", so it gets the readable version.
          '--accent-color': ink,
          '--report-title-font': titleFont,
          fontFamily: bodyFont,
        } as CSSProperties
      }
      className='relative mx-auto flex h-[297mm] w-[210mm] flex-col gap-4 overflow-hidden bg-white px-12 py-10 text-neutral-900 shadow-lg print:h-[296mm] print:shadow-none'
    >
      <header className='flex items-center justify-between border-b border-neutral-300 pb-3.5'>
        <div inert>
          <Logo />
        </div>
        <div className='flex flex-col items-end gap-0.5 text-right'>
          <p className='text-[13px] font-bold tracking-[0.08em] text-neutral-600 uppercase'>
            {tReport('label')}
          </p>
          <p className='text-[13px] whitespace-nowrap text-neutral-600'>
            <span className='font-bold text-neutral-900'>
              {formatPeriod(data, locale, start =>
                t('periodUntilToday', { start })
              )}
            </span>
            {' · '}
            {tReport('generatedOn', { date: generated })}
          </p>
        </div>
      </header>

      <div className='flex flex-col gap-2.5'>
        <h1 className='line-clamp-2 font-[family-name:var(--report-title-font)] text-[30px] leading-[1.15] font-bold text-balance'>
          {title}
        </h1>
        {byLine && <p className='text-sm text-neutral-700'>{byLine}</p>}
      </div>

      <div className='grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-1.5'>
        <p className='col-span-2 text-xs font-bold tracking-[0.08em] text-neutral-600 uppercase'>
          {tReport('campaignTotal')}
        </p>
        <p className='col-span-2 text-xs font-bold tracking-[0.08em] text-neutral-600 uppercase'>
          {tReport(`rangeShort.${data.range}`)}
        </p>
        <Tile
          label={tReport('raised')}
          value={money(raised)}
          emphasized
          helper={
            progress && (
              <>
                <div className='mt-1.5 mb-1 h-2 overflow-hidden rounded-full bg-neutral-300'>
                  <div
                    className='h-full rounded-full bg-[var(--report-accent)]'
                    style={{ width: `${progress.bar}%` }}
                  />
                </div>
                <TileHelper>
                  {tStats('raisedHelper', {
                    percent: progress.percent,
                    goal: money(goal),
                  })}
                </TileHelper>
              </>
            )
          }
        />
        <Tile
          label={tStats('donors')}
          value={donors === null ? '–' : formatCompactNumber(donors, locale)}
          emphasized
          helper={
            <TileHelper>
              {tReport('donationCount', { count: donations })}
            </TileHelper>
          }
        />
        <Tile
          label={t('visitors')}
          value={formatCompactNumber(data.visitors, locale)}
          delta={
            <Delta
              current={data.visitors}
              previous={data.previousVisitors}
              context={t('changeContext')}
            />
          }
        />
        <Tile
          label={t('views')}
          value={formatCompactNumber(data.views, locale)}
          delta={
            <Delta
              current={data.views}
              previous={data.previousViews}
              context={t('changeContext')}
            />
          }
        />
      </div>

      <ReportChart data={data} />

      <Funnel steps={funnelSteps(data.visitors, data.eventVisitors)} />

      <div className='grid grid-cols-2 gap-8'>
        <RankedList
          title={tAudience('countries')}
          rows={shownCountries}
          emptyLabel={tAudience('noData')}
        />
        <RankedList
          title={tAudience('sourcesTitle')}
          rows={shownSources}
          emptyLabel={tAudience('noData')}
        />
      </div>

      <div className='flex-1' />

      <footer className='flex items-center gap-4 border-t border-neutral-300 pt-3.5'>
        <div className='flex min-w-0 flex-1 flex-col gap-2'>
          <p className='text-xs leading-[1.45] text-neutral-600'>
            {tReport('accuracyNote')}
          </p>
          <p className='flex items-center gap-1.5 text-xs font-bold text-neutral-700'>
            <LinkIcon className='size-3.5 shrink-0' />
            <span className='truncate'>{shownLink}</span>
          </p>
        </div>
        <div className='shrink-0 overflow-hidden rounded-md border border-neutral-300 bg-white'>
          <ReportQr value={link} label={tReport('qrLabel')} />
        </div>
      </footer>
    </article>
  );
}
