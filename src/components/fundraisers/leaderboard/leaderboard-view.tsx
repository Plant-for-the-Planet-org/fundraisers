'use client';

import type { LeaderboardModuleSettings } from '@/lib/types/fundraiser';
import type { LeaderboardDonation } from '@/lib/types/leaderboard';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollingDonationList } from './scrolling-donation-list';
import { ViewAllOverlay } from './view-all-overlay';

interface LeaderboardViewProps {
  idOrSlug: string;
  recentDonationSlice: LeaderboardDonation[];
  topDonationSlice: LeaderboardDonation[];
  totalRecentDonationCount: number;
  totalTopDonationCount: number;
  settings: LeaderboardModuleSettings;
}

const TAB_TRIGGER_CLASS = cn(
  'h-auto flex-none text-foreground after:hidden',
  'px-4 py-2 text-sm font-medium bg-transparent transition-all rounded-t-md rounded-b-none relative -mb-px z-10 !shadow-none border-2 border-transparent',
  'data-[state=active]:bg-transparent data-[state=active]:border-t-tab-border data-[state=active]:border-l-tab-border data-[state=active]:border-r-tab-border data-[state=active]:border-b-0 data-[state=active]:shadow-none',
  'dark:data-[state=active]:bg-transparent dark:data-[state=active]:border-transparent dark:data-[state=active]:border-t-tab-border dark:data-[state=active]:border-l-tab-border dark:data-[state=active]:border-r-tab-border',
  'data-[state=inactive]:border-t-0 data-[state=inactive]:border-l-0 data-[state=inactive]:border-r-0 data-[state=inactive]:border-b-tab-border data-[state=inactive]:shadow-none',
  'hover:bg-muted/50'
);

export function LeaderboardView({
  idOrSlug,
  recentDonationSlice,
  topDonationSlice,
  totalRecentDonationCount,
  totalTopDonationCount,
  settings,
}: LeaderboardViewProps) {
  const {
    show_recent_list,
    show_top_list,
    view_all,
    anonymize,
    show_amount,
    show_avatar,
    default_tab,
    aggregate_top_by_donor,
  } = settings;

  const t = useTranslations('Leaderboard.view');
  const [activeTab, setActiveTab] = useState<'recent' | 'top'>(default_tab);
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);

  const effectiveTab =
    activeTab === 'recent' && !show_recent_list
      ? 'top'
      : activeTab === 'top' && !show_top_list
        ? 'recent'
        : activeTab;

  return (
    <div className='leaderboard-view w-full flex flex-col gap-4'>
      <Tabs
        value={effectiveTab}
        onValueChange={value => setActiveTab(value as 'recent' | 'top')}
      >
        <div className='flex justify-between items-start'>
          <TabsList className='gap-0 bg-transparent p-0 h-auto relative'>
            {show_recent_list && (
              <TabsTrigger value='recent' className={TAB_TRIGGER_CLASS}>
                {t('tabs.latest')}
              </TabsTrigger>
            )}
            {show_top_list && (
              <TabsTrigger value='top' className={TAB_TRIGGER_CLASS}>
                {aggregate_top_by_donor
                  ? t('tabs.topDonors')
                  : t('tabs.topDonations')}
              </TabsTrigger>
            )}
          </TabsList>
          {view_all && (
            <Button
              variant='ghost'
              className='text-zinc-800 dark:text-gray-100 text-sm font-semibold leading-tight p-0 h-auto hover:opacity-70 transition-opacity'
              onClick={() => setIsViewAllOpen(true)}
            >
              {t('viewAll')}
            </Button>
          )}
        </div>

        {show_recent_list && (
          <TabsContent value='recent' className='mt-0'>
            <ScrollingDonationList
              donations={recentDonationSlice}
              isActive={effectiveTab === 'recent'}
              anonymize={anonymize}
              showAmount={show_amount}
              showAvatar={show_avatar}
            />
          </TabsContent>
        )}
        {show_top_list && (
          <TabsContent value='top' className='mt-0'>
            <ScrollingDonationList
              donations={topDonationSlice}
              isActive={effectiveTab === 'top'}
              anonymize={anonymize}
              showAmount={show_amount}
              showAvatar={show_avatar}
            />
          </TabsContent>
        )}
      </Tabs>

      <ViewAllOverlay
        idOrSlug={idOrSlug}
        isOpen={isViewAllOpen}
        onClose={closedTab => {
          setIsViewAllOpen(false);
          setActiveTab(closedTab);
        }}
        recentDonationSlice={recentDonationSlice}
        topDonationSlice={topDonationSlice}
        totalRecentDonationCount={totalRecentDonationCount}
        totalTopDonationCount={totalTopDonationCount}
        activeTab={effectiveTab}
        showRecentList={show_recent_list}
        showTopList={show_top_list}
        anonymize={anonymize}
        showAmount={show_amount}
        showAvatar={show_avatar}
        aggregateTopByDonor={aggregate_top_by_donor}
      />
    </div>
  );
}
