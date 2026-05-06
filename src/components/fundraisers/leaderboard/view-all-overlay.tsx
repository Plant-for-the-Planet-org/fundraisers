'use client';

import type { LeaderboardDonation } from '@/lib/types/leaderboard';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { formatTimeAgo } from '@/lib/utils/time';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAvatarColor } from './donation-item';

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

  const donations = useMemo(
    () => (effectiveTab === 'recent' ? recentDonations : topDonations),
    [effectiveTab, recentDonations, topDonations]
  );

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
          <TabsList
            variant='line'
            className='gap-0 bg-transparent p-0 px-4 pt-3 h-auto relative'
          >
            {showRecentList && (
              <TabsTrigger value='recent' className={TAB_TRIGGER_CLASS}>
                {t('tabs.latest')}
              </TabsTrigger>
            )}
            {showTopList && (
              <TabsTrigger value='top' className={TAB_TRIGGER_CLASS}>
                {t('tabs.topDonations')}
              </TabsTrigger>
            )}
          </TabsList>

          <div className='max-h-[50vh] overflow-y-auto'>
            {donations.length > 0 ? (
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
