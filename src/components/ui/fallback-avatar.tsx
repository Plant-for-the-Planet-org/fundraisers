import type { FallbackAvatarHue } from '@/lib/utils/avatar-seed';

import { cn } from '@/lib/utils';
import {
  FALLBACK_AVATAR_HUES,
  FALLBACK_AVATAR_ICONS,
  getHashIndex,
} from '@/lib/utils/avatar-seed';
import { AvatarFallback } from './avatar';
import { PlantIcon } from './plant-icons';

// Full class strings, so Tailwind sees them in the source.
const COLOR_CLASSES: Record<FallbackAvatarHue, string> = {
  amber: 'bg-amber-500 text-amber-50 dark:bg-amber-800 dark:text-amber-100',
  emerald:
    'bg-emerald-500 text-emerald-50 dark:bg-emerald-800 dark:text-emerald-100',
  lime: 'bg-lime-500 text-lime-50 dark:bg-lime-800 dark:text-lime-100',
  teal: 'bg-teal-500 text-teal-50 dark:bg-teal-800 dark:text-teal-100',
  sky: 'bg-sky-500 text-sky-50 dark:bg-sky-800 dark:text-sky-100',
  rose: 'bg-rose-500 text-rose-50 dark:bg-rose-800 dark:text-rose-100',
  orange:
    'bg-orange-500 text-orange-50 dark:bg-orange-800 dark:text-orange-100',
  violet:
    'bg-violet-500 text-violet-50 dark:bg-violet-800 dark:text-violet-100',
};

interface FallbackAvatarProps {
  seed: string;
  className?: string;
}

export function FallbackAvatar({ seed, className }: FallbackAvatarProps) {
  const icon =
    FALLBACK_AVATAR_ICONS[getHashIndex(FALLBACK_AVATAR_ICONS.length, seed)];
  const hue =
    FALLBACK_AVATAR_HUES[getHashIndex(FALLBACK_AVATAR_HUES.length, seed)];

  return (
    <AvatarFallback className={cn(COLOR_CLASSES[hue], className)}>
      <PlantIcon paths={icon} className='h-1/2 w-1/2' />
    </AvatarFallback>
  );
}
