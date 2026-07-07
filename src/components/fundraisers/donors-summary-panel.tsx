'use client';

import type { LeaderboardModuleSettings } from '@/lib/types/fundraiser';
import type { LeaderboardDonation } from '@/lib/types/leaderboard';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { LayoutList } from 'lucide-react';
import { formatCompactNumber } from '@/lib/utils';
import { DonorsStrip } from './donors-strip';
import { resolveActiveTab } from './leaderboard/resolve-tab';
import { ViewAllOverlay } from './leaderboard/view-all-overlay';
import { SectionHeader } from './typography';

export interface DonorsSummaryPanelProps {
  /** Strip avatars + names. Recent or top, depending on caller. */
  donations: LeaderboardDonation[];
  donationCount: number;
  settings: LeaderboardModuleSettings;
  /** Data the existing ViewAllOverlay needs to open over this fundraiser. */
  idOrSlug: string;
  initialRecentDonations: LeaderboardDonation[];
  initialTopDonations: LeaderboardDonation[];
  totalRecentDonationCount: number;
  totalTopDonationCount: number;
  /** Shows the "demo data" note in the edit-mode preview. */
  demo?: boolean;
}

/**
 * Sidebar donor summary: count header + DonorsStrip, with a "View all" expand
 * icon in the header that opens the existing ViewAllOverlay modal. The
 * leaderboard widget keeps its own trigger; this is a second, independent
 * entry point. Gated by the leaderboard `view_all` setting.
 */
export function DonorsSummaryPanel({
  donations,
  donationCount,
  settings,
  idOrSlug,
  initialRecentDonations,
  initialTopDonations,
  totalRecentDonationCount,
  totalTopDonationCount,
  demo = false,
}: DonorsSummaryPanelProps) {
  const t = useTranslations('Fundraisers');
  const tLeaderboard = useTranslations('Leaderboard.view');
  const locale = useLocale();
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);

  const canViewAll =
    settings.view_all && (settings.show_recent_list || settings.show_top_list);

  const activeTab = resolveActiveTab(settings.default_tab, settings);

  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader
        className='flex-row items-center justify-between'
        actionSlot={
          (demo || canViewAll) && (
            <div className='flex items-center gap-2'>
              {demo && (
                <span className='text-xs text-muted-foreground'>
                  {t('demoData')}
                </span>
              )}
              {canViewAll && (
                <button
                  type='button'
                  onClick={() => setIsViewAllOpen(true)}
                  aria-label={tLeaderboard('viewAll')}
                  title={tLeaderboard('viewAll')}
                  className='text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none'
                >
                  <LayoutList size={16} />
                </button>
              )}
            </div>
          )
        }
      >
        {t('donationCount', {
          count: donationCount,
          formattedCount: formatCompactNumber(donationCount, locale),
        })}
      </SectionHeader>

      <DonorsStrip donations={donations} donationCount={donationCount} />

      <ViewAllOverlay
        idOrSlug={idOrSlug}
        isOpen={isViewAllOpen}
        onClose={() => setIsViewAllOpen(false)}
        initialRecentDonations={initialRecentDonations}
        initialTopDonations={initialTopDonations}
        totalRecentDonationCount={totalRecentDonationCount}
        totalTopDonationCount={totalTopDonationCount}
        activeTab={activeTab}
        showRecentList={settings.show_recent_list}
        showTopList={settings.show_top_list}
        anonymize={settings.anonymize}
        showAmount={settings.show_amount}
        showAvatar={settings.show_avatar}
        aggregateTopByDonor={settings.aggregate_top_by_donor}
      />
    </div>
  );
}
