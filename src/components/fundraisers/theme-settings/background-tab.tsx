'use client';

import type {
  AnimationType,
  BgDecoration,
  BgImageMode,
} from '@/lib/theme/types';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import { SectionHeader } from '../typography';
import {
  ANIMATION_OPTIONS,
  type BgFormValue,
  DECORATIONS,
  GRADIENT_OPTIONS,
  IMAGE_MODES,
  IMAGES,
  LOGOS,
  PATTERNS,
} from './constants';
import { AssetGrid, OpacitySlider, ThemeChipRow } from './primitives';

type Props = {
  bg: BgFormValue;
  onGradient: (value: string, mode: 'light' | 'dark') => void;
  onDecoration: (value: BgDecoration) => void;
  onPatternId: (id: string | null) => void;
  onImageUrl: (url: string | null) => void;
  onImageMode: (mode: BgImageMode) => void;
  onLogoId: (id: string | null) => void;
  onOpacity: (value: number) => void;
  onAnimation: (value: AnimationType) => void;
  allowLogo: boolean;
};

export function BackgroundTab({
  bg,
  onGradient,
  onDecoration,
  onPatternId,
  onImageUrl,
  onImageMode,
  onLogoId,
  onOpacity,
  onAnimation,
  allowLogo,
}: Props) {
  return (
    <div className='flex flex-col gap-4'>
      <GradientRow value={bg.gradient} onChange={onGradient} />
      <DecorationRow
        value={bg.decoration}
        onChange={onDecoration}
        allowLogo={allowLogo}
      />

      {bg.decoration === 'pattern' && (
        <PatternPanel
          patternId={bg.pattern_id}
          opacity={bg.opacity}
          onPick={onPatternId}
          onOpacity={onOpacity}
        />
      )}
      {bg.decoration === 'image' && (
        <ImagePanel
          imageUrl={bg.image_url}
          imageMode={bg.image_mode}
          opacity={bg.opacity}
          onPick={onImageUrl}
          onMode={onImageMode}
          onOpacity={onOpacity}
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
              'inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-semibold bg-background',
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

function GradientRow({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string, mode: 'light' | 'dark') => void;
}) {
  const tTheme = useTranslations('Fundraisers.form.theme');
  return (
    <div>
      <SectionHeader showDivider={false}>
        {tTheme('labelGradient')}
      </SectionHeader>
      <div className='grid grid-cols-4 gap-2 mt-2'>
        {GRADIENT_OPTIONS.map(g => {
          const active = value === g.value;
          const isNone = g.value === '';
          return (
            <button
              type='button'
              key={g.id}
              onClick={() => onChange(g.value, g.mode)}
              title={g.label}
              aria-label={g.label}
              aria-pressed={active}
              className={cn(
                'relative h-8 rounded-md border-2 overflow-hidden',
                g.value || 'bg-background',
                active
                  ? 'border-foreground'
                  : 'border-border hover:border-foreground/40'
              )}
            >
              {isNone && (
                <svg
                  viewBox='0 0 24 24'
                  className='absolute inset-0 w-full h-full text-muted-foreground'
                  preserveAspectRatio='none'
                  aria-hidden
                >
                  <line
                    x1='2'
                    y1='22'
                    x2='22'
                    y2='2'
                    stroke='currentColor'
                    strokeWidth='1.5'
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
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
                'inline-flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-md border text-[11px] font-semibold bg-background',
                active
                  ? 'border-foreground bg-muted'
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

function PatternPanel({
  patternId,
  opacity,
  onPick,
  onOpacity,
}: {
  patternId: string | null;
  opacity: number;
  onPick: (id: string | null) => void;
  onOpacity: (value: number) => void;
}) {
  const tTheme = useTranslations('Fundraisers.form.theme');
  return (
    <>
      <OpacitySlider value={opacity} onChange={onOpacity} />
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
  onPick,
  onMode,
  onOpacity,
}: {
  imageUrl: string | null;
  imageMode: BgImageMode;
  opacity: number;
  onPick: (key: string | null) => void;
  onMode: (mode: BgImageMode) => void;
  onOpacity: (value: number) => void;
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
                'px-2 py-1 rounded-md border text-xs font-semibold bg-background',
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
      <OpacitySlider value={opacity} onChange={onOpacity} />
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
