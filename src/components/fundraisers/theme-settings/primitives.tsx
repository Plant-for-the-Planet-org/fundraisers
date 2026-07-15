'use client';

import type { FontId } from '@/lib/theme/types';

import { useTranslations } from 'next-intl';
import { type BG_LIBRARY, DEFAULT_PATTERN_TILE } from '@/lib/theme/backgrounds';
import { cn } from '@/lib/utils/cn';
import { SectionHeader } from '../typography';
import { FONT_OPTIONS } from './constants';

export function ThemeChipRow({
  label,
  children,
  ...rest
}: {
  label: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div>
      <SectionHeader showDivider={false}>{label}</SectionHeader>
      <div className='flex flex-wrap gap-2 mt-2' role='group' {...rest}>
        {children}
      </div>
    </div>
  );
}

export function FontChipRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: FontId;
  onChange: (font: FontId) => void;
}) {
  return (
    <ThemeChipRow label={label} role='radiogroup'>
      {FONT_OPTIONS.map(font => {
        const active = value === font.id;
        return (
          <button
            type='button'
            key={font.id}
            role='radio'
            aria-checked={active}
            onClick={() => onChange(font.id)}
            title={font.id}
            className={cn(
              'inline-flex items-center justify-center w-9 h-8 rounded-md border text-foreground font-semibold',
              active
                ? 'border-foreground'
                : 'border-border hover:border-foreground/40'
            )}
            style={{ fontFamily: font.family }}
          >
            Aa
          </button>
        );
      })}
    </ThemeChipRow>
  );
}

export function OpacitySlider({
  value,
  onChange,
  max = 1,
}: {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}) {
  const tTheme = useTranslations('Fundraisers.form.theme');
  return (
    <div>
      <div className='flex items-center justify-between'>
        <SectionHeader showDivider={false}>
          {tTheme('labelOpacity')}
        </SectionHeader>
        <span className='text-xs tabular-nums text-muted-foreground'>
          {Math.round(value * 100)}%
        </span>
      </div>
      <input
        type='range'
        min={0.05}
        max={max}
        step={0.05}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className='w-full accent-foreground mt-1'
        aria-label={tTheme('labelOpacity')}
      />
    </div>
  );
}

// Zoom for a full-bleed pattern thumbnail: the picker cell is tiny (~80×53px),
// so we show a magnified, representative crop rather than the whole 1440px
// artwork shrunk into it. Higher = more zoomed in. Tunable; per-asset overrides
// can follow.
const THUMB_MASK_SIZE = '600%';

export function AssetGrid({
  items,
  activeId,
  onPick,
  cols,
}: {
  items: (typeof BG_LIBRARY)[number][];
  activeId: string | null;
  onPick: (id: string | null) => void;
  cols: 3 | 4;
}) {
  return (
    <div
      className={cn(
        'grid gap-1.5 mt-2',
        cols === 4 ? 'grid-cols-4' : 'grid-cols-3'
      )}
    >
      {items.map(b => {
        const active = activeId === b.id;
        // Masked patterns preview through the same stencil as the live render:
        // foreground shapes on a muted cell, legible in both light and dark.
        const maskUrl = b.masked ? `url("${b.src}")` : null;
        const maskTileSize = b.fullBleed
          ? (b.thumbMaskSize ?? THUMB_MASK_SIZE)
          : (b.tileSize ?? DEFAULT_PATTERN_TILE);
        return (
          <button
            type='button'
            key={b.id}
            onClick={() => onPick(active ? null : b.id)}
            title={b.label}
            aria-pressed={active}
            className={cn(
              'relative aspect-[3/2] rounded-md overflow-hidden border',
              active
                ? 'border-foreground ring-2 ring-foreground/30'
                : 'border-border hover:border-foreground/40'
            )}
          >
            {maskUrl ? (
              <span className='absolute inset-0 bg-muted' aria-hidden>
                <span
                  className='absolute inset-0 bg-foreground'
                  style={{
                    WebkitMaskImage: maskUrl,
                    maskImage: maskUrl,
                    WebkitMaskRepeat: b.fullBleed ? 'no-repeat' : 'repeat',
                    maskRepeat: b.fullBleed ? 'no-repeat' : 'repeat',
                    WebkitMaskSize: maskTileSize,
                    maskSize: maskTileSize,
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                  }}
                />
              </span>
            ) : (
              <img
                src={b.thumb ?? b.src}
                alt={b.label}
                className='block w-full h-full object-cover'
              />
            )}
            {b.type === 'video' && (
              <span className='absolute top-1 right-1 text-[8px] font-bold tracking-wider px-1 py-0.5 rounded bg-black/55 text-white uppercase'>
                ● Loop
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
