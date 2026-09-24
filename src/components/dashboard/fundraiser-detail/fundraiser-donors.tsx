'use client';

import type { LeaderboardPageResponse } from '@/lib/types/leaderboard';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getLeaderboardByTab } from '@/lib/api/leaderboard-service';
import { getReversedPageWindow } from '@/lib/utils/reverse-pages';
import { DonationTable } from '@/components/fundraisers/leaderboard/donation-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowDownWideShortIcon,
  ArrowUpWideShortIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HandHoldingHeartIcon,
  LinkIcon,
} from '@/components/ui/ui-icons';
import { useFundraiserDetail } from './fundraiser-detail-context';
import { useLeaderboardSummary } from './use-leaderboard-summary';

const PAGE_SIZE = 20;

// Paging here is by page number, so the API's links are not used.
const EMPTY_LINKS = { self: '', first: '', last: '' };

type DonorTab = 'recent' | 'top';
type DateOrder = 'newest' | 'oldest';

interface PageState {
  data: LeaderboardPageResponse | null;
  isLoading: boolean;
  hasError: boolean;
}

/**
 * The leaderboard only lists newest first. Oldest first reads the same list from the end, so every page stays full and the "1–20 of 1,215" label stays true.
 */
async function loadOldestFirst(
  fundraiserId: string,
  page: number
): Promise<LeaderboardPageResponse> {
  // One tiny request for the total, which says where the end of the list is.
  let { total } = await getLeaderboardByTab(fundraiserId, 'recent', 1, 1);

  // A donation arriving between the requests shifts the list by one. Every page reports the total it was cut from, so if that moved, try once more with the new total.
  for (let attempt = 0; attempt < 2; attempt++) {
    const window = getReversedPageWindow(total, page, PAGE_SIZE);
    if (!window) return { items: [], total, count: 0, _links: EMPTY_LINKS };

    const pages = await Promise.all(
      window.apiPages.map(apiPage =>
        getLeaderboardByTab(fundraiserId, 'recent', apiPage, PAGE_SIZE)
      )
    );
    const latestTotal = pages[pages.length - 1]!.total;
    const consistent = pages.every(response => response.total === total);
    if (!consistent && attempt === 0) {
      total = latestTotal;
      continue;
    }

    const items = pages
      .flatMap(response => response.items)
      .slice(window.start, window.end)
      .reverse();
    return { items, total, count: items.length, _links: EMPTY_LINKS };
  }

  // Unreachable: the second attempt always returns.
  return { items: [], total, count: 0, _links: EMPTY_LINKS };
}

