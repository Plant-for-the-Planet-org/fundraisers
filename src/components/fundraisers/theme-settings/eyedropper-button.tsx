'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Pipette } from 'lucide-react';
import { isValidHexColor } from '@/lib/theme/color-utils';
import { cn } from '@/lib/utils/cn';

interface EyeDropperResult {
  sRGBHex: string;
}
interface EyeDropperInstance {
  open: () => Promise<EyeDropperResult>;
}
declare global {
  interface Window {
    EyeDropper?: { new (): EyeDropperInstance };
  }
}

// Pen that samples a colour from anywhere on screen via the native EyeDropper
// API. Renders nothing where the browser lacks support (Safari/Firefox), so
// the hex input and quick picks stay the fallback.
export function EyedropperButton({
  onPick,
  className,
}: {
  onPick: (hex: string) => void;
  className?: string;
}) {
  const tTheme = useTranslations('Fundraisers.form.theme');
  // Client-only capability check without a hydration mismatch: server renders
  // nothing, the client swaps in the button once mounted if EyeDropper exists.
  const supported = useSyncExternalStore(
    () => () => {},
    () => 'EyeDropper' in window,
    () => false
  );

  if (!supported) return null;

  const open = async () => {
    try {
      const result = await new window.EyeDropper!().open();
      const hex = result.sRGBHex.toLowerCase();
      if (isValidHexColor(hex)) onPick(hex);
    } catch {
      // user pressed Escape — ignore
    }
  };

  return (
    <button
      type='button'
      onClick={open}
      aria-label={tTheme('eyedropper')}
      title={tTheme('eyedropper')}
      className={cn(
        'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
        className
      )}
    >
      <Pipette className='h-3.5 w-3.5' />
    </button>
  );
}
