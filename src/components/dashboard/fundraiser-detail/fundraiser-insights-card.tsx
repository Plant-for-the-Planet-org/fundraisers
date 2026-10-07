'use client';

import type {
  FundraiserInsights,
  InsightsBucket,
  InsightsRange,
  InsightsSeries,
} from '@/lib/types/fundraiser-insights';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { formatBucket, formatPeriod } from '@/lib/analytics/insights-buckets';
import { funnelSteps } from '@/lib/analytics/insights-report';
import { INSIGHTS_RANGES } from '@/lib/types/fundraiser-insights';
import { formatCompactNumber } from '@/lib/utils';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowUpRightFromSquareIcon,
  CalendarIcon,
  CircleInfoIcon,
  ClockIcon,
} from '@/components/ui/ui-icons';
import { StatDelta } from '../stat-strip';
import { InsightsAudience } from './insights-audience';
import { InsightsFunnel } from './insights-funnel';
import { useFundraiserInsights } from './use-fundraiser-insights';

export const CHART_HEIGHT = 120;

/** The clock hour with the most visitors in a day bucket, or null when the day had none. */
function busiestHour(bucket: InsightsBucket, locale: string) {
  const hours = bucket.hourlyVisitors;
  if (!hours) return null;
  const peak = Math.max(...hours);
  if (peak === 0) return null;
  const hour = String(hours.indexOf(peak)).padStart(2, '0');
  return new Date(`${bucket.key}T${hour}:00`).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PeriodLabel({ data }: { data: InsightsSeries }) {
  const t = useTranslations('Dashboard.fundraiser.insights');
  const locale = useLocale();

  const period = formatPeriod(data, locale, start =>
    t('periodUntilToday', { start })
  );
  if (period === null) return null;

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
  // 7d days carry their hours: the day bar turns light and its hours are drawn inside it, sized against the busiest hour of the week and fitted to the day bar. They show the shape of each day; the tooltip gives the numbers.
  const hasHours = data.buckets.some(bucket => bucket.hourlyVisitors);
  const maxHour = Math.max(
    1,
    ...data.buckets.flatMap(bucket => bucket.hourlyVisitors ?? [])
  );
  const first = data.buckets[0];
  const last = data.buckets[data.buckets.length - 1];
  const active = hovered === null ? null : data.buckets[hovered];
  const activeBusiestHour = active && busiestHour(active, locale);

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
            {activeBusiestHour && (
              <p className='text-muted-foreground'>
                {t('busiestHour', { time: activeBusiestHour })}
              </p>
            )}
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
                  'relative w-full rounded-t transition-opacity',
                  hasHours
                    ? 'max-w-16 bg-accent-color/20'
                    : 'max-w-6 bg-accent-color',
                  hovered !== null && hovered !== index && 'opacity-50'
                )}
                style={{
                  height:
                    bucket.visitors === 0
                      ? 0
                      : Math.max(2, (bucket.visitors / max) * CHART_HEIGHT),
                }}
              >
                {bucket.hourlyVisitors && (
                  <div
                    className='absolute inset-0 flex items-end sm:gap-px'
                    aria-hidden='true'
                  >
                    {bucket.hourlyVisitors.map((hourVisitors, hour) => (
                      <div
                        key={hour}
                        className='min-w-0 flex-1 bg-accent-color'
                        style={{ height: `${(hourVisitors / maxHour) * 90}%` }}
                      />
                    ))}
                  </div>
                )}
              </div>
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
  return (
    <div className='space-y-3'>
      <h3 className='text-sm font-semibold text-foreground'>{t('title')}</h3>
      <InsightsFunnel
        steps={funnelSteps(data.visitors, data.eventVisitors)}
        variant='screen'
      />
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

  // The last numbers that loaded stay on screen, dimmed, while a new range loads. The card keeps its height instead of collapsing to a skeleton and growing back.
  const [lastData, setLastData] = useState<FundraiserInsights | null>(null);
  if (state.status === 'ready' && state.data !== lastData) {
    setLastData(state.data);
  }
  const data =
    state.status === 'ready'
      ? state.data
      : state.status === 'loading'
        ? lastData
        : null;
  const refreshing = state.status === 'loading' && data !== null;

  // The body never gets shorter than the tallest it has been, so switching between a busy range and an empty one does not make the card jump. It only grows the first time a taller range shows.
  const bodyRef = useRef<HTMLDivElement>(null);
  const [minBodyHeight, setMinBodyHeight] = useState(0);
  const hasBody = data !== null;
  useEffect(() => {
    const node = bodyRef.current;
    if (!node) return;
    const observer = new ResizeObserver(() => {
      setMinBodyHeight(previous => Math.max(previous, node.offsetHeight));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasBody]);

  return (
    <Card className='gap-5 border-border/60 px-6 py-5 shadow-xs'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        {/* A fixed minimum width, so whether the tabs wrap below does not depend on the date label, which is narrower as a skeleton than as text. */}
        <div className='min-w-[17rem]'>
          <h2 className='text-lg font-semibold text-foreground'>
            {t('title')}
          </h2>
          {/* A block, not a paragraph, because the skeleton is a div. The skeleton is as tall as the label, so the header keeps its height while a range loads. */}
          <div className='min-h-5 text-sm text-muted-foreground'>
            {state.status === 'ready' ? (
              <PeriodLabel data={state.data} />
            ) : state.status === 'loading' ? (
              <Skeleton className='my-[3px] h-3.5 w-48' />
            ) : null}
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
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
          {/* Opens the print page for the range on screen, in its own tab. It loads its own data, so the button does not wait for this card and never shifts the header. */}
          <Button asChild variant='outline' size='sm'>
            <Link
              href={`/dashboard/fundraisers/${encodeURIComponent(slug)}/insights/print?range=${range}`}
              target='_blank'
              rel='noopener'
            >
              {t('downloadPdf')}
              <ArrowUpRightFromSquareIcon />
            </Link>
          </Button>
        </div>
      </div>

      <div style={{ minHeight: minBodyHeight || undefined }}>
        {state.status === 'error' ? (
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
        ) : data === null ? (
          <div className='space-y-3'>
            <Skeleton className='h-10 w-48' />
            <Skeleton className='w-full' style={{ height: CHART_HEIGHT }} />
          </div>
        ) : (
          <div
            ref={bodyRef}
            aria-busy={refreshing}
            className={cn(
              'flex flex-col gap-5 transition-opacity',
              refreshing && 'opacity-50'
            )}
          >
            <SeriesTotals data={data} />

            {data.visitors === 0 ? (
              <p className='py-6 text-center text-sm text-muted-foreground'>
                {t('empty')}
              </p>
            ) : (
              <VisitorsChart data={data} />
            )}

            <DonationJourney data={data} />

            <InsightsAudience data={data} slug={slug} />
          </div>
        )}
      </div>
    </Card>
  );
}
