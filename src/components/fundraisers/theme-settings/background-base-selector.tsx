'use client';

import type { CustomGradient } from '@/lib/theme/types';
import type { BgFormValue } from './constants';

import { useState } from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import { useTranslations } from 'next-intl';
import { Palette } from 'lucide-react';
import {
  getReadableMode,
  getReadableModeForStops,
  isValidHexColor,
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
import { EyedropperButton } from './eyedropper-button';
import { GradientMaker } from './gradient-maker';

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
const inactiveBorder = 'border-border hover:border-foreground/40';

// Selected state uses the live theme accent (raw var — the Tailwind `accent`
// token bakes in the default green) with a soft halo ring so it reads clearly
// on any swatch colour.
const selectedStyle: React.CSSProperties = {
  borderColor: 'var(--accent-color)',
  boxShadow:
    '0 0 0 2px color-mix(in srgb, var(--accent-color) 30%, transparent)',
};

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
  onGradient: (value: string, mode: 'light' | 'dark') => void;
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
          style={isNone ? selectedStyle : undefined}
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
              onClick={() => onGradient(g.value, g.mode)}
              title={g.label}
              aria-label={g.label}
              aria-pressed={active}
              className={cn(circleBase, g.value, !active && inactiveBorder)}
              style={active ? selectedStyle : undefined}
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
  const contrastMode = bg.background_color
    ? getReadableMode(bg.background_color)
    : bg.custom_gradient
      ? getReadableModeForStops(bg.custom_gradient.stops.map(s => s.color))
      : null;
  const iconColor =
    contrastMode === 'dark'
      ? 'text-white'
      : contrastMode === 'light'
        ? 'text-zinc-900'
        : 'text-muted-foreground';

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
          style={active ? { ...previewStyle, ...selectedStyle } : previewStyle}
        >
          <Palette className={cn('h-4 w-4', iconColor)} aria-hidden />
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
            <GradientMaker gradient={gradient} onChange={onGradientChange} />
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
    <div className='rcp-compact flex flex-col gap-3'>
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
        <EyedropperButton onPick={onChange} className='ml-auto' />
      </div>
    </div>
  );
}
