'use client';

import { useState } from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import { useTranslations } from 'next-intl';
import { Palette, X } from 'lucide-react';
import { isValidHexColor } from '@/lib/theme/color-utils';
import { cn } from '@/lib/utils/cn';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SectionHeader } from '../typography';

const DEFAULT_COLOR = '#ffffff';

// Only commit a complete 6-digit hex; a 3-digit value would snap the field before typing finishes.
function normalizeHex(input: string): string | null {
  const hex = (input.startsWith('#') ? input : `#${input}`).toLowerCase();
  return isValidHexColor(hex) ? hex : null;
}

// Combined swatch + Palette icon; clicking anywhere on it opens the picker.
function ColorTrigger({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (hex: string | null) => void;
}) {
  const tTheme = useTranslations('Fundraisers.form.theme');
  const [open, setOpen] = useState(false);
  const current = value ?? DEFAULT_COLOR;

  const commit = (input: string) => {
    const hex = normalizeHex(input);
    if (hex) onChange(hex);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type='button'
          title={tTheme('selectColor')}
          aria-label={tTheme('selectColor')}
          className='inline-flex h-8 items-center gap-1.5 rounded-md border-2 border-border px-1.5 transition-all hover:border-foreground/40'
        >
          <span
            className='h-5 w-5 rounded-sm border border-border/60'
            style={value ? { backgroundColor: value } : undefined}
          />
          <Palette className='h-3.5 w-3.5 text-muted-foreground' />
        </button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-auto'>
        <div className='flex flex-col gap-3'>
          <HexColorPicker color={current} onChange={commit} />
          <div className='flex items-center gap-1'>
            <span className='text-xs font-semibold text-muted-foreground'>
              #
            </span>
            <HexColorInput
              // Empty (not the default) when unset, so a fresh code isn't truncated on the first keystroke.
              color={value ?? ''}
              onChange={commit}
              placeholder='RRGGBB'
              className='w-24 rounded-md border border-border bg-background px-2 py-1 text-xs uppercase'
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Always-visible "None" tile (diagonal-slash glyph, like the gradient None) that clears the colour.
function NoneSwatch({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  const tTheme = useTranslations('Fundraisers.form.theme');
  return (
    <button
      type='button'
      onClick={onClick}
      title={tTheme('clearColor')}
      aria-label={tTheme('clearColor')}
      aria-pressed={active}
      className={cn(
        'relative h-8 w-8 overflow-hidden rounded-md border-2 bg-background',
        active
          ? 'border-foreground'
          : 'border-border hover:border-foreground/40'
      )}
    >
      <svg
        viewBox='0 0 24 24'
        className='absolute inset-0 h-full w-full text-muted-foreground'
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
    </button>
  );
}

export function BackgroundColorRow({
  label,
  variant,
  value,
  onChange,
}: {
  label: string;
  variant: 'none-swatch' | 'clear-button';
  value: string | null;
  onChange: (hex: string | null) => void;
}) {
  const tTheme = useTranslations('Fundraisers.form.theme');
  return (
    <div>
      <SectionHeader showDivider={false}>{label}</SectionHeader>
      <div className='mt-2 flex items-center gap-2'>
        {variant === 'none-swatch' && (
          <NoneSwatch active={!value} onClick={() => onChange(null)} />
        )}
        <ColorTrigger value={value} onChange={onChange} />
        {variant === 'clear-button' && value && (
          <button
            type='button'
            onClick={() => onChange(null)}
            className='inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold hover:border-foreground/40'
          >
            <X className='h-3.5 w-3.5' />
            {tTheme('clearColor')}
          </button>
        )}
      </div>
    </div>
  );
}
