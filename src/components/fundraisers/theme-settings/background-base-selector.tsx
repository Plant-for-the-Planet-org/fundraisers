'use client';

import type { CustomGradient } from '@/lib/theme/types';
import type { BgFormValue } from './constants';

import { useState } from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import { useTranslations } from 'next-intl';
import { Palette } from 'lucide-react';
import {
  getSwatchContrast,
  isValidHexColor,
  swatchSelectedStyle,
} from '@/lib/theme/color-utils';
import { cn } from '@/lib/utils/cn';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectionHeader } from '../typography';
import {
  DEFAULT_SOLID_COLOR,
  defaultCustomGradient,
  GRADIENT_OPTIONS,
  QUICK_PICK_COLORS,
} from './constants';

// The theme gradient swatches shown as circles, skipping the leading "None"
// entry (which gets its own dedicated circle here).
const THEME_GRADIENTS = GRADIENT_OPTIONS.filter(g => g.value).slice(0, 5);

// Only commit a complete 6-digit hex; a 3-digit value would snap mid-type.
function normalizeHex(input: string): string | null {
  const hex = (input.startsWith('#') ? input : `#${input}`).toLowerCase();
  return isValidHexColor(hex) ? hex : null;
}

function gradientCss(g: CustomGradient): string {
  return `linear-gradient(${g.angle}deg, ${g.stops
    .map(s => `${s.color} ${s.position}%`)
    .join(', ')})`;
}

const circleBase =
  'relative h-9 w-9 rounded-full border-2 overflow-hidden transition-colors';
const inactiveBorder = 'border-foreground/30 hover:border-foreground/60';

export function BackgroundBaseSelector({
  bg,
  accentColor,
  onSelectNone,
  onSolidColor,
  onGradientChange,
  onGradient,
}: {
  bg: BgFormValue;
  accentColor: string;
  onSelectNone: () => void;
  onSolidColor: (hex: string) => void;
  onGradientChange: (next: CustomGradient) => void;
  onGradient: (value: string) => void;
}) {
  const tTheme = useTranslations('Fundraisers.form.theme');

  const isNone = !bg.background_color && !bg.custom_gradient && !bg.gradient;
  const isCustom = Boolean(bg.background_color || bg.custom_gradient);

  return (
    <div>
      <SectionHeader showDivider={false}>
        {tTheme('labelBackgroundColor')}
      </SectionHeader>

      <div className='mt-2 flex flex-wrap items-center gap-2'>
        {/* None */}
        <button
          type='button'
          onClick={onSelectNone}
          title={tTheme('baseNone')}
          aria-label={tTheme('baseNone')}
          aria-pressed={isNone}
          className={cn(circleBase, 'bg-background', !isNone && inactiveBorder)}
          style={isNone ? swatchSelectedStyle : undefined}
        >
          <svg
            viewBox='0 0 24 24'
            className='absolute inset-0 h-full w-full text-muted-foreground'
            preserveAspectRatio='none'
            aria-hidden
          >
            <line
              x1='4'
              y1='20'
              x2='20'
              y2='4'
              stroke='currentColor'
              strokeWidth='1.5'
            />
          </svg>
        </button>

        {/* Theme gradient presets */}
        {THEME_GRADIENTS.map(g => {
          const active = bg.gradient === g.value;
          return (
            <button
              type='button'
              key={g.id}
              onClick={() => onGradient(g.value)}
              title={g.label}
              aria-label={g.label}
              aria-pressed={active}
              className={cn(circleBase, g.value, !active && inactiveBorder)}
              style={{
                // Preview the gradient over the mode base (white in light, black
                // in dark), matching how it renders on the page.
                backgroundColor: 'rgb(var(--base-rgb))',
                ...(active ? swatchSelectedStyle : {}),
              }}
            />
          );
        })}

        {/* Custom (solid / gradient) */}
        <CustomColorButton
          bg={bg}
          accentColor={accentColor}
          active={isCustom}
          onSolidColor={onSolidColor}
          onGradientChange={onGradientChange}
        />
      </div>
    </div>
  );
}

