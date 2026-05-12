'use client';

import type { LeaderboardDonation } from '@/lib/types/leaderboard';

import { useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { DonationItem } from './donation-item';

interface ScrollingDonationListProps {
  donations: LeaderboardDonation[];
  isActive: boolean;
  anonymize: boolean;
  showAmount: boolean;
  showAvatar: boolean;
  showDate?: boolean;
}

export function ScrollingDonationList({
  donations,
  isActive,
  anonymize,
  showAmount,
  showAvatar,
  showDate = true,
}: ScrollingDonationListProps) {
  const t = useTranslations('Leaderboard.view');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoScroll = useCallback((el: HTMLDivElement) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    let pos = 0;
    intervalRef.current = setInterval(() => {
      if (!el) return;
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth) {
        pos = 0;
        el.scrollLeft = 0;
      } else {
        pos += 0.5;
        el.scrollLeft = pos;
      }
    }, 30);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isActive) {
      stopAutoScroll();
      return;
    }
    const el = scrollRef.current;
    if (el) {
      el.scrollLeft = 0;
      setTimeout(() => startAutoScroll(el), 100);
    }
    return () => stopAutoScroll();
  }, [isActive, donations, startAutoScroll, stopAutoScroll]);

  useEffect(() => () => stopAutoScroll(), [stopAutoScroll]);

  if (donations.length === 0) {
    return (
      <div className='scrolling-donation-list flex items-center justify-center py-4'>
        <p className='text-sm text-muted-foreground'>{t('emptyState')}</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className='scrolling-donation-list flex items-center gap-4 overflow-hidden py-2'
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      onMouseEnter={stopAutoScroll}
      onMouseLeave={() => {
        const el = scrollRef.current;
        if (el) setTimeout(() => startAutoScroll(el), 100);
      }}
    >
      {donations.map(donation => (
        <DonationItem
          key={donation.id}
          donation={donation}
          anonymize={anonymize}
          showAmount={showAmount}
          showAvatar={showAvatar}
          showDate={showDate}
        />
      ))}
    </div>
  );
}
