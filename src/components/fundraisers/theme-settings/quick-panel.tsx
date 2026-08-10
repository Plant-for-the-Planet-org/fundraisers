'use client';

import type { AccentColor, CustomGradient, FontId } from '@/lib/theme/types';
import type { BgFormValue } from './constants';

import { useTranslations } from 'next-intl';
import { getAccentColor } from '@/lib/theme/accent-utils';
import { BackgroundBaseSelector } from './background-base-selector';
import { AccentDotRow, FontChipRow, OpacitySlider } from './primitives';

// Quick tab: the background wash (colour/gradient) + its opacity, the accent,
// and the title/body fonts.
export function QuickPanel({
  bg,
  accent,
  colorOptions,
  bgColorHex,
  titleFont,
  bodyFont,
  onAccent,
  onBackgroundOpacity,
  onSelectNone,
  onSolidColor,
  onGradientChange,
  onGradient,
  onTitleFont,
  onBodyFont,
}: {
  bg: BgFormValue;
  accent: string;
  colorOptions: AccentColor[];
  bgColorHex: string;
  titleFont: FontId;
  bodyFont: FontId;
  onAccent: (accent: AccentColor) => void;
  onBackgroundOpacity: (value: number) => void;
  onSelectNone: () => void;
  onSolidColor: (hex: string) => void;
  onGradientChange: (next: CustomGradient) => void;
  onGradient: (value: string) => void;
  onTitleFont: (font: FontId) => void;
  onBodyFont: (font: FontId) => void;
}) {
  const tTheme = useTranslations('Fundraisers.form.theme');
  // Resolved hex of the accent, used only to seed the custom-gradient default.
  const accentColor = getAccentColor(accent);
  return (
    <>
      <BackgroundBaseSelector
        bg={bg}
        accentColor={accentColor}
        onSelectNone={onSelectNone}
        onSolidColor={onSolidColor}
        onGradientChange={onGradientChange}
        onGradient={onGradient}
      />
      {/* Only the user solid/custom-gradient wash is opacity-controlled; preset
          gradient classes render at their authored alpha, so no slider for them. */}
      {(bg.background_color || bg.custom_gradient) && (
        <OpacitySlider
          value={bg.background_opacity ?? 0.14}
          onChange={onBackgroundOpacity}
          label={tTheme('labelBackgroundOpacity')}
        />
      )}
      <AccentDotRow
        value={accent}
        colorOptions={colorOptions}
        onChange={onAccent}
        bgColorHex={bgColorHex}
      />
      <FontChipRow
        label={tTheme('labelTitleFont')}
        value={titleFont}
        onChange={onTitleFont}
      />
      <FontChipRow
        label={tTheme('labelBodyFont')}
        value={bodyFont}
        onChange={onBodyFont}
      />
    </>
  );
}
