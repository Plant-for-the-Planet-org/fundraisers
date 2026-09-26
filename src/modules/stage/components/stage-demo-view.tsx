'use client';

import type React from 'react';
import type { StageSlide } from '../settings';

import { useLayoutEffect, useRef, useState } from 'react';
import { useStageDemo } from '../hooks/use-stage-demo';
import { StageCounterView } from './stage-counter';
import { StageLeaderboard } from './stage-leaderboard';
import { StageQRPanel } from './stage-qr-panel';
import { StageSlidePanel } from './stage-slide-panel';
import { StageTicker } from './stage-ticker';
import { StageTopBar } from './stage-top-bar';

const DEFAULT_CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

export interface StageDemoViewProps {
  title: string;
  description?: string;
  locale: string;
  slides: StageSlide[];
  currency: string;
  goal: number;
  startRaised: number;
  donors: string[];
  /** Where the QR code sends people. Defaults to the home page. */
  qrTargetPath?: string;
  /** Short URL shown under the QR code, display only. */
  qrDisplayUrl: string;
  /** Emoji shown next to the Planet logo, in place of a partner logo. */
  logoEmoji?: string;
  accentColor?: string;
  /** Canvas width in px at a fixed 1080 height. 1920 is the 16:9 TV layout; 1440 gives a 4:3 box. */
  canvasWidth?: number;
  className?: string;
}

// The stage layout at 1920x1080, scaled to whatever box it is placed in, fed by sample donations instead of the API.
export function StageDemoView({
  title,
  description,
  locale,
  slides,
  currency,
  goal,
  startRaised,
  donors,
  qrTargetPath = '/',
  qrDisplayUrl,
  logoEmoji,
  accentColor,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  className,
}: StageDemoViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);
  const demo = useStageDemo(donors, currency, startRaised);
  const top = [...demo.recent].sort((a, b) => b.amount - a.amount).slice(0, 3);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / canvasWidth);
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [canvasWidth]);

  return (
    <div
      ref={containerRef}
      // Sample slides and donors, so search engines should not quote them.
      data-nosnippet
      className={`relative w-full overflow-hidden rounded-3xl ${className ?? ''}`}
      style={{ height: CANVAS_HEIGHT * scale }}
    >
      <div
        style={
          {
            width: canvasWidth,
            height: CANVAS_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            ...(accentColor ? { '--accent-color': accentColor } : {}),
          } as React.CSSProperties
        }
        className='absolute left-0 top-0 overflow-hidden bg-[#0b1220] isolate'
      >
        <StageSlidePanel slides={slides} titleAs='p' />
        <div
          className='pointer-events-none absolute inset-0 z-10'
          style={{
            background:
              'radial-gradient(120% 100% at 50% 50%, transparent 60%, rgba(4,10,25,.55) 100%)',
          }}
        />
        <StageTopBar
          title={title}
          description={description}
          logoEmoji={logoEmoji}
          className='absolute left-12 right-12 top-12 z-20'
        />
        <StageCounterView
          raised={demo.raised}
          currency={currency}
          goal={goal}
          donationCount={demo.donationCount}
          trees={0}
          restoredM2={0}
          showDaysLeft={false}
          showImpactStat={false}
          showProgressBar
          highlight='funding'
          locale={locale}
          className='absolute right-12 top-12 z-[18] w-[440px]'
        />
        <StageLeaderboard
          top={top}
          locale={locale}
          className='absolute right-12 top-[350px] z-[17] w-[440px]'
        />
        <StageQRPanel
          slug='demo'
          targetPath={qrTargetPath}
          displayUrl={qrDisplayUrl}
          className='absolute bottom-[170px] left-12 z-[18] w-[300px]'
        />
        <StageTicker
          recent={demo.recent}
          offline={false}
          locale={locale}
          className='absolute bottom-12 left-12 right-12 z-[19]'
        />
      </div>
    </div>
  );
}
