'use client';

import type {
  AccentColor,
  AnimationType,
  BgDecoration,
  BgImageMode,
  BgImageTint,
  BgPatternTint,
  CustomGradient,
} from '@/lib/theme/types';

import { useTranslations } from 'next-intl';
import { ChevronDown, Palette } from 'lucide-react';
import { getAccentColor } from '@/lib/theme/accent-utils';
import { cn } from '@/lib/utils/cn';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SectionHeader } from '../typography';
import { BackgroundBaseSelector } from './background-base-selector';
import {
  ANIMATION_OPTIONS,
  type BgFormValue,
  DECORATIONS,
  IMAGE_MODES,
  IMAGES,
  LOGOS,
  PATTERNS,
} from './constants';
import {
  AccentDotRow,
  AssetGrid,
  OpacitySlider,
  ThemeChipRow,
} from './primitives';
import { SolidPicker } from './solid-picker';

// Pattern/image opacity can go to full. Mode is a deliberate toggle (not derived
// from the wash), so a strong decoration no longer risks flipping the effective
// surface luminance that text contrast relies on.
const DECORATION_MAX_OPACITY = 1;

type Props = {
  bg: BgFormValue;
  accent: string;
  colorOptions: AccentColor[];
  bgColorHex: string;
  onAccent: (accent: AccentColor) => void;
  onBackgroundOpacity: (value: number) => void;
  onSelectNone: () => void;
  onSolidColor: (hex: string) => void;
  onGradientChange: (next: CustomGradient) => void;
  onGradient: (value: string) => void;
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
};

export function BackgroundTab({
  bg,
  accent,
  colorOptions,
  bgColorHex,
  onAccent,
  onBackgroundOpacity,
  onSelectNone,
  onSolidColor,
  onGradientChange,
  onGradient,
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
}: Props) {
  // Resolved hex of the accent, used only to seed the custom-gradient default.
  const accentColor = getAccentColor(accent);
  return (
    <div className='flex flex-col gap-4'>
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
          label='Background opacity'
        />
      )}
      <AccentDotRow
        value={accent}
        colorOptions={colorOptions}
        onChange={onAccent}
        extraSwatch={{ hex: bgColorHex, label: 'Background colour' }}
      />
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
    </div>
  );
}

function AnimationRow({
  value,
  onChange,
}: {
  value: AnimationType;
  onChange: (value: AnimationType) => void;
}) {
  const tTheme = useTranslations('Fundraisers.form.theme');
  return (
    <ThemeChipRow label={tTheme('labelAnimation')}>
      {ANIMATION_OPTIONS.map(({ id, icon: AnimIcon }) => {
        const active = value === id;
        return (
          <button
            type='button'
            key={id}
            onClick={() => onChange(id)}
            aria-pressed={active}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-semibold',
              active
                ? 'border-foreground'
                : 'border-border hover:border-foreground/40'
            )}
          >
            <AnimIcon className='w-3.5 h-3.5' />
            <span>{tTheme(`animation_${id}`)}</span>
          </button>
        );
      })}
    </ThemeChipRow>
  );
}

