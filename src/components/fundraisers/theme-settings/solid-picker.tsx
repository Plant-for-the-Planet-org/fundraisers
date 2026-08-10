'use client';

import type { ReactNode } from 'react';

import { HexColorInput, HexColorPicker } from 'react-colorful';
import { useTranslations } from 'next-intl';
import { normalizeHex } from '@/lib/theme/color-utils';
import { DEFAULT_SOLID_COLOR, QUICK_PICK_COLORS } from './constants';
import { EyedropperButton } from './eyedropper-button';

// Solid colour picker: a hue/lightness field, a preset row, and a hex input.
// Shared by the background base selector and the pattern colour control. Pass
// `presets` to replace the default quick-pick swatches with context-specific
// ones (e.g. the pattern control shows Accent / Background / Current).
export function SolidPicker({
  value,
  onChange,
  presets,
}: {
  value: string | null;
  onChange: (hex: string) => void;
  presets?: ReactNode;
}) {
  const tTheme = useTranslations('Fundraisers.form.theme');
  const current = value ?? DEFAULT_SOLID_COLOR;

  const commit = (input: string) => {
    const hex = normalizeHex(input);
    if (hex) onChange(hex);
  };

  return (
    <div className='flex flex-col gap-3'>
      <HexColorPicker color={current} onChange={commit} />
      {presets ?? (
        <div>
          <div className='mb-1.5 text-[11px] font-semibold text-muted-foreground'>
            {tTheme('quickPicks')}
          </div>
          <div className='grid grid-cols-5 gap-1.5'>
            {QUICK_PICK_COLORS.map(hex => (
              <button
                key={hex}
                type='button'
                onClick={() => onChange(hex)}
                title={hex}
                aria-label={hex}
                className='aspect-square rounded-[5px] border border-border transition-transform hover:scale-110'
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </div>
      )}
      <div className='flex items-center gap-1'>
        <span className='text-xs font-semibold text-muted-foreground'>#</span>
        <HexColorInput
          color={value ?? ''}
          onChange={commit}
          placeholder='RRGGBB'
          className='w-24 rounded-md border border-border bg-background px-2 py-1 text-xs uppercase'
        />
        <EyedropperButton onPick={onChange} className='ml-auto' />
      </div>
    </div>
  );
}
