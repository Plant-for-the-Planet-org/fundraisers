import type { PlantIconPaths } from '@/lib/icons/plant-icon-paths';

import {
  leafMaple,
  leafOak,
  leafyGreen,
  seedling,
  treeDeciduous,
  treeLarge,
  treePalm,
  trees,
} from '@/lib/icons/plant-icon-paths';

// Returns just the index — no component creation involved
export function getHashIndex(length: number, seed: string): number {
  const s = seed || 'unknown';
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % length;
}

/** The generated avatar's icon, picked by seed. Shared by the React avatar and the share images. */
export const FALLBACK_AVATAR_ICONS: readonly PlantIconPaths[] = [
  treeDeciduous,
  treePalm,
  trees,
  treeLarge,
  leafMaple,
  leafOak,
  leafyGreen,
  seedling,
];

/** The generated avatar's colour, picked by seed: the 500 shade behind a 50 icon, or 800 behind 100 in dark mode. */
export const FALLBACK_AVATAR_HUES = [
  'amber',
  'emerald',
  'lime',
  'teal',
  'sky',
  'rose',
  'orange',
  'violet',
] as const;

export type FallbackAvatarHue = (typeof FALLBACK_AVATAR_HUES)[number];
