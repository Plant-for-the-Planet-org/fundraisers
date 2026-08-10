'use client';

import type { CustomGradient } from '@/lib/theme/types';
import type { BgFormValue } from './constants';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Palette } from 'lucide-react';
import { getSwatchContrast } from '@/lib/theme/color-utils';
import { cn } from '@/lib/utils/cn';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectionHeader } from '../typography';
import { defaultCustomGradient, GRADIENT_OPTIONS } from './constants';
import { GradientMaker } from './gradient-maker';
import { SolidPicker } from './solid-picker';

// The theme gradient swatches shown as circles, skipping the leading "None"
// entry (which gets its own dedicated circle here).
const THEME_GRADIENTS = GRADIENT_OPTIONS.filter(g => g.value).slice(0, 5);

function gradientCss(g: CustomGradient): string {
  return `linear-gradient(${g.angle}deg, ${g.stops
    .map(s => `${s.color} ${s.position}%`)
    .join(', ')})`;
}

const circleBase =
  'relative h-8 w-8 rounded-full border-2 overflow-hidden transition-all hover:scale-110';
// Selection borders + hover mirror the accent dots (primitives.tsx AccentDot).
const inactiveBorder = 'border-border hover:border-foreground/40';
const activeBorder = 'border-foreground shadow-md';

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
          className={cn(
            circleBase,
            'bg-background',
            isNone ? activeBorder : inactiveBorder
          )}
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
              className={cn(
                circleBase,
                g.value,
                active ? activeBorder : inactiveBorder
              )}
              // Preview the gradient over the mode base (white in light, black
              // in dark), matching how it renders on the page.
              style={{ backgroundColor: 'rgb(var(--base-rgb))' }}
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
            active ? activeBorder : inactiveBorder
          )}
          style={previewStyle}
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
            <GradientMaker gradient={gradient} onChange={onGradientChange} />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
