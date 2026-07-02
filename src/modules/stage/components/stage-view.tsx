'use client';

import type React from 'react';
import type { Theme } from '@/lib/theme/types';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { StageModuleSettings } from '../settings';

import { getAccentColor } from '@/lib/theme/accent-utils';
import { getFontStack } from '@/lib/theme/font-utils';
import { useLeaderboard } from '../hooks/use-leaderboard';
import { useStageScale } from '../hooks/use-stage-scale';
import { StageCounter } from './stage-counter';
import { StageLeaderboard } from './stage-leaderboard';
import { StageQRPanel } from './stage-qr-panel';
import { StageSlidePanel } from './stage-slide-panel';
import { StageTicker } from './stage-ticker';
import { StageToastStack } from './stage-toast-stack';
import { StageTopBar } from './stage-top-bar';

interface StageViewProps {
  fundraiser: Fundraiser;
  theme: Theme;
  stageSettings: StageModuleSettings | undefined;
  locale: string;
}

export function StageView({
  fundraiser,
  theme,
  stageSettings,
  locale,
}: StageViewProps) {
  const { containerRef, scale, canvas } = useStageScale();
  const slug = fundraiser.slug ?? fundraiser.id;
  const { data: leaderboardData, offline } = useLeaderboard(slug);

  const showLeaderboard = Boolean(
    fundraiser.settings?.modules?.leaderboard?.enabled
  );
  const showImpact = stageSettings?.show_impact ?? true;
  const showProgressBar = stageSettings?.show_progress_bar ?? true;
  const slides = stageSettings?.slides ?? [];
  const stageTitle = stageSettings?.title || fundraiser.title;
  const stageDescription = stageSettings?.description;

  return (
    <div
      ref={containerRef}
      className='relative w-screen overflow-hidden'
      style={{ height: canvas.height * scale }}
    >
      <div
        style={
          {
            width: canvas.width,
            height: canvas.height,
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            left: `calc(50% - ${canvas.width / 2}px)`,
            fontFamily: getFontStack(theme.bodyFont),
            '--theme-title-font': getFontStack(theme.titleFont),
            '--accent-color': getAccentColor(theme.accent),
          } as React.CSSProperties
        }
        className='absolute top-0 overflow-hidden bg-[#0b1220] isolate'
      >
        {/* Background slide panel */}
        <StageSlidePanel slides={slides} />

        {/* Vignette overlay */}
        <div
          className='pointer-events-none absolute inset-0 z-10'
          style={{
            background:
              'radial-gradient(120% 100% at 50% 50%, transparent 60%, rgba(4,10,25,.55) 100%)',
          }}
        />

        {/* Top bar */}
        <StageTopBar
          title={stageTitle}
          description={stageDescription}
          logoUrl={stageSettings?.partner_logo_url}
          className='absolute left-12 right-12 top-12 z-20'
        />

        {/* Counter — top right */}
        <StageCounter
          fundraiser={fundraiser}
          showImpact={showImpact}
          showProgressBar={showProgressBar}
          locale={locale}
          className='absolute right-12 top-12 z-[18] w-[440px]'
        />

        {/* Leaderboard — below counter, optional */}
        {showLeaderboard && (
          <StageLeaderboard
            top={leaderboardData?.top ?? []}
            locale={locale}
            className='absolute right-12 top-[350px] z-[17] w-[440px]'
          />
        )}

        {/* QR panel — bottom left */}
        <StageQRPanel
          fundraiserId={fundraiser.id}
          slug={slug}
          className='absolute bottom-[170px] left-12 z-[18] w-[300px]'
        />

        {/* Ticker — bottom bar */}
        <StageTicker
          recent={leaderboardData?.recent ?? []}
          offline={offline}
          locale={locale}
          className='absolute bottom-12 left-12 right-12 z-[19]'
        />

        {/* Toast stack */}
        <StageToastStack />
      </div>
    </div>
  );
}
