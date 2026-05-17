'use client';

import type { BG_LIBRARY } from '@/lib/theme/backgrounds';
import type { FontId } from '@/lib/theme/types';

import { useTranslations } from 'next-intl';
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
    <ThemeChipRow label={label}>
      {FONT_OPTIONS.map(font => {
        const active = value === font.id;
        return (
          <button
            type='button'
            key={font.id}
            onClick={() => onChange(font.id)}
            title={font.id}
            className={cn(
              'inline-flex items-center justify-center w-9 h-8 rounded-md border text-base',
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
}: {
  value: number;
  onChange: (value: number) => void;
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
        max={1}
        step={0.05}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className='w-full accent-foreground mt-1'
        aria-label={tTheme('labelOpacity')}
      />
    </div>
  );
}

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
        return (
          <button
            type='button'
            key={b.id}
            onClick={() => onPick(active ? null : b.id)}
            title={b.label}
            className={cn(
              'relative aspect-[3/2] rounded-md overflow-hidden border',
              active
                ? 'border-foreground ring-2 ring-foreground/30'
                : 'border-border hover:border-foreground/40'
            )}
          >
            <img
              src={b.thumb}
              alt={b.label}
              className='block w-full h-full object-cover'
            />
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
