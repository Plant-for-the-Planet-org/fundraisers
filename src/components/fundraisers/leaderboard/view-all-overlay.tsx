'use client';

import type { LeaderboardDonation } from '@/lib/types/leaderboard';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { Loader2, X } from 'lucide-react';
import {
  getLeaderboardRecent,
  getLeaderboardTop,
} from '@/lib/api/leaderboard-service';
import { cn } from '@/lib/utils';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { formatTimeAgo } from '@/lib/utils/time';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAvatarColor } from './donation-item';

const PAGE_SIZE = 10;

interface ViewAllOverlayProps {
  idOrSlug: string;
  isOpen: boolean;
  onClose: (activeTab: 'recent' | 'top') => void;
  recentDonations: LeaderboardDonation[];
  topDonations: LeaderboardDonation[];
  recentTotal: number;
  topTotal: number;
  activeTab: 'recent' | 'top';
  showRecentList: boolean;
  showTopList: boolean;
  anonymize: boolean;
  showAmount: boolean;
  showAvatar: boolean;
}

export function ViewAllOverlay({
  idOrSlug,
  isOpen,
  onClose,
  recentDonations,
  topDonations,
  recentTotal,
  topTotal,
  activeTab,
  showRecentList,
  showTopList,
  anonymize,
  showAmount,
  showAvatar,
}: ViewAllOverlayProps) {
  const t = useTranslations('Leaderboard.view');
  const [tab, setTab] = useState<'recent' | 'top'>(activeTab);
  const [lastIsOpen, setLastIsOpen] = useState(false);

  // Pagination state
  const [recentPageCache, setRecentPageCache] = useState<
    Map<number, LeaderboardDonation[]>
  >(() => {
    const m = new Map<number, LeaderboardDonation[]>();
    m.set(1, recentDonations);
    return m;
  });

  const [topPageCache, setTopPageCache] = useState<
    Map<number, LeaderboardDonation[]>
  >(() => {
    const m = new Map<number, LeaderboardDonation[]>();
    m.set(1, topDonations);
    return m;
  });

  const [pagePerTab, setPagePerTab] = useState({ recent: 1, top: 1 });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState({
    recent: recentTotal > recentDonations.length,
    top: topTotal > topDonations.length,
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync tab from parent when overlay opens
  if (isOpen !== lastIsOpen) {
    setLastIsOpen(isOpen);
    if (isOpen) {
      setTab(activeTab);
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const hasEnabledList = showRecentList || showTopList;

  const effectiveTab =
    tab === 'recent' && !showRecentList
      ? 'top'
      : tab === 'top' && !showTopList
        ? 'recent'
        : tab;

  const handleClose = useCallback(() => {
    onClose(effectiveTab);
  }, [onClose, effectiveTab]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        handleClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, isOpen]);

  // Flatten cached pages into a single list
  const donations = useMemo(() => {
    const cache = effectiveTab === 'recent' ? recentPageCache : topPageCache;
    const maxPage = pagePerTab[effectiveTab];
    const result: LeaderboardDonation[] = [];
    for (let i = 1; i <= maxPage; i++) {
      const page = cache.get(i);
      if (page) result.push(...page);
    }
    return result;
  }, [effectiveTab, pagePerTab, recentPageCache, topPageCache]);

  // Fetch next page for the active tab
  const fetchNextPage = useCallback(async () => {
    if (isLoadingMore || !hasMore[effectiveTab]) return;

    const currentPage = pagePerTab[effectiveTab];
    const nextPage = currentPage + 1;

    // Use cached data if available
    const cache = effectiveTab === 'recent' ? recentPageCache : topPageCache;
    if (cache.has(nextPage)) {
      setPagePerTab(prev => ({ ...prev, [effectiveTab]: nextPage }));
      return;
    }

    setIsLoadingMore(true);
    try {
      const response =
        effectiveTab === 'recent'
          ? await getLeaderboardRecent(idOrSlug, nextPage, PAGE_SIZE)
          : await getLeaderboardTop(idOrSlug, nextPage, PAGE_SIZE);

      // Cache the fetched page for the active tab
      const setCache =
        effectiveTab === 'recent' ? setRecentPageCache : setTopPageCache;
      setCache(prev => {
        const m = new Map(prev);
        m.set(nextPage, response.items);
        return m;
      });

      setPagePerTab(prev => ({ ...prev, [effectiveTab]: nextPage }));

      // Use _links.next presence to determine hasMore
      setHasMore(prev => ({
        ...prev,
        [effectiveTab]: !!response._links.next,
      }));
    } catch (error) {
      console.error('Failed to fetch leaderboard page', nextPage, error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    effectiveTab,
    isLoadingMore,
    hasMore,
    pagePerTab,
    recentPageCache,
    topPageCache,
    idOrSlug,
  ]);

  // Ref keeps observer callback stable while always calling the latest fetchNextPage
  const fetchNextPageRef = useRef(fetchNextPage);
  useEffect(() => {
    fetchNextPageRef.current = fetchNextPage;
  }, [fetchNextPage]);

  // Sentinel element observed for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver triggers fetch when sentinel nears the viewport.
  // Handles both scroll-near-bottom AND content-shorter-than-container cases.
  useEffect(() => {
    if (!isOpen) return;

    const sentinel = sentinelRef.current;
    const scrollContainer = scrollRef.current;
    if (!sentinel || !scrollContainer) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          fetchNextPageRef.current();
        }
      },
      {
        root: scrollContainer,
        rootMargin: '0px 0px 300px 0px',
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isOpen, effectiveTab, donations.length]);

  if (!isOpen || !hasEnabledList) return null;

  return createPortal(
    <div
      className='fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center'
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className='w-full max-w-3xl mx-4 bg-background rounded-2xl shadow-2xl border border-border overflow-hidden'>
        {/* Header */}
        <div className='flex items-start justify-between px-4 pt-4 pb-3'>
          <div>
            <h2 className='text-xl font-semibold text-foreground'>
              {t('viewAllOverlay.title')}
            </h2>
            <p className='text-sm text-muted-foreground mt-1'>
              {t('viewAllOverlay.subtitle')}
            </p>
          </div>
          <button
            type='button'
            onClick={handleClose}
            className='p-2 hover:bg-muted rounded-full transition-colors'
            aria-label={t('viewAllOverlay.closeAria')}
          >
            <X className='w-5 h-5 text-muted-foreground' />
          </button>
        </div>

        {/* Tabs + List */}
        <Tabs
          value={effectiveTab}
          onValueChange={value => setTab(value as 'recent' | 'top')}
        >
          <div className='px-4 pt-3'>
            <TabsList>
              {showRecentList && (
                <TabsTrigger value='recent'>{t('tabs.latest')}</TabsTrigger>
              )}
              {showTopList && (
                <TabsTrigger value='top'>{t('tabs.topDonations')}</TabsTrigger>
              )}
            </TabsList>
          </div>

          <div ref={scrollRef} className='h-[72vh] lg:h-[66vh] overflow-y-auto'>
            {donations.length > 0 ? (
              <>
                <table className='w-full'>
                  <thead className='sticky top-0 z-10 bg-background'>
                    <tr className='border-b border-border'>
                      <th className='w-full py-2 px-4 text-left text-xs font-medium text-muted-foreground'>
                        {t('viewAllOverlay.columnDonor')}
                      </th>
                      {showAmount && (
                        <th className='py-2 px-4 text-right text-xs font-medium text-muted-foreground whitespace-nowrap'>
                          {t('viewAllOverlay.columnAmount')}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-border'>
                    {donations.map(donation => {
                      const isAnonymous =
                        anonymize || donation.isAnonymous || false;
                      const displayName = isAnonymous
                        ? t('donation.anonymous')
                        : donation.donorName;

                      return (
                        <tr key={donation.id}>
                          <td className='py-3 px-4'>
                            <div className='flex items-center gap-3 min-w-0'>
                              {showAvatar && (
                                <Avatar className='h-8 w-8 shrink-0 ring-2 ring-white/20 dark:ring-gray-500/20'>
                                  {!isAnonymous && donation.avatarUrl && (
                                    <AvatarImage
                                      src={donation.avatarUrl}
                                      alt={donation.donorName}
                                      loading='lazy'
                                    />
                                  )}
                                  <AvatarFallback
                                    className={getAvatarColor(donation.id)}
                                  />
                                </Avatar>
                              )}
                              <div className='flex flex-col min-w-0'>
                                <span
                                  className={cn(
                                    'truncate text-sm font-semibold leading-tight',
                                    isAnonymous
                                      ? 'text-zinc-500 dark:text-gray-400 italic'
                                      : 'text-zinc-800 dark:text-gray-100'
                                  )}
                                >
                                  {displayName}
                                </span>
                                <span className='text-xs text-muted-foreground leading-tight mt-0.5'>
                                  {formatTimeAgo(donation.created)}
                                </span>
                              </div>
                            </div>
                          </td>
                          {showAmount && (
                            <td className='py-3 px-4 text-right text-sm font-semibold text-foreground whitespace-nowrap'>
                              {formatCurrencyFromDecimal(
                                donation.amount,
                                donation.currency
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {isLoadingMore && (
                  <div className='flex items-center justify-center gap-2 py-4'>
                    <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                    <span className='text-sm text-muted-foreground'>
                      {t('viewAllOverlay.loadingMore')}
                    </span>
                  </div>
                )}
                {/* Sentinel observed by IntersectionObserver for infinite scroll */}
                <div ref={sentinelRef} className='h-1' aria-hidden='true' />
              </>
            ) : (
              <div className='py-8 text-center'>
                <p className='text-sm text-muted-foreground'>
                  {t('viewAllOverlay.emptyState')}
                </p>
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </div>,
    document.body
  );
}
