'use client';

import { useState } from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { isValidHexColor } from '@/lib/theme/color-utils';
import { cn } from '@/lib/utils/cn';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SectionHeader } from '../typography';

// Shown in the picker before the user has committed a colour.
const DEFAULT_COLOR = '#ffffff';

// Accepts hex with/without '#', expands #abc shorthand, returns '#rrggbb' or
// null. react-colorful's HexColorInput can emit 3-digit and unprefixed values,
// so we normalise before committing to keep stored data as strict 6-digit hex.
function normalizeHex(input: string): string | null {
  let hex = input.startsWith('#') ? input : `#${input}`;
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    hex = `#${hex
      .slice(1)
      .split('')
      .map(c => c + c)
      .join('')}`;
  }
  return isValidHexColor(hex) ? hex.toLowerCase() : null;
}

export function BackgroundColorRow({
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
    <div>
      <SectionHeader showDivider={false}>
        {tTheme('labelBackgroundColor')}
      </SectionHeader>
      <div className='mt-2 flex items-center gap-2'>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type='button'
              title={tTheme('selectColor')}
              aria-label={tTheme('selectColor')}
              className={cn(
                'relative h-8 w-8 overflow-hidden rounded-md border-2 transition-all hover:scale-110',
                value
                  ? 'border-foreground'
                  : 'border-border hover:border-foreground/40'
              )}
              style={value ? { backgroundColor: value } : undefined}
            >
              {!value && (
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
              )}
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
                  color={current}
                  onChange={commit}
                  className='w-24 rounded-md border border-border bg-background px-2 py-1 text-xs uppercase'
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {value && (
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
