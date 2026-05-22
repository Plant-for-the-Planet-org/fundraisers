'use client';

import type { LeaderboardDonation } from '@/lib/types/leaderboard';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DonationItem } from './donation-item';

const SCROLL_SPEED = 30; // px per second

interface ScrollingDonationListProps {
  initialDonations: LeaderboardDonation[];
  isActive: boolean;
  anonymize: boolean;
  showAmount: boolean;
  showAvatar: boolean;
  showDate?: boolean;
}

export function ScrollingDonationList({
  initialDonations,
  isActive,
  anonymize,
  showAmount,
  showAvatar,
  showDate = true,
}: ScrollingDonationListProps) {
  const t = useTranslations('Leaderboard.view');
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const set1Ref = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scrollPositionRef = useRef(0);
  const isActiveRef = useRef(isActive);
  const hoverPausedRef = useRef(false);
  const [shouldScroll, setShouldScroll] = useState(true);
  const [numCopies, setNumCopies] = useState(2);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // The inner div holds numCopies identical sets side by side. Only the inner
  // div moves (via translateX); the outer container clips it with overflow-hidden.
  // When scrollPosition reaches one set's width, it wraps back to 0. Since all
  // sets are identical, the reset is visually seamless — but only if the viewport
  // is always covered by content. numCopies ensures that: we need enough copies
  // so that (numCopies × setWidth) covers (containerWidth + setWidth).
  // If all items already fit, scrolling is skipped entirely.
  useLayoutEffect(() => {
    const container = containerRef.current;
    const set1 = set1Ref.current;
    if (!container || !set1) return;

    const containerWidth = container.offsetWidth;
    const setWidth = set1.offsetWidth;
    if (setWidth <= 0) return;

    if (setWidth <= containerWidth) {
      setShouldScroll(false);
      setNumCopies(1);
    } else {
      setShouldScroll(true);
      setNumCopies(Math.max(2, Math.floor(containerWidth / setWidth) + 2));
    }
  }, [initialDonations.length]);

  // Animation loop: advances scrollPosition by SCROLL_SPEED px/s on each frame.
  // Resets lastTime to null while paused so there's no position jump on resume.
  useEffect(() => {
    const inner = innerRef.current;
    const set1 = set1Ref.current;
    if (!inner || !set1) return;

    if (!shouldScroll) {
      inner.style.transform = 'translateX(0)';
      return;
    }

    // time: ms since page load, provided by requestAnimationFrame on each frame.
    // lastTime: same value from the previous frame; the difference gives elapsed ms.
    let lastTime: number | null = null;

    function tick(time: number) {
      const paused = !isActiveRef.current || hoverPausedRef.current;

      if (!paused) {
        if (lastTime !== null) {
          const setWidth = set1!.offsetWidth;
          if (setWidth > 0) {
            scrollPositionRef.current +=
              SCROLL_SPEED * ((time - lastTime) / 1000);
            if (scrollPositionRef.current >= setWidth)
              scrollPositionRef.current -= setWidth;
            inner!.style.transform = `translateX(-${scrollPositionRef.current}px)`;
          }
        }
        lastTime = time;
      } else {
        lastTime = null;
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    }

    scrollPositionRef.current = 0;
    inner.style.transform = 'translateX(0)';
    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, [initialDonations.length, numCopies, shouldScroll]);

  if (initialDonations.length === 0) {
    return (
      <div className='scrolling-donation-list flex items-center justify-center py-4'>
        <p className='text-sm text-muted-foreground'>{t('emptyState')}</p>
      </div>
    );
  }

  const donationItemSet = initialDonations.map(donation => (
    <DonationItem
      key={donation.id}
      donation={donation}
      anonymize={anonymize}
      showAmount={showAmount}
      showAvatar={showAvatar}
      showDate={showDate}
    />
  ));

  return (
    <div
      ref={containerRef}
      className='scrolling-donation-list overflow-hidden py-2'
      onMouseEnter={() => {
        hoverPausedRef.current = true;
      }}
      onMouseLeave={() => {
        hoverPausedRef.current = false;
      }}
    >
      <div
        ref={innerRef}
        className='flex'
        style={{ width: 'max-content', willChange: 'transform' }}
      >
        <div
          ref={set1Ref}
          className={`flex items-center gap-4${shouldScroll ? ' pr-4' : ''}`}
        >
          {donationItemSet}
        </div>
        {shouldScroll &&
          Array.from({ length: numCopies - 1 }, (_, i) => (
            <div key={i} aria-hidden className='flex items-center gap-4 pr-4'>
              {donationItemSet}
            </div>
          ))}
      </div>
    </div>
  );
}
