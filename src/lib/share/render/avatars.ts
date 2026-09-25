import type { CanvasLike, ShareAssetLoader } from './theme-background';
import type { Ctx, ShareImage } from './types';

import {
  FALLBACK_AVATAR_HUES,
  FALLBACK_AVATAR_ICONS,
  getHashIndex,
} from '@/lib/utils/avatar-seed';
import { TAILWIND_COLORS } from './tailwind-colors';

/** Avatars are drawn at this size and scaled down; the largest avatar on an image is 84px. */
const AVATAR_PX = 168;

export interface ShareAvatarPerson {
  /** The same seed the donor list uses, so the image matches what the page shows. */
  seed: string;
  /** A photo URL the canvas may draw, or null for the generated avatar. */
  photo: string | null;
}

/**
 * The app's generated avatar (see FallbackAvatar): a plant icon on a colour, both picked by seed.
 * `makePath` builds a Path2D from SVG path data; the browser and `@napi-rs/canvas` each have their own.
 */
export function paintFallbackAvatar(
  canvas: CanvasLike,
  seed: string,
  dark: boolean,
  makePath: (d: string) => Path2D
) {
  const g = canvas.getContext('2d') as Ctx;
  const size = canvas.width;
  const icon =
    FALLBACK_AVATAR_ICONS[getHashIndex(FALLBACK_AVATAR_ICONS.length, seed)];
  const hue =
    FALLBACK_AVATAR_HUES[getHashIndex(FALLBACK_AVATAR_HUES.length, seed)];
  g.fillStyle = TAILWIND_COLORS[`${hue}-${dark ? 800 : 500}`];
  g.fillRect(0, 0, size, size);
  // The icon fills half the avatar, centred, as `h-1/2 w-1/2` does.
  const box = size / 2;
  const scale = box / Math.max(icon.width, icon.height);
  g.save();
  g.translate(
    (size - icon.width * scale) / 2,
    (size - icon.height * scale) / 2
  );
  g.scale(scale, scale);
  g.fillStyle = TAILWIND_COLORS[`${hue}-${dark ? 100 : 50}`];
  g.globalAlpha = 0.4;
  g.fill(makePath(icon.back));
  g.globalAlpha = 1;
  g.fill(makePath(icon.front));
  g.restore();
}

function paintPhoto(canvas: CanvasLike, photo: ShareImage) {
  const g = canvas.getContext('2d') as Ctx;
  const size = canvas.width;
  const scale = Math.max(size / photo.width, size / photo.height);
  const w = photo.width * scale;
  const h = photo.height * scale;
  g.drawImage(photo as CanvasImageSource, (size - w) / 2, (size - h) / 2, w, h);
}

/** One square image per person: their photo where it loads, the generated avatar otherwise. */
export async function loadShareAvatars(
  people: ShareAvatarPerson[],
  {
    loader,
    makePath,
    dark,
  }: {
    loader: ShareAssetLoader;
    makePath: (d: string) => Path2D;
    dark: boolean;
  }
): Promise<ShareImage[]> {
  return Promise.all(
    people.map(async person => {
      const canvas = loader.createCanvas(AVATAR_PX, AVATAR_PX);
      const photo = person.photo
        ? await loader.loadImage(person.photo).catch(() => null)
        : null;
      if (photo) paintPhoto(canvas, photo);
      else paintFallbackAvatar(canvas, person.seed, dark, makePath);
      return canvas;
    })
  );
}
