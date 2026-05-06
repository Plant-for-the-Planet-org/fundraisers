'use client';

import type { LeaderboardDonation } from '@/lib/types/leaderboard';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { CalendarDays, Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { formatTimeAgo } from '@/lib/utils/time';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAvatarColor } from './donation-item';

type TimeFilter = 'all' | 'today' | 'week' | 'month';

const TIME_FILTERS: TimeFilter[] = ['all', 'today', 'week', 'month'];

const TIME_FILTER_LABEL_KEYS = {
  all: 'viewAllOverlay.filterAll',
  today: 'viewAllOverlay.filterToday',
  week: 'viewAllOverlay.filterWeek',
  month: 'viewAllOverlay.filterMonth',
} as const;

const TAB_TRIGGER_CLASS = cn(
  'h-auto flex-none text-foreground after:hidden',
  'px-4 py-2 text-sm font-medium bg-transparent transition-all rounded-t-md rounded-b-none relative -mb-px z-10 shadow-none border-2 border-transparent',
  'data-[state=active]:bg-white/0 data-[state=active]:border-t-white/50 data-[state=active]:border-l-white/50 data-[state=active]:border-r-white/50 data-[state=active]:border-b-transparent data-[state=active]:shadow-none',
  'data-[state=inactive]:border-b-white/50 data-[state=inactive]:shadow-none',
  'dark:data-[state=active]:bg-transparent',
  'hover:bg-muted/50'
);

interface ViewAllOverlayProps {
  isOpen: boolean;
  onClose: (activeTab: 'recent' | 'top') => void;
  recentDonations: LeaderboardDonation[];
  topDonations: LeaderboardDonation[];
  activeTab: 'recent' | 'top';
  showRecentList: boolean;
  showTopList: boolean;
  anonymize: boolean;
  showAmount: boolean;
  showAvatar: boolean;
}

export function ViewAllOverlay({
  isOpen,
  onClose,
  recentDonations,
  topDonations,
  activeTab,
  showRecentList,
  showTopList,
  anonymize,
  showAmount,
  showAvatar,
}: ViewAllOverlayProps) {
  const t = useTranslations('Leaderboard.view');
  const [tab, setTab] = useState<'recent' | 'top'>(activeTab);
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [lastIsOpen, setLastIsOpen] = useState(false);

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

  const filteredDonations = useMemo(() => {
    const source = effectiveTab === 'recent' ? recentDonations : topDonations;
    let result = source;

    // Time-range filter
    if (timeFilter !== 'all') {
      const now = new Date();
      let threshold: Date;

      switch (timeFilter) {
        case 'today':
          threshold = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case 'week': {
          const day = now.getDay();
          const sinceMon = day === 0 ? 6 : day - 1;
          threshold = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - sinceMon
          );
          break;
        }
        case 'month':
          threshold = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      const cutoff = threshold.getTime();
      result = result.filter(d => new Date(d.created).getTime() >= cutoff);
    }

    // Search filter
    if (search) {
      const query = search.toLowerCase();
      result = result.filter(d => d.donorName.toLowerCase().includes(query));
    }

    return result;
  }, [effectiveTab, recentDonations, topDonations, search, timeFilter]);

  const filterLabel = t(TIME_FILTER_LABEL_KEYS[timeFilter]);

  if (!isOpen || !hasEnabledList) return null;

  return createPortal(
    <div
      className='fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-start justify-center pt-[10vh]'
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className='w-full max-w-3xl mx-4 bg-background rounded-2xl shadow-2xl border border-border overflow-hidden'>
        {/* Header */}
        <div className='flex items-start justify-between px-4 pt-4 pb-3 border-b border-border'>
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

        {/* Toolbar + Tabs + List */}
        <Tabs
          value={effectiveTab}
          onValueChange={value => setTab(value as 'recent' | 'top')}
        >
          <div className='flex flex-wrap items-center justify-between gap-3 px-4 py-3'>
            <div className='flex items-center gap-3 max-w-[50%] min-w-[280px]'>
              <div className='relative flex-1'>
                <Search
                  className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground'
                  aria-hidden='true'
                />
                <Input
                  type='search'
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder={t('viewAllOverlay.searchPlaceholder')}
                  aria-label={t('viewAllOverlay.searchPlaceholder')}
                  className='h-11 rounded-xl bg-background pl-9 pr-4 [&::-webkit-search-cancel-button]:cursor-pointer'
                />
              </div>

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-11 shrink-0 justify-between rounded-xl border-border/60 bg-background px-4 has-[>svg]:px-4'
                  >
                    <span className='inline-flex min-w-0 items-center gap-1.5 truncate'>
                      <CalendarDays
                        className='h-4 w-4 shrink-0 text-muted-foreground'
                        aria-hidden='true'
                      />
                      <span className='truncate font-medium text-foreground'>
                        {filterLabel}
                      </span>
                    </span>
                    <ChevronDown
                      className='ml-2 h-4 w-4 shrink-0'
                      aria-hidden='true'
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='end'
                  className='w-48 rounded-xl border-border/60 shadow-lg'
                >
                  {TIME_FILTERS.map(option => {
                    const isSelected = option === timeFilter;
                    const label = t(TIME_FILTER_LABEL_KEYS[option]);
                    return (
                      <DropdownMenuItem
                        key={option}
                        onSelect={() => setTimeFilter(option)}
                        className='gap-2'
                      >
                        <span className='flex h-4 w-4 items-center justify-center'>
                          {isSelected && (
                            <Check
                              className='h-4 w-4 text-emerald-600 dark:text-emerald-400'
                              aria-hidden='true'
                            />
                          )}
                        </span>
                        <span>{label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <TabsList
              variant='line'
              className='gap-0 bg-transparent p-0 h-auto relative'
            >
              {showRecentList && (
                <TabsTrigger value='recent' className={TAB_TRIGGER_CLASS}>
                  {t('tabs.newest')}
                </TabsTrigger>
              )}
              {showTopList && (
                <TabsTrigger value='top' className={TAB_TRIGGER_CLASS}>
                  {t('tabs.topDonations')}
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <div className='max-h-[50vh] overflow-y-auto'>
            {filteredDonations.length > 0 ? (
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
                  {filteredDonations.map(donation => {
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
            ) : search ? (
              <div className='py-8 text-center'>
                <p className='text-sm text-muted-foreground'>
                  {t('viewAllOverlay.noResults')}
                </p>
              </div>
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
