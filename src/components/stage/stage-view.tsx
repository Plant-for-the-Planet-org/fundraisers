'use client';

import type React from 'react';
import type { Theme } from '@/lib/theme/types';
import type {
  Fundraiser,
  StageModuleSettings,
} from '@/lib/types/fundraiser';

import { getAccentColor } from '@/lib/theme/accent-utils';
import { getFontStack } from '@/lib/theme/font-utils';
import { useLeaderboard } from './hooks/use-leaderboard';
import { useStageScale } from './hooks/use-stage-scale';
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
            transformOrigin: 'top left',
            fontFamily: getFontStack(theme.bodyFont),
            '--theme-title-font': getFontStack(theme.titleFont),
            '--accent-color': getAccentColor(theme.accent),
          } as React.CSSProperties
        }
        className='absolute top-0 left-0 overflow-hidden bg-[#0b1220] isolate'
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
        />

        {/* Counter — top right */}
        <StageCounter
          fundraiser={fundraiser}
          showImpact={showImpact}
          showProgressBar={showProgressBar}
          locale={locale}
        />

        {/* Leaderboard — below counter, optional */}
        {showLeaderboard && (
          <StageLeaderboard top={leaderboardData?.top ?? []} locale={locale} />
        )}

        {/* QR panel — bottom left */}
        <StageQRPanel fundraiserId={fundraiser.id} slug={slug} />

        {/* Ticker — bottom bar */}
        <StageTicker
          recent={leaderboardData?.recent ?? []}
          offline={offline}
          locale={locale}
        />

        {/* Toast stack */}
        <StageToastStack />
      </div>
    </div>
  );
}
