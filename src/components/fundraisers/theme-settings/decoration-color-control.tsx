'use client';

import { ChevronDown, Palette } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ColorSwatch } from './primitives';
import { SolidPicker } from './solid-picker';

export type ColorPreset = {
  label: string;
  hex: string | null;
  active: boolean;
  onSelect: () => void;
};

// Shared decoration colour picker (patterns + images): a palette pill on the
// right of the decoration header that opens the solid picker. The preset row
// (Accent / Background / Current, plus None for images) replaces the generic
// quick picks; dragging or typing a colour switches to a custom tint.
export function DecorationColorControl({
  label,
  triggerHex,
  pickerValue,
  presets,
  onPickCustom,
}: {
  label: string;
  triggerHex: string | null;
  pickerValue: string;
  presets: ColorPreset[];
  onPickCustom: (hex: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type='button'
          aria-label={label}
          title={label}
          className='group inline-flex items-center gap-1.5 h-7 px-2 rounded-md border border-border bg-transparent hover:bg-muted/20 data-[state=open]:bg-muted/40'
        >
          <Palette className='w-3.5 h-3.5 opacity-60' aria-hidden />
          <ColorSwatch hex={triggerHex} sizeClass='h-3.5 w-3.5' />
          <ChevronDown
            className='w-3.5 h-3.5 opacity-60 transition-transform group-data-[state=open]:rotate-180'
            aria-hidden
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-auto'>
        <SolidPicker
          value={pickerValue}
          onChange={onPickCustom}
          presets={
            <div>
              <div className='mb-1.5 text-[11px] font-semibold text-muted-foreground'>
                {label}
              </div>
              <div className='flex gap-3'>
                {presets.map(preset => (
                  <button
                    type='button'
                    key={preset.label}
                    onClick={preset.onSelect}
                    aria-pressed={preset.active}
                    className='flex flex-col items-center gap-1'
                  >
                    <ColorSwatch
                      hex={preset.hex}
                      sizeClass='h-7 w-7'
                      active={preset.active}
                    />
                    <span className='text-[10px] text-muted-foreground'>
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          }
        />
      </PopoverContent>
    </Popover>
  );
}
