import { cn } from '@/lib/utils';
import { pickByHash } from '@/lib/utils/avatar-seed';
import { AvatarFallback } from './avatar';
import {
  LeafMapleIcon,
  LeafOakIcon,
  LeafyGreenIcon,
  SeedlingIcon,
  TreeDeciduousIcon,
  TreeLargeIcon,
  TreePalmIcon,
  TreesIcon,
} from './plant-icons';

const TREE_ICONS = [
  TreeDeciduousIcon,
  TreePalmIcon,
  TreesIcon,
  TreeLargeIcon,
  LeafMapleIcon,
  LeafOakIcon,
  LeafyGreenIcon,
  SeedlingIcon,
] as const;

const COLOR_CLASSES = [
  'bg-amber-500 text-amber-50 dark:bg-amber-800 dark:text-amber-100',
  'bg-emerald-500 text-emerald-50 dark:bg-emerald-800 dark:text-emerald-100',
  'bg-lime-500 text-lime-50 dark:bg-lime-800 dark:text-lime-100',
  'bg-teal-500 text-teal-50 dark:bg-teal-800 dark:text-teal-100',
  'bg-sky-500 text-sky-50 dark:bg-sky-800 dark:text-sky-100',
  'bg-rose-500 text-rose-50 dark:bg-rose-800 dark:text-rose-100',
  'bg-orange-500 text-orange-50 dark:bg-orange-800 dark:text-orange-100',
  'bg-violet-500 text-violet-50 dark:bg-violet-800 dark:text-violet-100',
] as const;

interface FallbackAvatarProps {
  seed: string;
  className?: string;
}

export function FallbackAvatar({ seed, className }: FallbackAvatarProps) {
  const Icon = pickByHash(TREE_ICONS, seed);
  const colorClass = pickByHash(COLOR_CLASSES, seed);
  return (
    <AvatarFallback className={cn(colorClass, className)}>
      <Icon className='h-1/2 w-1/2' aria-hidden />
    </AvatarFallback>
  );
}
