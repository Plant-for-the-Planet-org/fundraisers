'use client';

import type {
  AnimationType,
  BgDecoration,
  BgImageMode,
  BgImageTint,
  BgPatternTint,
} from '@/lib/theme/types';
import type { BgFormValue } from './constants';

import { getAccentColor } from '@/lib/theme/accent-utils';
import { ImagePanel } from './image-panel';
import { LogoPanel } from './logo-panel';
import { PatternPanel } from './pattern-panel';
import { AnimationRow, DecorationRow } from './primitives';

// Advanced tab: decoration (pattern/image/logo), its per-decoration controls,
// and the animation.
export function AdvancedPanel({
  bg,
  accent,
  bgColorHex,
  onDecoration,
  onPatternId,
  onImageUrl,
  onImageMode,
  onLogoId,
  onOpacity,
  onAnimation,
  onImageTint,
  onImageColor,
  onPatternTint,
  onPatternColor,
  allowLogo,
}: {
  bg: BgFormValue;
  accent: string;
  bgColorHex: string;
  onDecoration: (value: BgDecoration) => void;
  onPatternId: (id: string | null) => void;
  onImageUrl: (url: string | null) => void;
  onImageMode: (mode: BgImageMode) => void;
  onLogoId: (id: string | null) => void;
  onOpacity: (value: number) => void;
  onAnimation: (value: AnimationType) => void;
  onImageTint: (value: BgImageTint) => void;
  onImageColor: (hex: string) => void;
  onPatternTint: (value: BgPatternTint) => void;
  onPatternColor: (hex: string) => void;
  allowLogo: boolean;
}) {
  const accentColor = getAccentColor(accent);
  return (
    <>
      <DecorationRow
        value={bg.decoration}
        onChange={onDecoration}
        allowLogo={allowLogo}
      />

      {bg.decoration === 'pattern' && (
        <PatternPanel
          patternId={bg.pattern_id}
          opacity={bg.opacity}
          tint={bg.pattern_tint}
          color={bg.pattern_color}
          accentColor={accentColor}
          bgColorHex={bgColorHex}
          onPick={onPatternId}
          onOpacity={onOpacity}
          onTint={onPatternTint}
          onColor={onPatternColor}
        />
      )}
      {bg.decoration === 'image' && (
        <ImagePanel
          imageUrl={bg.image_url}
          imageMode={bg.image_mode}
          opacity={bg.opacity}
          tint={bg.image_tint}
          color={bg.image_color}
          accentColor={accentColor}
          bgColorHex={bgColorHex}
          onPick={onImageUrl}
          onMode={onImageMode}
          onOpacity={onOpacity}
          onTint={onImageTint}
          onColor={onImageColor}
        />
      )}
      {bg.decoration === 'logo' && allowLogo && (
        <LogoPanel
          logoId={bg.logo_id}
          opacity={bg.opacity}
          onPick={onLogoId}
          onOpacity={onOpacity}
        />
      )}

      <AnimationRow value={bg.animation} onChange={onAnimation} />
    </>
  );
}