function DecorationRow({
  value,
  onChange,
  allowLogo,
}: {
  value: BgDecoration;
  onChange: (value: BgDecoration) => void;
  allowLogo: boolean;
}) {
  const tTheme = useTranslations('Fundraisers.form.theme');
  const options = allowLogo
    ? DECORATIONS
    : DECORATIONS.filter(d => d.id !== 'logo');
  return (
    <div>
      <SectionHeader showDivider={false}>
        {tTheme('labelDecoration')}
      </SectionHeader>
      <div className='grid grid-cols-4 gap-1.5 mt-2'>
        {options.map(({ id, icon: Icon }) => {
          const active = value === id;
          return (
            <button
              type='button'
              key={id}
              onClick={() => onChange(id)}
              className={cn(
                'inline-flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-md border text-[11px] font-semibold',
                active
                  ? 'border-foreground bg-muted/30'
                  : 'border-border hover:border-foreground/40'
              )}
              aria-pressed={active}
            >
              <Icon className='w-3.5 h-3.5' />
              <span>{tTheme(`decoration_${id}`)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LogoPanel({
  logoId,
  opacity,
  onPick,
  onOpacity,
}: {
  logoId: string | null;
  opacity: number;
  onPick: (id: string | null) => void;
  onOpacity: (value: number) => void;
}) {
  const tTheme = useTranslations('Fundraisers.form.theme');
  return (
    <>
      <OpacitySlider value={opacity} onChange={onOpacity} />
      <div>
        <SectionHeader showDivider={false}>{tTheme('labelLogo')}</SectionHeader>
        <div className='grid grid-cols-6 gap-1.5 mt-2'>
          {LOGOS.map(logo => {
            const active = logoId === logo.id;
            return (
              <button
                type='button'
                key={logo.id}
                onClick={() => onPick(active ? null : logo.id)}
                title={logo.label}
                aria-label={logo.label}
                aria-pressed={active}
                className={cn(
                  'h-12 rounded-md overflow-hidden border bg-white p-2 flex items-center justify-center',
                  active
                    ? 'border-foreground ring-2 ring-foreground/30'
                    : 'border-border hover:border-foreground/40'
                )}
              >
                <img
                  src={logo.src}
                  alt={logo.label}
                  className='max-w-full max-h-full object-contain'
                />
              </button>
            );
          })}
        </div>
        <p className='mt-3 text-[11px] text-muted-foreground leading-relaxed'>
          {tTheme.rich('logoContact', {
            mail: chunks => (
              <a
                href='mailto:info@plant-for-the-planet.org'
                className='underline'
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </div>
    </>
  );
}

// Swatch used in the decoration colour controls. A null hex renders an empty
// circle for the "None" option.
function ColorSwatch({
  hex,
  sizeClass,
  active,
}: {
  hex: string | null;
  sizeClass: string;
  active?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-block rounded-full border-2',
        active ? 'border-foreground' : 'border-foreground/30',
        sizeClass
      )}
      style={hex ? { backgroundColor: hex } : undefined}
      aria-hidden
    />
  );
}

type ColorPreset = {
  label: string;
  hex: string | null;
  active: boolean;
  onSelect: () => void;
};

// Shared decoration colour picker (patterns + images): a palette pill on the
// right of the decoration header that opens the solid picker. The preset row
// (Accent / Background / Current, plus None for images) replaces the generic
// quick picks; dragging or typing a colour switches to a custom tint.
function DecorationColorControl({
  label,
  triggerHex,
  pickerValue,
  presets,
  onPickCustom,
}: {
  label: string;
  triggerHex: string | null;
  pickerValue: string;
  presets: ColorPreset[];
  onPickCustom: (hex: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type='button'
          aria-label={label}
          title={label}
          className='inline-flex items-center gap-1.5 h-7 px-2 rounded-md border-2 border-foreground/30 bg-transparent hover:border-foreground/60'
        >
          <Palette className='w-3.5 h-3.5 text-foreground/30' aria-hidden />
          <ColorSwatch hex={triggerHex} sizeClass='h-3.5 w-3.5' />
          <ChevronDown className='w-3.5 h-3.5 text-foreground/30' aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-auto'>
        <SolidPicker
          value={pickerValue}
          onChange={onPickCustom}
          presets={
            <div>
              <div className='mb-1.5 text-[11px] font-semibold text-muted-foreground'>
                {label}
              </div>
              <div className='flex gap-3'>
                {presets.map(preset => (
                  <button
                    type='button'
                    key={preset.label}
                    onClick={preset.onSelect}
                    aria-pressed={preset.active}
                    className='flex flex-col items-center gap-1'
                  >
                    <ColorSwatch
                      hex={preset.hex}
                      sizeClass='h-7 w-7'
                      active={preset.active}
                    />
                    <span className='text-[10px] text-muted-foreground'>
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          }
        />
      </PopoverContent>
    </Popover>
  );
}

function PatternPanel({
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
      label: 'Accent',
      hex: accentColor,
      active: activeTint === 'accent',
      onSelect: () => onTint('accent'),
    },
    {
      label: 'Background',
      hex: bgColorHex,
      active: activeTint === 'background',
      onSelect: () => onTint('background'),
    },
    ...(customDiffers
      ? [
          {
            label: 'Current',
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
            label='Pattern colour'
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

function ImagePanel({
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
      label: 'None',
      hex: null,
      active: activeTint === 'none',
      onSelect: () => onTint('none'),
    },
    {
      label: 'Accent',
      hex: accentColor,
      active: activeTint === 'accent',
      onSelect: () => onTint('accent'),
    },
    {
      label: 'Background',
      hex: bgColorHex,
      active: activeTint === 'background',
      onSelect: () => onTint('background'),
    },
    ...(customDiffers
      ? [
          {
            label: 'Current',
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
            label='Image colour'
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
