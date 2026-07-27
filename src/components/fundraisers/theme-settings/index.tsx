'use client';

import type { AccentColor, FontId, Theme } from '@/lib/theme/types';
import type { FundraiserFormValues } from '../fundraiser-form-schema';

import { useState } from 'react';
import { useController } from 'react-hook-form';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Moon, Shuffle, Sun } from 'lucide-react';
import { getAccentColor } from '@/lib/theme/accent-utils';
import { getDominantStopColor } from '@/lib/theme/color-utils';
import { getThemeForPath } from '@/lib/theme/route-themes';
import { THEMES } from '@/lib/theme/themes';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectionHeader } from '../typography';
import { BackgroundTab } from './background-tab';
import {
  ACCENT_BG,
  ANIMATION_OPTIONS,
  type BgFormValue,
  FEATURED_THEMES,
  FONT_OPTIONS,
  pickRandom,
} from './constants';
import { FontChipRow, ThemeChipRow } from './primitives';
import { ThemeBrowseGrid } from './theme-browse-grid';

// TEMP: box-style options for the design-review selector. Remove before merge.
const BOX_STYLES = {
  original:
    'rounded-xl bg-base/20 dark:bg-white/15 p-4 shadow-none border-2 border-white dark:border-none',
  quiet: 'rounded-xl bg-base/10 dark:bg-white/10 p-4 border border-border/60',
  none: '',
} as const;
type BoxStyle = keyof typeof BOX_STYLES;
const BOX_LABELS: Record<BoxStyle, string> = {
  original: 'Original box',
  quiet: 'Quiet box',
  none: 'No box',
};

