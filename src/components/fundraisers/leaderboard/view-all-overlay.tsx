'use client';

import type { LeaderboardDonation } from '@/lib/types/leaderboard';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { Loader2, RefreshCw } from 'lucide-react';
import { getLeaderboardByTab } from '@/lib/api/leaderboard-service';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DonationTable } from './donation-table';
import { OverlayHeader } from './overlay-header';

const PAGE_SIZE = 10;

interface ViewAllOverlayProps {
  idOrSlug: string;
  isOpen: boolean;
  onClose: (activeTab: 'recent' | 'top') => void;
  initialRecent: LeaderboardDonation[];
  initialTop: LeaderboardDonation[];
  recentTotal: number;
  topTotal: number;
  activeTab: 'recent' | 'top';
  showRecentList: boolean;
  showTopList: boolean;
  anonymize: boolean;
  showAmount: boolean;
  showAvatar: boolean;
  aggregateTopByDonor: boolean;
}

export function ViewAllOverlay({
  idOrSlug,
  isOpen,
  onClose,
  initialRecent,
  initialTop,
  recentTotal,
  topTotal,
  activeTab,
  showRecentList,
  showTopList,
  anonymize,
  showAmount,
  showAvatar,
  aggregateTopByDonor,
}: ViewAllOverlayProps) {
  const t = useTranslations('Leaderboard.view');
  const [tab, setTab] = useState<'recent' | 'top'>(activeTab);
  const [lastIsOpen, setLastIsOpen] = useState(false);

  // Pagination state
  const [recentPageCache, setRecentPageCache] = useState<
    Map<number, LeaderboardDonation[]>
  >(() => {
    const m = new Map<number, LeaderboardDonation[]>();
    m.set(1, initialRecent);
    return m;
  });

  const [topPageCache, setTopPageCache] = useState<
    Map<number, LeaderboardDonation[]>
  >(() => {
    const m = new Map<number, LeaderboardDonation[]>();
    m.set(1, initialTop);
    return m;
  });

  const [pagePerTab, setPagePerTab] = useState({ recent: 1, top: 1 });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [hasMore, setHasMore] = useState({
    recent: recentTotal > initialRecent.length,
    top: topTotal > initialTop.length,
  });

  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Render-time state sync (React 19 pattern). We sync `tab` from the parent's
  // `activeTab` the moment the overlay opens. A useEffect would defer this by
  // one tick, causing a visible flash of the wrong tab on open.
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
        return;
      }

      // Focus trap: cycle Tab/Shift+Tab within the dialog
      if (event.key === 'Tab') {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
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
    setFetchError(false);
    try {
      const response = await getLeaderboardByTab(
        idOrSlug,
        effectiveTab,
        nextPage,
        PAGE_SIZE
      );

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
        [effectiveTab]: !!response._links?.next,
      }));
    } catch (error) {
      console.error('Failed to fetch leaderboard page', nextPage, error);
      setFetchError(true);
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
      ref={dialogRef}
      role='dialog'
      aria-modal='true'
      aria-labelledby='leaderboard-overlay-title'
      className='fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center'
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className='w-full max-w-3xl mx-4 bg-background rounded-2xl shadow-2xl border border-border overflow-hidden'>
        <OverlayHeader onClose={handleClose} />

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
                <TabsTrigger value='top'>
                  {aggregateTopByDonor
                    ? t('tabs.topDonors')
                    : t('tabs.topDonations')}
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <div ref={scrollRef} className='h-[72vh] lg:h-[66vh] overflow-y-auto'>
            {donations.length > 0 ? (
              <>
                <DonationTable
                  donations={donations}
                  anonymize={anonymize}
                  showAmount={showAmount}
                  showAvatar={showAvatar}
                />
                {isLoadingMore && (
                  <div className='flex items-center justify-center gap-2 py-4'>
                    <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                    <span className='text-sm text-muted-foreground'>
                      {t('viewAllOverlay.loadingMore')}
                    </span>
                  </div>
                )}
                {fetchError && (
                  <div className='flex items-center justify-center gap-2 py-4'>
                    <span className='text-sm text-destructive'>
                      {t('viewAllOverlay.loadError')}
                    </span>
                    <button
                      type='button'
                      onClick={() => {
                        setFetchError(false);
                        fetchNextPageRef.current();
                      }}
                      className='inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'
                    >
                      <RefreshCw className='h-3.5 w-3.5' />
                      {t('viewAllOverlay.retry')}
                    </button>
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
