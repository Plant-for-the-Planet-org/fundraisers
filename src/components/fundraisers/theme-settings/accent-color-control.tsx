'use client';

import { Palette } from 'lucide-react';
import { getAccentColor } from '@/lib/theme/accent-utils';
import { getSwatchContrast, isValidHexColor } from '@/lib/theme/color-utils';
import { cn } from '@/lib/utils/cn';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SolidPicker } from './solid-picker';

// The trailing dot in the accent row: a full solid-colour picker so the accent
// can be any hex, not just a palette token. Mirrors the background's
// CustomColorButton, sized as an accent dot. It's always shown; the picker
// seeds to the current accent when that is a custom hex, otherwise defaults to
// the background colour.
export function AccentColorControl({
  accent,
  bgColorHex,
  label,
  onPick,
}: {
  accent: string;
  bgColorHex: string;
  label: string;
  onPick: (hex: string) => void;
}) {
  const isActive = isValidHexColor(accent);
  // Stay empty (transparent, just the palette icon) until a custom hex accent is
  // applied — mirrors the background custom-colour swatch. Named palette tokens
  // are shown by their own dots, not here.
  const swatchHex = isActive ? getAccentColor(accent) : null;
  // Flip the palette icon light/dark so it stays legible on the swatch colour.
  const { iconClass } = getSwatchContrast(swatchHex);
  const seed = isActive ? accent : bgColorHex;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type='button'
          aria-label={label}
          title={label}
          aria-pressed={isActive}
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all hover:scale-110',
            isActive
              ? 'border-foreground shadow-md'
              : 'border-border hover:border-foreground/40'
          )}
          style={swatchHex ? { backgroundColor: swatchHex } : undefined}
        >
          <Palette className={cn('h-3 w-3', iconClass)} aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-auto'>
        <SolidPicker value={seed} onChange={onPick} />
      </PopoverContent>
    </Popover>
  );
}