export function ThemeSettings() {
  const pathname = usePathname();
  const tTheme = useTranslations('Fundraisers.form.theme');
  const { selectedTheme, setSelectedTheme } = useThemeStore();
  const { field } = useController<FundraiserFormValues, 'settings.theme'>({
    name: 'settings.theme',
  });

  const profileEmail = useAuthStore(s => s.user?.profile?.email);
  // Logo decoration is internal-only for now. Anyone on the Planet email
  // domain can pick from the partner library; for other users, the option
  // only appears if this fundraiser already has a logo set (so they can
  // still clear or change it, but can't add one fresh).
  const isPlanetStaff = !!profileEmail?.endsWith('@plant-for-the-planet.org');
  const hasExistingLogo = !!field.value.bg.logo_id;
  const allowLogo = isPlanetStaff || hasExistingLogo;

  const [tab, setTab] = useState<'theme' | 'background'>('theme');
  const [isBrowsing, setIsBrowsing] = useState(true);
  const isCustomizing = tab === 'theme' && !isBrowsing;

  // TEMP: lets the design team compare box styles. Remove before merge.
  const [boxStyle, setBoxStyle] = useState<BoxStyle>('original');

  const baseFromForm = THEMES[field.value.base_id] ?? getThemeForPath(pathname);
  const activeTheme: Theme = selectedTheme ?? {
    ...baseFromForm,
    accent: field.value.accent as AccentColor,
    mode: field.value.mode,
    bodyFont: field.value.body_font as FontId,
    titleFont: field.value.title_font as FontId,
    bg: field.value.bg,
  };

  // Updates the form field (persisted on save) and the live preview store (ThemeShell) atomically.
  const syncFormAndPreview = (
    formPatch: Partial<FundraiserFormValues['settings']['theme']>,
    previewPatch: Partial<Theme>
  ) => {
    field.onChange({ ...field.value, ...formPatch });
    setSelectedTheme({ ...activeTheme, ...previewPatch });
  };

  const patchBg = (next: Partial<BgFormValue>) => {
    const merged: BgFormValue = { ...field.value.bg, ...next };
    syncFormAndPreview({ bg: merged }, { bg: merged });
  };

  const applyTheme = (theme: Theme) => {
    // Each preset ships its own bg (decoration, gradient, opacity, animation…).
    // Picking the theme applies them; the user can still tweak afterwards.
    //
    // Strip logo decoration for non-staff users who don't have an existing logo:
    // the Logo picker is hidden from them so they would have no way to remove it.
    const bg: BgFormValue =
      theme.bg.decoration === 'logo' && !allowLogo
        ? { ...theme.bg, decoration: 'none', logo_id: null }
        : theme.bg;

    field.onChange({
      ...field.value,
      base_id: theme.id,
      mode: theme.mode,
      accent: theme.accent,
      body_font: theme.bodyFont,
      title_font: theme.titleFont,
      bg,
    });
    setSelectedTheme({ ...theme, bg });
    setIsBrowsing(false);
  };

  const randomize = () => {
    const theme = pickRandom(FEATURED_THEMES);
    applyTheme({
      ...theme,
      accent: pickRandom(theme.colorOptions),
      titleFont: pickRandom(FONT_OPTIONS).id,
      bodyFont: pickRandom(FONT_OPTIONS).id,
      bg: { ...theme.bg, animation: pickRandom(ANIMATION_OPTIONS).id },
    });
  };

  const toggleBrowse = () => {
    if (isCustomizing) {
      setIsBrowsing(true);
    } else {
      setTab('theme');
      setIsBrowsing(false);
    }
  };

  const toggleMode = () => {
    const nextMode = field.value.mode === 'dark' ? 'light' : 'dark';
    syncFormAndPreview({ mode: nextMode }, { mode: nextMode });
  };

  const modeLabel = tTheme(
    field.value.mode === 'dark' ? 'switchToLight' : 'switchToDark'
  );

  return (
    <div className='flex flex-col gap-2'>
      {/* TEMP: box-style preview selector (outside the box) — remove before merge */}
      <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
        <span>Box:</span>
        {(Object.keys(BOX_STYLES) as BoxStyle[]).map(opt => (
          <button
            key={opt}
            type='button'
            onClick={() => setBoxStyle(opt)}
            aria-pressed={boxStyle === opt}
            className={cn(
              'rounded-md border px-2 py-0.5 font-semibold',
              boxStyle === opt
                ? 'border-foreground text-foreground'
                : 'border-border hover:border-foreground/40'
            )}
          >
            {BOX_LABELS[opt]}
          </button>
        ))}
      </div>

      <div
        className={cn(
          'theme-settings flex flex-col gap-3 text-foreground',
          BOX_STYLES[boxStyle]
        )}
      >
        <div className='theme-settings-toolbar flex items-center gap-2 pb-3 border-b border-border'>
          <div className='flex-1 min-w-0'>
            <SectionHeader showDivider={false}>
              {tTheme('sectionHeading')}
            </SectionHeader>
            <div className='text-xs text-muted-foreground truncate mt-0.5'>
              {activeTheme.name}
            </div>
          </div>
          {/* TODO - consider using ui/buttons instead of rolling up custom styles here. */}
          <IconButton
            onClick={toggleMode}
            label={modeLabel}
            aria-pressed={field.value.mode === 'dark'}
          >
            {field.value.mode === 'dark' ? (
              <Moon className='w-3.5 h-3.5' />
            ) : (
              <Sun className='w-3.5 h-3.5' />
            )}
          </IconButton>
          <IconButton onClick={randomize} label={tTheme('shuffle')}>
            <Shuffle className='w-3.5 h-3.5' />
          </IconButton>
          <button
            type='button'
            onClick={toggleBrowse}
            className={cn(
              'inline-flex items-center px-2.5 h-8 rounded-md border border-border text-xs font-semibold',
              isCustomizing ? 'bg-muted/40' : 'bg-transparent hover:bg-muted/20'
            )}
          >
            {isCustomizing ? tTheme('browse') : tTheme('done')}
          </button>
        </div>

        <Tabs
          value={tab}
          onValueChange={value => setTab(value as 'theme' | 'background')}
          className='gap-3'
        >
          <TabsList className='w-full grid grid-cols-2'>
            <TabsTrigger value='theme'>{tTheme('tabTheme')}</TabsTrigger>
            <TabsTrigger value='background'>
              {tTheme('tabBackground')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value='theme' className='flex flex-col gap-4'>
            {isBrowsing ? (
              <ThemeBrowseGrid
                activeId={field.value.base_id}
                onPick={applyTheme}
              />
            ) : (
              <CustomizePanels
                activeTheme={activeTheme}
                onAccent={accent => syncFormAndPreview({ accent }, { accent })}
                onTitleFont={titleFont =>
                  syncFormAndPreview({ title_font: titleFont }, { titleFont })
                }
                onBodyFont={bodyFont =>
                  syncFormAndPreview({ body_font: bodyFont }, { bodyFont })
                }
              />
            )}
          </TabsContent>

          <TabsContent value='background' className='flex flex-col gap-4'>
            <BackgroundTab
              bg={field.value.bg}
              accentColor={getAccentColor(activeTheme.accent)}
              // One base wash at a time: each setter clears the other two.
              // Colour selection does not change light/dark mode; in the layered
              // model the colour is only a tint over the mode base, so mode is a
              // deliberate toggle, not derived from the picked colour.
              onSelectNone={() => {
                const nextBg = {
                  ...field.value.bg,
                  background_color: null,
                  gradient: '',
                  custom_gradient: null,
                };
                syncFormAndPreview({ bg: nextBg }, { bg: nextBg });
              }}
              onSolidColor={hex => {
                const nextBg = {
                  ...field.value.bg,
                  background_color: hex,
                  gradient: '',
                  custom_gradient: null,
                };
                // A new background colour re-seeds the accent (the selected colour).
                syncFormAndPreview(
                  { bg: nextBg, accent: hex },
                  { bg: nextBg, accent: hex as AccentColor }
                );
              }}
              onGradientChange={next => {
                const nextBg = {
                  ...field.value.bg,
                  custom_gradient: next,
                  background_color: null,
                  gradient: '',
                };
                // Re-seed the accent from the gradient's dominant stop.
                const accent = getDominantStopColor(next.stops);
                syncFormAndPreview(
                  { bg: nextBg, ...(accent && { accent }) },
                  {
                    bg: nextBg,
                    ...(accent && { accent: accent as AccentColor }),
                  }
                );
              }}
              onGradient={value => {
                const nextBg = {
                  ...field.value.bg,
                  gradient: value,
                  background_color: null,
                  custom_gradient: null,
                };
                syncFormAndPreview({ bg: nextBg }, { bg: nextBg });
              }}
              onDecoration={decoration => patchBg({ decoration })}
              onPatternId={pattern_id => patchBg({ pattern_id })}
              onImageUrl={image_url => patchBg({ image_url })}
              onImageMode={image_mode => patchBg({ image_mode })}
              onLogoId={logo_id => patchBg({ logo_id })}
              onOpacity={opacity => patchBg({ opacity })}
              onAnimation={animation => patchBg({ animation })}
              onImageTint={image_tint => patchBg({ image_tint })}
              onPatternTint={pattern_tint => patchBg({ pattern_tint })}
              allowLogo={allowLogo}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function IconButton({
  onClick,
  label,
  children,
  ...rest
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type='button'
      onClick={onClick}
      title={label}
      aria-label={label}
      className='inline-flex items-center justify-center w-8 h-8 rounded-md border border-border bg-transparent hover:bg-muted/30 text-foreground'
      {...rest}
    >
      {children}
    </button>
  );
}

function CustomizePanels({
  activeTheme,
  onAccent,
  onTitleFont,
  onBodyFont,
}: {
  activeTheme: Theme;
  onAccent: (accent: AccentColor) => void;
  onTitleFont: (font: FontId) => void;
  onBodyFont: (font: FontId) => void;
}) {
  const tTheme = useTranslations('Fundraisers.form.theme');
  return (
    <>
      <ThemeChipRow
        label={tTheme('labelAccentColor')}
        aria-label={tTheme('labelAccentColor')}
        role='radiogroup'
      >
        {activeTheme.colorOptions.map(accent => (
          <button
            type='button'
            key={accent}
            role='radio'
            aria-checked={activeTheme.accent === accent}
            onClick={() => onAccent(accent)}
            className={cn(
              'w-6 h-6 rounded-full border-2 transition-all hover:scale-110',
              activeTheme.accent === accent
                ? 'border-foreground shadow-md'
                : 'border-border hover:border-foreground/40'
            )}
            title={tTheme('selectAccent', { accent })}
            aria-label={tTheme('selectAccent', { accent })}
          >
            <div
              className={cn('w-full h-full rounded-full', ACCENT_BG[accent])}
            />
          </button>
        ))}
      </ThemeChipRow>

      <FontChipRow
        label={tTheme('labelTitleFont')}
        value={activeTheme.titleFont}
        onChange={onTitleFont}
      />
      <FontChipRow
        label={tTheme('labelBodyFont')}
        value={activeTheme.bodyFont}
        onChange={onBodyFont}
      />
    </>
  );
}
