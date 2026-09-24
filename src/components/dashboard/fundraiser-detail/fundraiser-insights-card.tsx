'use client';

import type {
  FundraiserInsights,
  InsightsBucket,
  InsightsRange,
  InsightsSeries,
  InsightsUnit,
} from '@/lib/types/fundraiser-insights';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { INSIGHTS_RANGES } from '@/lib/types/fundraiser-insights';
import { formatCompactNumber } from '@/lib/utils';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CalendarIcon,
  CircleInfoIcon,
  ClockIcon,
} from '@/components/ui/ui-icons';
import { StatDelta } from '../stat-strip';
import { InsightsAudience } from './insights-audience';
import { useFundraiserInsights } from './use-fundraiser-insights';

export const CHART_HEIGHT = 120;

function bucketDate(bucket: InsightsBucket, unit: InsightsUnit) {
  // Keys are local wall-clock text, so read them back as a local time rather than as UTC.
  if (unit === 'month') return new Date(`${bucket.key}-15T12:00`);
  return new Date(unit === 'day' ? `${bucket.key}T12:00` : `${bucket.key}:00`);
}

function formatBucket(
  bucket: InsightsBucket,
  unit: InsightsUnit,
  locale: string
) {
  const date = bucketDate(bucket, unit);
  if (unit === 'month') {
    return date.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
  }
  return unit === 'day'
    ? date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
    : date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

export function PeriodLabel({ data }: { data: InsightsSeries }) {
  const t = useTranslations('Dashboard.fundraiser.insights');
  const locale = useLocale();

  // A response cached from before these fields existed has no dates. Skip the label rather than crash.
  if (!Number.isFinite(data.startAt) || !Number.isFinite(data.endAt)) {
    return null;
  }

  // Hours matter for the last 24 hours; everywhere else the day is enough.
  const format = new Intl.DateTimeFormat(
    locale,
    data.range === '24h'
      ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
      : { day: 'numeric', month: 'short', year: 'numeric' }
  );

  // A running campaign ends "today" rather than on a date that just means now.
  const period =
    data.range === 'campaign' && data.endsNow
      ? t('periodUntilToday', { start: format.format(data.startAt) })
      : format.formatRange(data.startAt, data.endAt);

  const updated = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(data.endAt);

  return (
    <span className='inline-flex flex-wrap items-center gap-x-1.5 gap-y-1'>
      <CalendarIcon className='size-3.5 shrink-0' />
      <span>{period}</span>
      {/* When a live window was taken, so the snapshot is not mistaken for realtime. The 24-hour range already ends on that time, so it would only repeat it. */}
      {data.endsNow && data.range !== '24h' && (
        <>
          <span aria-hidden='true'>·</span>
          <span
            className='inline-flex items-center gap-1.5'
            title={t('updatedLabel')}
          >
            <ClockIcon className='size-3.5 shrink-0' />
            <span className='sr-only'>{t('updatedLabel')}</span>
            {updated}
          </span>
        </>
      )}
    </span>
  );
}

export function VisitorsChart({ data }: { data: InsightsSeries }) {
  const t = useTranslations('Dashboard.fundraiser.insights');
  const locale = useLocale();
  const [hovered, setHovered] = useState<number | null>(null);

  const max = Math.max(1, ...data.buckets.map(bucket => bucket.visitors));
  const first = data.buckets[0];
  const last = data.buckets[data.buckets.length - 1];
  const active = hovered === null ? null : data.buckets[hovered];

  return (
    <div className='space-y-2'>
      <div className='relative' onPointerLeave={() => setHovered(null)}>
        {active && hovered !== null && (
          <div
            className='pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow-sm'
            style={{
              left: `${((hovered + 0.5) / data.buckets.length) * 100}%`,
            }}
          >
            <p className='font-medium'>
              {formatBucket(active, data.unit, locale)}
            </p>
            <p className='text-muted-foreground'>
              {t('tooltip', {
                visitors: active.visitors,
                views: active.views,
              })}
            </p>
          </div>
        )}

        <div
          className='flex items-end gap-0.5 border-b border-border'
          style={{ height: CHART_HEIGHT }}
          role='img'
          aria-label={t('chartLabel')}
        >
          {data.buckets.map((bucket, index) => (
            <div
              key={bucket.key}
              className='flex h-full min-w-0 flex-1 items-end justify-center'
              onPointerEnter={() => setHovered(index)}
            >
              <div
                className={cn(
                  'w-full max-w-6 rounded-t bg-accent-color transition-opacity',
                  hovered !== null && hovered !== index && 'opacity-50'
                )}
                style={{
                  height:
                    bucket.visitors === 0
                      ? 0
                      : Math.max(2, (bucket.visitors / max) * CHART_HEIGHT),
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {first && last && (
        <div className='flex justify-between text-xs text-muted-foreground'>
          <span>{formatBucket(first, data.unit, locale)}</span>
          <span>{formatBucket(last, data.unit, locale)}</span>
        </div>
      )}

      {/* The same numbers as a table, for screen readers. */}
      <table className='sr-only'>
        <caption>{t('chartLabel')}</caption>
        <thead>
          <tr>
            <th>{t('time')}</th>
            <th>{t('visitors')}</th>
            <th>{t('views')}</th>
          </tr>
        </thead>
        <tbody>
          {data.buckets.map(bucket => (
            <tr key={bucket.key}>
              <td>{formatBucket(bucket, data.unit, locale)}</td>
              <td>{bucket.visitors}</td>
              <td>{bucket.views}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Shown once under the Insights pages, so hosts read the numbers as a guide and do not expect them to match donation totals. */
export function InsightsAccuracyNote() {
  const t = useTranslations('Dashboard.fundraiser.insights');
  return (
    <p className='flex items-start gap-2 text-xs text-muted-foreground'>
      <CircleInfoIcon className='mt-px size-3.5 shrink-0' />
      <span>{t('accuracyNote')}</span>
    </p>
  );
}

/** Visitors and page views for the window, each with its change against the window before. */
export function SeriesTotals({ data }: { data: InsightsSeries }) {
  const t = useTranslations('Dashboard.fundraiser.insights');
  const locale = useLocale();
  return (
    <div className='flex gap-8'>
      <div>
        <p className='text-xs text-muted-foreground'>{t('visitors')}</p>
        <p className='flex items-baseline gap-2'>
          <span className='text-2xl font-semibold text-foreground tabular-nums'>
            {formatCompactNumber(data.visitors, locale)}
          </span>
          <StatDelta
            current={data.visitors}
            previous={data.previousVisitors}
            context={t('changeContext')}
          />
        </p>
      </div>
      <div>
        <p className='text-xs text-muted-foreground'>{t('views')}</p>
        <p className='flex items-baseline gap-2'>
          <span className='text-2xl font-semibold text-foreground tabular-nums'>
            {formatCompactNumber(data.views, locale)}
          </span>
          <StatDelta
            current={data.views}
            previous={data.previousViews}
            context={t('changeContext')}
          />
        </p>
      </div>
    </div>
  );
}

function DonationJourney({ data }: { data: FundraiserInsights }) {
  const t = useTranslations('Dashboard.fundraiser.insights.journey');
  const locale = useLocale();
  const { events, visitors } = data;

  const steps = [
    { key: 'donate_clicked', value: events.donate_clicked },
    { key: 'donation_submitted', value: events.donation_submitted },
    { key: 'donation_completed', value: events.donation_completed },
  ] as const;
  const clickRate =
    visitors > 0 ? Math.round((events.donate_clicked / visitors) * 100) : null;

  return (
    <div className='space-y-3'>
      <div className='flex items-baseline justify-between gap-4'>
        <h3 className='text-sm font-semibold text-foreground'>{t('title')}</h3>
        {clickRate !== null && (
          <span className='text-xs text-muted-foreground'>
            {t('clickRate', { percent: clickRate })}
          </span>
        )}
      </div>
      <dl className='grid grid-cols-3 gap-2'>
        {steps.map(step => (
          <div key={step.key} className='rounded-lg bg-muted/60 px-3 py-2'>
            <dt className='text-xs text-muted-foreground'>{t(step.key)}</dt>
            <dd className='text-lg font-semibold text-foreground tabular-nums'>
              {formatCompactNumber(step.value, locale)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function FundraiserInsightsCard({
  slug,
  campaignStarted,
}: {
  slug: string;
  /** The campaign range only makes sense once the fundraiser has started. */
  campaignStarted: boolean;
}) {
  const t = useTranslations('Dashboard.fundraiser.insights');
  const [range, setRange] = useState<InsightsRange>('7d');
  const [attempt, setAttempt] = useState(0);
  const state = useFundraiserInsights(slug, range, attempt);

  return (
    <Card className='gap-5 border-border/60 px-6 py-5 shadow-xs'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h2 className='text-lg font-semibold text-foreground'>
            {t('title')}
          </h2>
          <p className='min-h-5 text-sm text-muted-foreground'>
            {state.status === 'ready' && <PeriodLabel data={state.data} />}
          </p>
        </div>
        <Tabs
          value={range}
          onValueChange={value => setRange(value as InsightsRange)}
        >
          <TabsList>
            {INSIGHTS_RANGES.filter(
              option => option !== 'campaign' || campaignStarted
            ).map(option => (
              <TabsTrigger key={option} value={option}>
                {t(`ranges.${option}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {state.status === 'loading' ? (
        <div className='space-y-3'>
          <Skeleton className='h-10 w-48' />
          <Skeleton className='w-full' style={{ height: CHART_HEIGHT }} />
        </div>
      ) : state.status === 'error' ? (
        <div className='flex flex-col items-center gap-3 py-8 text-center'>
          <p className='text-sm text-muted-foreground'>{t('loadError')}</p>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setAttempt(count => count + 1)}
          >
            {t('retry')}
          </Button>
        </div>
      ) : (
        <>
          <SeriesTotals data={state.data} />

          {state.data.visitors === 0 ? (
            <p className='py-6 text-center text-sm text-muted-foreground'>
              {t('empty')}
            </p>
          ) : (
            <VisitorsChart data={state.data} />
          )}

          <DonationJourney data={state.data} />

          <InsightsAudience data={state.data} slug={slug} />
        </>
      )}
    </Card>
  );
}
