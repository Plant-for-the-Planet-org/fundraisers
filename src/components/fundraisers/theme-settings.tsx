'use client';

import { useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import type { AccentColor } from '@/lib/theme/types';
import { THEMES } from '@/lib/theme/themes';
import { getThemeForPath } from '@/lib/theme/route-themes';
import { useThemeStore } from '@/stores/theme-store';
import { SectionHeader } from './typography';
import { useTranslations } from 'next-intl';

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
  const tTheme = useTranslations('Fundraisers.create.theme');
  const { selectedTheme, setSelectedTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeTheme = selectedTheme ?? getThemeForPath(pathname);

  const handleToggle = () => setIsOpen(v => !v);

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
      setIsOpen(false);
    }
  };

  const handleThemeSelect = (themeId: string) => {
    const theme = THEMES[themeId];
    if (!theme) return;
    setSelectedTheme(theme);
    setIsOpen(false);
  };

  const handleAccentChange = (accent: AccentColor) => {
    setSelectedTheme({ ...activeTheme, accent });
  };

  return (
    <div className='flex flex-col gap-4'>
      <div>
        <SectionHeader>{tTheme('sectionHeading')}</SectionHeader>
        <div ref={dropdownRef} className='relative mt-2' onBlur={handleBlur}>
          <button
            className='w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm'
            onClick={handleToggle}
            aria-expanded={isOpen}
            aria-haspopup='listbox'
          >
            <span>{activeTheme.name}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isOpen && (
            <div
              role='listbox'
              className='absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto'
            >
              {THEME_OPTIONS.map(theme => (
                <button
                  key={theme.id}
                  role='option'
                  aria-selected={activeTheme.id === theme.id}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    activeTheme.id === theme.id
                      ? 'bg-gray-50 dark:bg-gray-800 font-semibold'
                      : ''
                  }`}
                  onClick={() => handleThemeSelect(theme.id)}
                >
                  <div>{theme.name}</div>
                  <div className='text-xs text-gray-500 dark:text-gray-400 capitalize'>
                    {theme.category}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <SectionHeader showDivider={false}>
          {tTheme('labelAccentColor')}
        </SectionHeader>
        <div className='flex flex-wrap gap-2 mt-2'>
          {activeTheme.colorOptions.map(accent => (
            <button
              key={accent}
              onClick={() => handleAccentChange(accent)}
              className={`w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                activeTheme.accent === accent
                  ? 'border-gray-900 dark:border-gray-100 shadow-md'
                  : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
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
