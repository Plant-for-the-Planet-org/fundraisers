'use client';

import type {
  AnimationType,
  BgDecoration,
  BgImageMode,
  BgImageTint,
  BgPatternTint,
  CustomGradient,
} from '@/lib/theme/types';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import { SectionHeader } from '../typography';
import { BackgroundBaseSelector } from './background-base-selector';
import {
  ANIMATION_OPTIONS,
  type BgFormValue,
  DECORATIONS,
  IMAGE_MODES,
  IMAGE_TINTS,
  IMAGES,
  LOGOS,
  PATTERN_TINTS,
  PATTERNS,
} from './constants';
import { AssetGrid, OpacitySlider, ThemeChipRow } from './primitives';

// Pattern/image opacity can go to full. Mode is a deliberate toggle (not derived
// from the wash), so a strong decoration no longer risks flipping the effective
// surface luminance that text contrast relies on.
const DECORATION_MAX_OPACITY = 1;

type Props = {
  bg: BgFormValue;
  accentColor: string;
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
  onPatternTint: (value: BgPatternTint) => void;
  allowLogo: boolean;
};

export function BackgroundTab({
  bg,
  accentColor,
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
  onPatternTint,
  allowLogo,
}: Props) {
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
          onPick={onPatternId}
          onOpacity={onOpacity}
          onTint={onPatternTint}
        />
      )}
      {bg.decoration === 'image' && (
        <ImagePanel
          imageUrl={bg.image_url}
          imageMode={bg.image_mode}
          opacity={bg.opacity}
          tint={bg.image_tint}
          onPick={onImageUrl}
          onMode={onImageMode}
          onOpacity={onOpacity}
          onTint={onImageTint}
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

// Chip row for a decoration tint choice (image or pattern). English-only
// labels for now — POC exploratory controls.
function TintRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<{ id: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <ThemeChipRow label={label}>
      {options.map(({ id, label: optionLabel }) => {
        const active = value === id;
        return (
          <button
            type='button'
            key={id}
            onClick={() => onChange(id)}
            aria-pressed={active}
            className={cn(
              'px-2 py-1 rounded-md border text-xs font-semibold',
              active
                ? 'border-foreground'
                : 'border-border hover:border-foreground/40'
            )}
          >
            {optionLabel}
          </button>
        );
      })}
    </ThemeChipRow>
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

function PatternPanel({
  patternId,
  opacity,
  tint,
  onPick,
  onOpacity,
  onTint,
}: {
  patternId: string | null;
  opacity: number;
  tint: BgPatternTint | undefined;
  onPick: (id: string | null) => void;
  onOpacity: (value: number) => void;
  onTint: (value: BgPatternTint) => void;
}) {
  const tTheme = useTranslations('Fundraisers.form.theme');
  return (
    <>
      <OpacitySlider
        value={opacity}
        onChange={onOpacity}
        max={DECORATION_MAX_OPACITY}
      />
      <TintRow
        label='Pattern colour'
        options={PATTERN_TINTS}
        value={tint ?? 'accent'}
        onChange={onTint}
      />
      <div>
        <SectionHeader showDivider={false}>
          {tTheme('labelPattern')}
        </SectionHeader>
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
  onPick,
  onMode,
  onOpacity,
  onTint,
}: {
  imageUrl: string | null;
  imageMode: BgImageMode;
  opacity: number;
  tint: BgImageTint | undefined;
  onPick: (key: string | null) => void;
  onMode: (mode: BgImageMode) => void;
  onOpacity: (value: number) => void;
  onTint: (value: BgImageTint) => void;
}) {
  const tTheme = useTranslations('Fundraisers.form.theme');
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
      <TintRow
        label='Image colour'
        options={IMAGE_TINTS}
        value={tint ?? 'background'}
        onChange={onTint}
      />
      <OpacitySlider
        value={opacity}
        onChange={onOpacity}
        max={DECORATION_MAX_OPACITY}
      />
      <div>
        <SectionHeader showDivider={false}>
          {tTheme('labelImage')}
        </SectionHeader>
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
