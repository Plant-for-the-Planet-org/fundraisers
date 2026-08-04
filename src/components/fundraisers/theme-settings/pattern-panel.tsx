'use client';

import type { BgPatternTint } from '@/lib/theme/types';

import { useTranslations } from 'next-intl';
import { SectionHeader } from '../typography';
import { DECORATION_MAX_OPACITY, PATTERNS } from './constants';
import {
  type ColorPreset,
  DecorationColorControl,
} from './decoration-color-control';
import { AssetGrid, OpacitySlider } from './primitives';

export function PatternPanel({
  patternId,
  opacity,
  tint,
  color,
  accentColor,
  bgColorHex,
  onPick,
  onOpacity,
  onTint,
  onColor,
}: {
  patternId: string | null;
  opacity: number;
  tint: BgPatternTint | undefined;
  color: string | null | undefined;
  accentColor: string;
  bgColorHex: string;
  onPick: (id: string | null) => void;
  onOpacity: (value: number) => void;
  onTint: (value: BgPatternTint) => void;
  onColor: (hex: string) => void;
}) {
  const tTheme = useTranslations('Fundraisers.form.theme');
  const activeTint = tint ?? 'accent';
  const customDiffers =
    !!color && color !== accentColor && color !== bgColorHex;
  const triggerHex =
    activeTint === 'custom' && color
      ? color
      : activeTint === 'background'
        ? bgColorHex
        : accentColor;
  const presets: ColorPreset[] = [
    {
      label: tTheme('tintAccent'),
      hex: accentColor,
      active: activeTint === 'accent',
      onSelect: () => onTint('accent'),
    },
    {
      label: tTheme('tintBackground'),
      hex: bgColorHex,
      active: activeTint === 'background',
      onSelect: () => onTint('background'),
    },
    ...(customDiffers
      ? [
          {
            label: tTheme('tintCurrent'),
            hex: color as string,
            active: activeTint === 'custom',
            onSelect: () => onColor(color as string),
          },
        ]
      : []),
  ];
  return (
    <>
      <OpacitySlider
        value={opacity}
        onChange={onOpacity}
        max={DECORATION_MAX_OPACITY}
      />
      <div>
        <div className='flex items-center justify-between'>
          <SectionHeader showDivider={false}>
            {tTheme('labelPattern')}
          </SectionHeader>
          <DecorationColorControl
            label={tTheme('labelPatternColor')}
            triggerHex={triggerHex}
            pickerValue={triggerHex}
            presets={presets}
            onPickCustom={onColor}
          />
        </div>
        <AssetGrid
          items={PATTERNS}
          activeId={patternId}
          onPick={onPick}
          cols={4}
        />
      </div>
    </>
  );
}
