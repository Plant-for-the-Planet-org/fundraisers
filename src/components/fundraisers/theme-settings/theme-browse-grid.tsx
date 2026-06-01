'use client';

import type { Theme } from '@/lib/theme/types';

import { cn } from '@/lib/utils/cn';
import { ACCENT_BG, FEATURED_THEMES } from './constants';

export function ThemeBrowseGrid({
  activeId,
  onPick,
}: {
  activeId: string;
  onPick: (theme: Theme) => void;
}) {
  return (
    <div className='grid grid-cols-2 gap-2'>
      {FEATURED_THEMES.map(theme => {
        const active = theme.id === activeId;
        return (
          <button
            type='button'
            key={theme.id}
            onClick={() => onPick(theme)}
            aria-pressed={active}
            className={cn(
              'flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left',
              active
                ? 'border-foreground'
                : 'border-border hover:border-foreground/40'
            )}
          >
            <span
              className={cn(
                'w-6 h-6 rounded-md border border-border flex-shrink-0',
                theme.bg.gradient
              )}
            />
            <div className='flex-1 min-w-0'>
              <div className='text-xs font-semibold text-foreground truncate'>
                {theme.name}
              </div>
              <div className='text-[10px] text-muted-foreground capitalize'>
                {theme.category}
              </div>
            </div>
            <span
              className={cn(
                'w-2.5 h-2.5 rounded-full border border-border flex-shrink-0',
                ACCENT_BG[theme.accent]
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
