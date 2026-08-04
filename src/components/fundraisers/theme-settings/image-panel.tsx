'use client';

import type { BgImageMode, BgImageTint } from '@/lib/theme/types';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import { SectionHeader } from '../typography';
import { DECORATION_MAX_OPACITY, IMAGE_MODES, IMAGES } from './constants';
import {
  type ColorPreset,
  DecorationColorControl,
} from './decoration-color-control';
import { AssetGrid, OpacitySlider, ThemeChipRow } from './primitives';

export function ImagePanel({
  imageUrl,
  imageMode,
  opacity,
  tint,
  color,
  accentColor,
  bgColorHex,
  onPick,
  onMode,
  onOpacity,
  onTint,
  onColor,
}: {
  imageUrl: string | null;
  imageMode: BgImageMode;
  opacity: number;
  tint: BgImageTint | undefined;
  color: string | null | undefined;
  accentColor: string;
  bgColorHex: string;
  onPick: (key: string | null) => void;
  onMode: (mode: BgImageMode) => void;
  onOpacity: (value: number) => void;
  onTint: (value: BgImageTint) => void;
  onColor: (hex: string) => void;
}) {
  const tTheme = useTranslations('Fundraisers.form.theme');
  const activeTint = tint ?? 'background';
  const customDiffers =
    !!color && color !== accentColor && color !== bgColorHex;
  const triggerHex =
    activeTint === 'none'
      ? null
      : activeTint === 'custom' && color
        ? color
        : activeTint === 'background'
          ? bgColorHex
          : accentColor;
  const pickerValue = triggerHex ?? color ?? accentColor;
  const presets: ColorPreset[] = [
    {
      label: tTheme('baseNone'),
      hex: null,
      active: activeTint === 'none',
      onSelect: () => onTint('none'),
    },
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
      <ThemeChipRow label={tTheme('labelImageMode')}>
        {IMAGE_MODES.map(mode => {
          const active = imageMode === mode;
          return (
            <button
              type='button'
              key={mode}
              onClick={() => onMode(mode)}
              className={cn(
                'px-2 py-1 rounded-md border text-xs font-semibold',
                active
                  ? 'border-foreground'
                  : 'border-border hover:border-foreground/40'
              )}
              aria-pressed={active}
            >
              {tTheme(`imageMode_${mode}`)}
            </button>
          );
        })}
      </ThemeChipRow>
      <OpacitySlider
        value={opacity}
        onChange={onOpacity}
        max={DECORATION_MAX_OPACITY}
      />
      <div>
        <div className='flex items-center justify-between'>
          <SectionHeader showDivider={false}>
            {tTheme('labelImage')}
          </SectionHeader>
          <DecorationColorControl
            label={tTheme('labelImageColor')}
            triggerHex={triggerHex}
            pickerValue={pickerValue}
            presets={presets}
            onPickCustom={onColor}
          />
        </div>
        <AssetGrid
          items={IMAGES}
          activeId={imageUrl}
          onPick={onPick}
          cols={3}
        />
      </div>
    </>
  );
}
