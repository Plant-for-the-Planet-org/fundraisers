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
  recentDonations: LeaderboardDonation[];
  topDonations: LeaderboardDonation[];
  settings: LeaderboardModuleSettings;
}

const TAB_TRIGGER_CLASS = cn(
  'h-auto flex-none text-foreground after:hidden',
  'px-4 py-2 text-sm font-medium bg-transparent transition-all rounded-t-md rounded-b-none relative -mb-px z-10 shadow-none border-2 border-transparent',
  'data-[state=active]:bg-white/0 data-[state=active]:border-t-white/50 data-[state=active]:border-l-white/50 data-[state=active]:border-r-white/50 data-[state=active]:border-b-transparent data-[state=active]:shadow-none',
  'data-[state=inactive]:border-b-white/50 data-[state=inactive]:shadow-none',
  'dark:data-[state=active]:bg-transparent',
  'hover:bg-muted/50'
);

export function LeaderboardView({
  recentDonations,
  topDonations,
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
          <TabsList
            variant='line'
            className='gap-0 bg-transparent p-0 h-auto relative'
          >
            {show_recent_list && (
              <TabsTrigger value='recent' className={TAB_TRIGGER_CLASS}>
                {t('tabs.newest')}
              </TabsTrigger>
            )}
            {show_top_list && (
              <TabsTrigger value='top' className={TAB_TRIGGER_CLASS}>
                {t('tabs.topDonations')}
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
              donations={recentDonations}
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
              donations={topDonations}
              isActive={effectiveTab === 'top'}
              anonymize={anonymize}
              showAmount={show_amount}
              showAvatar={show_avatar}
            />
          </TabsContent>
        )}
      </Tabs>

      <ViewAllOverlay
        isOpen={isViewAllOpen}
        onClose={() => setIsViewAllOpen(false)}
        donations={effectiveTab === 'recent' ? recentDonations : topDonations}
        anonymize={anonymize}
        showAmount={show_amount}
        showAvatar={show_avatar}
      />
    </div>
  );
}
