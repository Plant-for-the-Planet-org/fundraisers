'use client';

import { useState } from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import { useTranslations } from 'next-intl';
import { Palette } from 'lucide-react';
import { isValidHexColor } from '@/lib/theme/color-utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { QUICK_PICK_COLORS } from './constants';

const DEFAULT_COLOR = '#ffffff';

// Only commit a complete 6-digit hex; a 3-digit value would snap the field before typing finishes.
function normalizeHex(input: string): string | null {
  const hex = (input.startsWith('#') ? input : `#${input}`).toLowerCase();
  return isValidHexColor(hex) ? hex : null;
}

// Combined swatch + Palette icon; clicking anywhere on it opens the picker.
// Shared by the solid colour control and each gradient stop.
export function ColorTrigger({
  value,
  onChange,
  label,
}: {
  value: string | null;
  onChange: (hex: string) => void;
  label: string;
}) {
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
          title={label}
          aria-label={label}
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
          <QuickPicks onPick={onChange} />
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

function QuickPicks({ onPick }: { onPick: (hex: string) => void }) {
  const tTheme = useTranslations('Fundraisers.form.theme');
  return (
    <div>
      <div className='mb-1.5 text-[11px] font-semibold text-muted-foreground'>
        {tTheme('quickPicks')}
      </div>
      <div className='grid grid-cols-5 gap-1.5'>
        {QUICK_PICK_COLORS.map(hex => (
          <button
            key={hex}
            type='button'
            onClick={() => onPick(hex)}
            title={hex}
            aria-label={hex}
            className='aspect-square rounded-[5px] border border-border transition-transform hover:scale-110'
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>
    </div>
  );
}