function CustomColorButton({
  bg,
  accentColor,
  active,
  onSolidColor,
  onGradientChange,
}: {
  bg: BgFormValue;
  accentColor: string;
  active: boolean;
  onSolidColor: (hex: string) => void;
  onGradientChange: (next: CustomGradient) => void;
}) {
  const tTheme = useTranslations('Fundraisers.form.theme');
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'solid' | 'gradient'>(
    bg.custom_gradient && !bg.background_color ? 'gradient' : 'solid'
  );

  const gradient = bg.custom_gradient ?? defaultCustomGradient(accentColor);

  const previewStyle: React.CSSProperties | undefined = bg.background_color
    ? { backgroundColor: bg.background_color }
    : bg.custom_gradient
      ? { backgroundImage: gradientCss(bg.custom_gradient) }
      : undefined;

  // The palette icon always sits on top of the chosen colour; flip it light or
  // dark to stay legible against whatever solid / gradient is behind it.
  const { iconClass } = getSwatchContrast(
    bg.background_color,
    bg.custom_gradient?.stops.map(s => s.color)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type='button'
          title={tTheme('baseCustom')}
          aria-label={tTheme('baseCustom')}
          aria-pressed={active}
          className={cn(
            circleBase,
            'flex items-center justify-center',
            !active && inactiveBorder
          )}
          style={
            active ? { ...previewStyle, ...swatchSelectedStyle } : previewStyle
          }
        >
          <Palette className={cn('h-4 w-4', iconClass)} aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-auto'>
        <Tabs
          value={tab}
          onValueChange={value => setTab(value as 'solid' | 'gradient')}
        >
          <TabsList className='w-full'>
            <TabsTrigger value='solid'>{tTheme('baseSolid')}</TabsTrigger>
            <TabsTrigger value='gradient'>{tTheme('baseGradient')}</TabsTrigger>
          </TabsList>
          <TabsContent value='solid'>
            <SolidPicker value={bg.background_color} onChange={onSolidColor} />
          </TabsContent>
          <TabsContent value='gradient'>
            <GradientEditor gradient={gradient} onChange={onGradientChange} />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

function SolidPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (hex: string) => void;
}) {
  const tTheme = useTranslations('Fundraisers.form.theme');
  const current = value ?? DEFAULT_SOLID_COLOR;

  const commit = (input: string) => {
    const hex = normalizeHex(input);
    if (hex) onChange(hex);
  };

  return (
    <div className='flex flex-col gap-3'>
      <HexColorPicker color={current} onChange={commit} />
      <div>
        <div className='mb-1.5 text-[11px] font-semibold text-muted-foreground'>
          {tTheme('quickPicks')}
        </div>
        <div className='grid grid-cols-5 gap-1.5'>
          {QUICK_PICK_COLORS.map(hex => (
            <button
              key={hex}
              type='button'
              onClick={() => onChange(hex)}
              title={hex}
              aria-label={hex}
              className='aspect-square rounded-[5px] border border-border transition-transform hover:scale-110'
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
      </div>
      <div className='flex items-center gap-1'>
        <span className='text-xs font-semibold text-muted-foreground'>#</span>
        <HexColorInput
          color={value ?? ''}
          onChange={commit}
          placeholder='RRGGBB'
          className='w-24 rounded-md border border-border bg-background px-2 py-1 text-xs uppercase'
        />
      </div>
    </div>
  );
}

// Editing happens against one selected stop at a time, so the picker lives
// inline here rather than in a nested Popover (a Popover inside this Popover
// dismisses the parent on open).
function GradientEditor({
  gradient,
  onChange,
}: {
  gradient: CustomGradient;
  onChange: (next: CustomGradient) => void;
}) {
  const tTheme = useTranslations('Fundraisers.form.theme');
  const [active, setActive] = useState(0);

  const patchStop = (
    index: number,
    patch: Partial<CustomGradient['stops'][number]>
  ) =>
    onChange({
      ...gradient,
      stops: gradient.stops.map((s, i) =>
        i === index ? { ...s, ...patch } : s
      ),
    });

  const activeStop = gradient.stops[active] ?? gradient.stops[0];
  const commit = (input: string) => {
    const hex = normalizeHex(input);
    if (hex) patchStop(active, { color: hex });
  };

  return (
    <div className='flex w-56 flex-col gap-3'>
      <div className='flex gap-2'>
        {gradient.stops.slice(0, 2).map((stop, i) => {
          const label = tTheme(i === 0 ? 'gradientStart' : 'gradientEnd');
          const selected = active === i;
          return (
            <button
              key={i}
              type='button'
              onClick={() => setActive(i)}
              aria-pressed={selected}
              className={cn(
                'flex flex-1 items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold',
                selected
                  ? 'border-foreground'
                  : 'border-border hover:border-foreground/40'
              )}
            >
              <span
                className='h-4 w-4 rounded-sm border border-border/60'
                style={{ backgroundColor: stop.color }}
              />
              {label}
            </button>
          );
        })}
      </div>

      <HexColorPicker color={activeStop.color} onChange={commit} />

      <div className='flex items-center gap-2'>
        <span className='text-xs font-semibold text-muted-foreground'>#</span>
        <HexColorInput
          color={activeStop.color}
          onChange={commit}
          placeholder='RRGGBB'
          className='w-20 rounded-md border border-border bg-background px-2 py-1 text-xs uppercase'
        />
        <span className='flex-1' />
        <input
          type='number'
          min={0}
          max={100}
          value={activeStop.position}
          onChange={e =>
            patchStop(active, { position: clampPercent(e.target.value) })
          }
          aria-label={tTheme(active === 0 ? 'gradientStart' : 'gradientEnd')}
          className='h-8 w-14 rounded-md border border-border bg-background px-2 text-right text-xs'
        />
        <span className='text-xs text-muted-foreground'>%</span>
      </div>

      <div
        className='h-8 rounded-md border border-border'
        style={{ backgroundImage: gradientCss(gradient) }}
      />
    </div>
  );
}

function clampPercent(raw: string): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}