export function FundraiserDonors() {
  const t = useTranslations('Dashboard.fundraiser.donors');
  const fundraiser = useFundraiserDetail();
  // "top" is grouped per donor only when the host turned that on in the leaderboard settings. Otherwise it lists single donations, so the label follows the setting.
  const groupedByDonor =
    fundraiser.settings?.modules?.leaderboard?.aggregate_top_by_donor ?? true;

  // The page is called Donors, so it opens on the donor list when there is one.
  const [tab, setTab] = useState<DonorTab>(groupedByDonor ? 'top' : 'recent');
  const [order, setOrder] = useState<DateOrder>('newest');
  const [page, setPage] = useState(1);
  const listTopRef = useRef<HTMLDivElement>(null);
  const { data: summary } = useLeaderboardSummary(fundraiser.id, 1);
  const [state, setState] = useState<PageState>({
    data: null,
    isLoading: true,
    hasError: false,
  });

  const load = useCallback(
    async (signal: { aborted: boolean }) => {
      setState(prev => ({ ...prev, isLoading: true, hasError: false }));
      try {
        const data =
          tab === 'recent' && order === 'oldest'
            ? await loadOldestFirst(fundraiser.id, page)
            : await getLeaderboardByTab(fundraiser.id, tab, page, PAGE_SIZE);
        if (signal.aborted) return;
        setState({ data, isLoading: false, hasError: false });
      } catch (error) {
        if (signal.aborted) return;
        console.error('[FundraiserDonors] Failed to load page:', error);
        setState({ data: null, isLoading: false, hasError: true });
      }
    },
    [fundraiser.id, tab, page, order]
  );

  useEffect(() => {
    const signal = { aborted: false };
    // Same client-side fetch pattern as the dashboard list; there is no data library to hand this to.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(signal);
    return () => {
      signal.aborted = true;
    };
  }, [load]);

  const changeTab = (value: string) => {
    setTab(value as DonorTab);
    setPage(1);
  };

  const totalPages = state.data
    ? Math.max(1, Math.ceil(state.data.total / PAGE_SIZE))
    : 1;
  const donations = state.data?.items ?? [];

  // Known from the fundraiser itself, so the empty state shows at once instead of after a fetch.
  if (fundraiser.donationCount === 0) {
    return (
      <Card className='items-center gap-3 border-dashed border-border/60 bg-card/40 px-6 py-12 text-center shadow-none'>
        <div className='flex size-12 items-center justify-center rounded-full bg-accent-color/10 text-accent-color'>
          <HandHoldingHeartIcon className='size-5' />
        </div>
        <h2 className='text-base font-semibold text-foreground'>
          {t('emptyTitle')}
        </h2>
        <p className='max-w-sm text-sm text-muted-foreground'>
          {fundraiser.canDonate ? t('emptyHint') : t('emptyHintClosed')}
        </p>
        {/* Sharing only helps while people can give: not for drafts, paused or ended fundraisers. */}
        {fundraiser.canDonate && (
          <Button asChild className='mt-1'>
            <Link
              href={`/dashboard/fundraisers/${encodeURIComponent(fundraiser.slug)}/share`}
            >
              <LinkIcon />
              {t('share')}
            </Link>
          </Button>
        )}
      </Card>
    );
  }

  const goTo = (next: number, scrollToTop: boolean) => {
    setPage(next);
    // From the bottom pager, bring the reader back to the top of the new page.
    if (scrollToTop) listTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const total = state.data?.total ?? 0;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const orderLabel = order === 'newest' ? t('newestFirst') : t('oldestFirst');

  const renderPager = (scrollToTop: boolean) =>
    totalPages > 1 ? (
      <div className='flex items-center gap-2'>
        <span className='mr-1 text-sm text-muted-foreground tabular-nums'>
          {t('range', { from, to, total })}
        </span>
        <Button
          variant='outline'
          size='icon-sm'
          className='rounded-full'
          aria-label={t('previous')}
          disabled={page <= 1 || state.isLoading}
          onClick={() => goTo(page - 1, scrollToTop)}
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          variant='outline'
          size='icon-sm'
          className='rounded-full'
          aria-label={t('next')}
          disabled={page >= totalPages || state.isLoading}
          onClick={() => goTo(page + 1, scrollToTop)}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    ) : null;

  return (
    <div ref={listTopRef} className='scroll-mt-8 space-y-3'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <Tabs value={tab} onValueChange={changeTab}>
          <TabsList>
            {groupedByDonor ? (
              <>
                <TabsTrigger value='top'>
                  {t(groupedByDonor ? 'donors' : 'topDonations', {
                    count: summary?.topTotal ?? 0,
                  })}
                </TabsTrigger>
                <TabsTrigger value='recent'>
                  {t('donations', { count: summary?.recentTotal ?? 0 })}
                </TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value='recent'>
                  {t('donations', { count: summary?.recentTotal ?? 0 })}
                </TabsTrigger>
                <TabsTrigger value='top'>
                  {t(groupedByDonor ? 'donors' : 'topDonations', {
                    count: summary?.topTotal ?? 0,
                  })}
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </Tabs>
      </div>

      <div className='flex flex-wrap items-center justify-between gap-3'>
        {/* Always shown, so the table does not shift as pages with and without anonymous donors come and go. */}
        <p className='text-sm text-muted-foreground'>{t('anonymousNote')}</p>
        <div className='flex items-center gap-2'>
          {/* Only the Donations tab is in date order. Donors are ranked by amount. */}
          {tab === 'recent' && (
            <Button
              variant='ghost'
              size='icon-sm'
              className='rounded-full'
              aria-label={orderLabel}
              title={orderLabel}
              onClick={() => {
                setOrder(current =>
                  current === 'newest' ? 'oldest' : 'newest'
                );
                setPage(1);
              }}
            >
              {order === 'newest' ? (
                <ArrowDownWideShortIcon />
              ) : (
                <ArrowUpWideShortIcon />
              )}
            </Button>
          )}
          {renderPager(false)}
        </div>
      </div>

      <Card className='gap-0 border-border/60 py-2 shadow-xs'>
        {state.isLoading ? (
          <div className='space-y-3 p-4'>
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className='h-8 w-full' />
            ))}
          </div>
        ) : state.hasError ? (
          <div className='flex flex-col items-center gap-3 py-10 text-center'>
            <p className='text-sm text-destructive'>{t('loadError')}</p>
            <Button
              variant='outline'
              size='sm'
              onClick={() => void load({ aborted: false })}
            >
              {t('retry')}
            </Button>
          </div>
        ) : (
          <DonationTable
            donations={donations}
            anonymize={false}
            showAmount
            showAvatar
            showDate={!(groupedByDonor && tab === 'top')}
          />
        )}
      </Card>

      {totalPages > 1 && (
        <div className='flex justify-end'>{renderPager(true)}</div>
      )}
    </div>
  );
}
