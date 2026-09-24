'use client';

import type {
  AccountInsights,
  AccountInsightsFundraiser,
  InsightsRange,
} from '@/lib/types/fundraiser-insights';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { formatCompactNumber } from '@/lib/utils';
import { cn } from '@/lib/utils/cn';
import { isLiveStatus } from '@/lib/utils/fundraiser-list';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardHeader } from './dashboard-header';
import {
  CHART_HEIGHT,
  FundraiserInsightsCard,
  InsightsAccuracyNote,
  PeriodLabel,
  SeriesTotals,
  VisitorsChart,
} from './fundraiser-detail/fundraiser-insights-card';
import { useAccountInsights } from './use-account-insights';

type AccountRange = Exclude<InsightsRange, 'campaign'>;

const ACCOUNT_RANGES: readonly AccountRange[] = ['24h', '7d', '30d'];

/** The picker value for the combined view. Slugs never contain a colon, so it cannot clash with one. */
const ALL = ':all';

/** Marks a fundraiser that is live right now. Explained once in the table header rather than on every row. */
function LiveDot({ className }: { className?: string }) {
  const t = useTranslations('Dashboard.insights');
  return (
    // A dot in a soft ring, the same colours as the status badge.
    <span
      role='img'
      aria-label={t('liveLegend')}
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-success/15 p-1',
        className
      )}
    >
      <span className='size-1.5 rounded-full bg-success' />
    </span>
  );
}

