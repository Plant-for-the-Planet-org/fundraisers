'use client';

import type { AccentColor } from '@/lib/theme/types';
import type { FundraiserFormValues } from './fundraiser-form-schema';

import { useController } from 'react-hook-form';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getThemeForPath } from '@/lib/theme/route-themes';
import { THEMES } from '@/lib/theme/themes';
import { useThemeStore } from '@/stores/theme-store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SectionHeader } from './typography';

const ACCENT_BG: Record<AccentColor, string> = {
  blue: 'bg-blue-500',
  cyan: 'bg-cyan-500',
  emerald: 'bg-emerald-500',
  green: 'bg-green-500',
  teal: 'bg-teal-500',
  lime: 'bg-lime-500',
  indigo: 'bg-indigo-500',
  purple: 'bg-purple-500',
  violet: 'bg-violet-500',
  fuchsia: 'bg-fuchsia-500',
  pink: 'bg-pink-500',
  rose: 'bg-rose-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  yellow: 'bg-yellow-500',
  slate: 'bg-slate-500',
  gray: 'bg-gray-500',
  zinc: 'bg-zinc-500',
  neutral: 'bg-neutral-500',
  stone: 'bg-stone-500',
};

const THEME_OPTIONS = Object.values(THEMES).filter(theme => theme.featured);

export function ThemeSettings() {
  const pathname = usePathname();
  const tTheme = useTranslations('Fundraisers.form.theme');
  const { selectedTheme, setSelectedTheme } = useThemeStore();
  const { field } = useController<FundraiserFormValues, 'settings.theme'>({
    name: 'settings.theme',
  });

  const activeTheme = selectedTheme ?? getThemeForPath(pathname);

  const handleThemeSelect = (themeId: string) => {
    const theme = THEMES[themeId];
    if (!theme) return;

    field.onChange({
      base_id: theme.id,
      mode: theme.mode,
      accent: theme.accent,
      background: theme.background,
      body_font: theme.bodyFont,
      title_font: theme.titleFont,
      animation: theme.animation ?? 'none',
    });

    setSelectedTheme(theme);
  };

  const handleAccentChange = (accent: AccentColor) => {
    field.onChange({ ...field.value, accent });
    setSelectedTheme({ ...activeTheme, accent });
  };

  return (
    <div className='theme-settings flex flex-col gap-4'>
      <div>
        <SectionHeader>{tTheme('sectionHeading')}</SectionHeader>
        <Select value={activeTheme.id} onValueChange={handleThemeSelect}>
          <SelectTrigger className='w-full mt-2 bg-transparent border-border hover:bg-muted/5'>
            <SelectValue>{activeTheme.name}</SelectValue>
          </SelectTrigger>
          <SelectContent
            position='popper'
            align='start'
            sideOffset={4}
            className='max-h-80 bg-background border-border'
          >
            {THEME_OPTIONS.map(theme => (
              <SelectItem
                key={theme.id}
                value={theme.id}
                layout='stacked'
                className='pr-2 py-2 focus:bg-muted data-[state=checked]:bg-muted **:data-[slot=select-item-indicator]:hidden'
              >
                <div className='font-medium'>{theme.name}</div>
                <div className='text-xs text-muted-foreground capitalize'>
                  {theme.category}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <SectionHeader showDivider={false}>
          {tTheme('labelAccentColor')}
        </SectionHeader>
        <div
          role='radiogroup'
          aria-label={tTheme('labelAccentColor')}
          className='flex flex-wrap gap-2 mt-2'
        >
          {activeTheme.colorOptions.map(accent => (
            <button
              key={accent}
              role='radio'
              aria-checked={activeTheme.accent === accent}
              onClick={() => handleAccentChange(accent)}
              className={`w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                activeTheme.accent === accent
                  ? 'border-gray-900 dark:border-gray-100 shadow-md'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              title={tTheme('selectAccent', { accent })}
              aria-label={tTheme('selectAccent', { accent })}
            >
              <div
                className={`w-full h-full rounded-full ${ACCENT_BG[accent]}`}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
