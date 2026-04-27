'use client';

import type React from 'react';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { Theme } from '@/lib/theme/types';
import { getFontStack } from '@/lib/theme/font-utils';
import { getAccentColor } from '@/lib/theme/accent-utils';
import { useStageScale } from './hooks/use-stage-scale';
import { useLeaderboard } from './hooks/use-leaderboard';
import { StageTopBar } from './stage-top-bar';
import { StageSlidePanel } from './stage-slide-panel';
import { StageCounter } from './stage-counter';
import { StageQRPanel } from './stage-qr-panel';
import { StageTicker } from './stage-ticker';
import { StageToastStack } from './stage-toast-stack';
import { StageLeaderboard } from './stage-leaderboard';

interface StageViewProps {
  fundraiser: Fundraiser;
  theme: Theme;
  stageSettings: Record<string, unknown> | undefined;
}

export function StageView({ fundraiser, theme, stageSettings }: StageViewProps) {
  const { containerRef, scale, canvas } = useStageScale();
  const slug = fundraiser.slug ?? fundraiser.id;
  const { data: leaderboardData, offline } = useLeaderboard(slug);

  const leaderboardSettings = (
    fundraiser.settings?.modules as Record<string, unknown> | undefined
  )?.leaderboard as Record<string, unknown> | undefined;
  const showLeaderboard = Boolean(leaderboardSettings?.enabled);
  const showImpact = Boolean(stageSettings?.show_impact ?? true);
  const showProgressBar = Boolean(stageSettings?.show_progress_bar ?? true);
  const slides = (stageSettings?.slides as unknown[]) ?? [];
  const stageTitle = (stageSettings?.title as string | undefined) || fundraiser.title;
  const stageDescription = stageSettings?.description as string | undefined;

  return (
    <div
      ref={containerRef}
      className="relative w-screen overflow-hidden"
      style={{ height: canvas.height * scale }}
    >
      <div
        style={{
          width: canvas.width,
          height: canvas.height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          fontFamily: getFontStack(theme.bodyFont),
          '--theme-title-font': getFontStack(theme.titleFont),
          '--accent-color': getAccentColor(theme.accent),
        } as React.CSSProperties}
        className="absolute top-0 left-0 overflow-hidden bg-[#0b1220] isolate"
      >
        {/* Background slide panel */}
        <StageSlidePanel slides={slides} />

        {/* Vignette overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              'radial-gradient(120% 100% at 50% 50%, transparent 60%, rgba(4,10,25,.55) 100%)',
          }}
        />

        {/* Top bar */}
        <StageTopBar
          title={stageTitle}
          description={stageDescription}
          logoUrl={stageSettings?.partner_logo_url as string | undefined}
        />

        {/* Counter — top right */}
        <StageCounter
          fundraiser={fundraiser}
          showImpact={showImpact}
          showProgressBar={showProgressBar}
        />

        {/* Leaderboard — below counter, optional */}
        {showLeaderboard && (
          <StageLeaderboard top={leaderboardData?.top ?? []} />
        )}

        {/* QR panel — bottom left */}
        <StageQRPanel fundraiserId={fundraiser.id} />

        {/* Ticker — bottom bar */}
        <StageTicker recent={leaderboardData?.recent ?? []} offline={offline} />

        {/* Toast stack */}
        <StageToastStack />
      </div>
    </div>
  );
}