function Ranking({
  fundraisers,
  onSelect,
}: {
  fundraisers: AccountInsightsFundraiser[];
  onSelect: (slug: string) => void;
}) {
  const t = useTranslations('Dashboard.insights');
  const locale = useLocale();
  const percent = new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 0,
  });

  return (
    <Card className='gap-3 border-border/60 py-5 shadow-xs'>
      <div className='flex items-center justify-between gap-4 px-6'>
        <h2 className='text-lg font-semibold text-foreground'>
          {t('rankingTitle')}
        </h2>
        <span className='flex items-center gap-2 text-xs text-muted-foreground'>
          <LiveDot />
          {t('liveLegend')}
        </span>
      </div>
      {fundraisers.length === 0 ? (
        <p className='px-6 text-sm text-muted-foreground'>
          {t('rankingEmpty')}
        </p>
      ) : (
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b border-border text-xs text-muted-foreground'>
              <th className='px-6 py-2 text-left font-medium'>
                {t('columns.fundraiser')}
              </th>
              <th className='w-0 px-3 py-2 text-right font-medium whitespace-nowrap'>
                {t('columns.views')}
              </th>
              <th className='hidden w-0 px-3 py-2 text-right font-medium whitespace-nowrap sm:table-cell'>
                {t('columns.clicks')}
              </th>
              <th className='hidden w-0 px-3 py-2 text-right font-medium whitespace-nowrap sm:table-cell'>
                {t('columns.submissions')}
              </th>
              <th className='w-0 px-3 py-2 text-right font-medium whitespace-nowrap'>
                {t('columns.rate')}
              </th>
              <th className='w-0 px-6 py-2 text-right font-medium whitespace-nowrap'>
                {t('columns.conversion')}
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-border'>
            {fundraisers.map(fundraiser => (
              <tr key={fundraiser.slug} className='hover:bg-muted/40'>
                <td className='px-6 py-3'>
                  {/* Opens this fundraiser in the picker above, rather than leaving the page. */}
                  <button
                    type='button'
                    onClick={() => onSelect(fundraiser.slug)}
                    className='text-left'
                  >
                    <span className='font-medium break-words text-foreground hover:underline'>
                      {fundraiser.title}
                    </span>
                    {isLiveStatus(fundraiser.status) && (
                      // Inline, so on a wrapped title it follows the last word.
                      <LiveDot className='ml-2 align-middle' />
                    )}
                  </button>
                </td>
                <td className='px-3 py-3 text-right text-foreground tabular-nums'>
                  {formatCompactNumber(fundraiser.views, locale)}
                </td>
                <td className='hidden px-3 py-3 text-right text-muted-foreground tabular-nums sm:table-cell'>
                  {formatCompactNumber(fundraiser.donateClicks, locale)}
                </td>
                <td className='hidden px-3 py-3 text-right text-muted-foreground tabular-nums sm:table-cell'>
                  {formatCompactNumber(fundraiser.donateSubmissions, locale)}
                </td>
                <td className='px-3 py-3 text-right text-muted-foreground tabular-nums'>
                  {fundraiser.views > 0
                    ? percent.format(fundraiser.donateClicks / fundraiser.views)
                    : '–'}
                </td>
                {/* Submitted rather than completed: some payment flows leave the page before the completed event is sent, so it undercounts. */}
                <td className='px-6 py-3 text-right font-medium text-foreground tabular-nums'>
                  {fundraiser.views > 0
                    ? percent.format(
                        fundraiser.donateSubmissions / fundraiser.views
                      )
                    : '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function CombinedCard({
  range,
  onRangeChange,
  data,
  isLoading,
  hasError,
  onRetry,
}: {
  range: AccountRange;
  onRangeChange: (range: AccountRange) => void;
  data: AccountInsights | null;
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
}) {
  const t = useTranslations('Dashboard.insights');
  const tRanges = useTranslations('Dashboard.fundraiser.insights');

  return (
    <Card className='gap-5 border-border/60 px-6 py-5 shadow-xs'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h2 className='text-lg font-semibold text-foreground'>
            {t('combinedTitle')}
          </h2>
          <p className='min-h-5 text-sm text-muted-foreground'>
            {data && !isLoading && <PeriodLabel data={data} />}
          </p>
        </div>
        <Tabs
          value={range}
          onValueChange={value => onRangeChange(value as AccountRange)}
        >
          <TabsList>
            {ACCOUNT_RANGES.map(option => (
              <TabsTrigger key={option} value={option}>
                {tRanges(`ranges.${option}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className='space-y-3'>
          <Skeleton className='h-10 w-48' />
          <Skeleton className='w-full' style={{ height: CHART_HEIGHT }} />
        </div>
      ) : hasError || !data ? (
        <div className='flex flex-col items-center gap-3 py-8 text-center'>
          <p className='text-sm text-muted-foreground'>{t('loadError')}</p>
          <Button variant='outline' size='sm' onClick={onRetry}>
            {t('retry')}
          </Button>
        </div>
      ) : (
        <>
          <SeriesTotals data={data} />
          {data.visitors === 0 ? (
            <p className='py-6 text-center text-sm text-muted-foreground'>
              {tRanges('empty')}
            </p>
          ) : (
            <VisitorsChart data={data} />
          )}
        </>
      )}
    </Card>
  );
}

/**
 * Insights across every fundraiser the host actively hosts, or one of them picked from the list.
 * The choice lives in the URL (?fundraiser=<slug>), so a view can be linked to.
 */
function AccountInsightsBody() {
  const t = useTranslations('Dashboard.insights');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = searchParams.get('fundraiser');

  const [range, setRange] = useState<AccountRange>('7d');
  const [attempt, setAttempt] = useState(0);
  const state = useAccountInsights(range, attempt);
  const data = state.status === 'ready' ? state.data : null;
  const selectedFundraiser = data?.fundraisers.find(f => f.slug === selected);

  const select = (slug: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (slug) params.set('fundraiser', slug);
    else params.delete('fundraiser');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  return (
    <section className='space-y-6'>
      <DashboardHeader title={t('title')} subtitle={t('subtitle')} />

      <Select
        value={selected ?? ALL}
        onValueChange={value => select(value === ALL ? null : value)}
      >
        <SelectTrigger
          className='w-full max-w-sm'
          aria-label={t('pickerLabel')}
        >
          <SelectValue placeholder={t('allFundraisers')}>
            {selected
              ? (selectedFundraiser?.title ?? selected)
              : t('allFundraisers')}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t('allFundraisers')}</SelectItem>
          {data && data.fundraisers.length > 0 && <SelectSeparator />}
          {data?.fundraisers.map(fundraiser => (
            <SelectItem key={fundraiser.slug} value={fundraiser.slug}>
              {fundraiser.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selected ? (
        <FundraiserInsightsCard
          // A new fundraiser starts from its own default range.
          key={selected}
          slug={selected}
          campaignStarted={
            !!selectedFundraiser &&
            selectedFundraiser.status !== 'draft' &&
            new Date(selectedFundraiser.startDate).getTime() <=
              (data?.endAt ?? 0)
          }
        />
      ) : (
        <>
          <CombinedCard
            range={range}
            onRangeChange={setRange}
            data={data}
            isLoading={state.status === 'loading'}
            hasError={state.status === 'error'}
            onRetry={() => setAttempt(count => count + 1)}
          />
          {data && <Ranking fundraisers={data.fundraisers} onSelect={select} />}
        </>
      )}

      <InsightsAccuracyNote />
    </section>
  );
}

export function AccountInsightsView() {
  return (
    <AuthGuard>
      <AccountInsightsBody />
    </AuthGuard>
  );
}
