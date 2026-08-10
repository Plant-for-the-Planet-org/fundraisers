'use client';

import type { Theme } from '@/lib/theme/types';

import { resolveBgAsset } from '@/lib/theme/backgrounds';
import { isValidHexColor } from '@/lib/theme/color-utils';
import { cn } from '@/lib/utils/cn';
import { ACCENT_BG, FEATURED_THEMES } from './constants';

// Resolve a theme's background to a small preview visual, mirroring how
// ThemeShell paints its base wash. Falls back to the decoration thumbnail (then
// bg-muted) so solid/gradient/image/pattern themes never render a blank swatch.
function swatchVisual(bg: Theme['bg']): {
  className?: string;
  style?: React.CSSProperties;
} {
  if (bg.gradient) return { className: bg.gradient };
  const cg = bg.custom_gradient;
  if (
    cg &&
    cg.stops.length >= 2 &&
    cg.stops.every(s => isValidHexColor(s.color))
  ) {
    return {
      style: {
        backgroundImage: `linear-gradient(${cg.angle}deg, ${cg.stops
          .map(s => `${s.color} ${s.position}%`)
          .join(', ')})`,
      },
    };
  }
  if (isValidHexColor(bg.background_color)) {
    return { style: { backgroundColor: bg.background_color } };
  }
  const decorationKey = bg.image_url ?? bg.pattern_id;
  if (decorationKey) {
    const asset = resolveBgAsset(decorationKey);
    if (asset?.kind === 'library') {
      return {
        style: {
          backgroundImage: `url("${asset.asset.thumb ?? asset.asset.src}")`,
          backgroundSize: 'cover',
        },
      };
    }
  }
  return { className: 'bg-muted' };
}

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
        const visual = swatchVisual(theme.bg);
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
                visual.className
              )}
              style={visual.style}
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
