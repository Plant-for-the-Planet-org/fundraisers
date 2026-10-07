import type { AnimationType, BgSettings, Theme } from '@/lib/theme/types';
import type { Ctx, ShareImage } from './types';

import { getAccentColor } from '@/lib/theme/accent-utils';
import {
  DEFAULT_PATTERN_TILE,
  LOGO_LIBRARY,
  resolveBgAsset,
} from '@/lib/theme/backgrounds';
import { getDominantStopColor, isValidHexColor } from '@/lib/theme/color-utils';
import { hexToRgb } from './primitives';
import { TAILWIND_COLORS } from './tailwind-colors';

/**
 * The fundraiser page's background, rebuilt for a canvas. Layers, back to front, as ThemeShell paints them:
 * mode base (white or black) · wash (preset gradient, custom gradient or solid colour) · decoration (image, pattern or logo) · animation.
 */

export type Corner = 't' | 'tr' | 'r' | 'br' | 'b' | 'bl' | 'l' | 'tl';

export interface WashStop {
  color: string;
  alpha: number;
  /** 0 to 1 along the gradient line. */
  position: number;
}

export type ShareWash =
  | {
      kind: 'gradient';
      /** A CSS angle in degrees, or a Tailwind `to-*` direction. */
      direction: { angle: number } | { corner: Corner };
      stops: WashStop[];
      opacity: number;
    }
  | { kind: 'solid'; color: string; alpha: number; opacity: number };

export type ShareDecoration =
  | {
      kind: 'image';
      src: string;
      repeat: boolean;
      tile: [number, number];
      opacity: number;
      /** Multiplied over the image, capped at 0.55 like the page. */
      overlay: string | null;
    }
  | {
      kind: 'pattern';
      src: string;
      /** A white stencil painted with `color`, rather than an image drawn as it is. */
      masked: boolean;
      fullBleed: boolean;
      tile: [number, number];
      opacity: number;
      color: string;
    }
  | { kind: 'logo'; src: string; opacity: number; invert: boolean };

export interface ShareBackgroundSpec {
  base: '#ffffff' | '#000000';
  wash: ShareWash | null;
  decoration: ShareDecoration | null;
  animation: AnimationType;
}

/** Loaded images for the decoration. A masked pattern is already painted in its colour; a logo is its repeating tile. */
export interface ShareBackgroundAssets {
  image?: ShareImage | null;
  pattern?: ShareImage | null;
  logo?: ShareImage | null;
}

export interface ShareBackground {
  spec: ShareBackgroundSpec;
  assets: ShareBackgroundAssets;
}

// Same default as ThemeShell for rows saved before the wash opacity was adjustable.
const TINT_OPACITY = 0.14;

// Tailwind positions: `from` at 0%, `via` at 50%, `to` at 100%.
const STOP_POSITIONS = { from: 0, via: 0.5, to: 1 } as const;

function parseColorToken(
  token: string
): { color: string; alpha: number } | null {
  const [name, alphaPart] = token.split('/');
  const color = name === 'transparent' ? '#000000' : TAILWIND_COLORS[name];
  if (!color) return null;
  const alpha =
    name === 'transparent' ? 0 : alphaPart ? Number(alphaPart) / 100 : 1;
  return Number.isFinite(alpha) ? { color, alpha } : null;
}

/**
 * A Tailwind background class, such as `bg-gradient-to-br from-rose-300/50 via-pink-200/45 to-purple-100/40` or `bg-gray-900`.
 * Only the utilities the theme presets use are understood. Anything else returns null, which leaves the mode base on its own.
 */
export function parseTailwindBackground(className: string): ShareWash | null {
  const tokens = className.trim().split(/\s+/).filter(Boolean);
  const gradient = tokens.find(token =>
    /^bg-(gradient|linear)-to-/.test(token)
  );
  if (gradient) {
    const corner = gradient.replace(/^bg-(gradient|linear)-to-/, '') as Corner;
    const stops: Partial<
      Record<keyof typeof STOP_POSITIONS, { color: string; alpha: number }>
    > = {};
    for (const token of tokens) {
      const match = token.match(/^(from|via|to)-(.+)$/);
      if (!match) continue;
      const parsed = parseColorToken(match[2]);
      // As in CSS, a later `via-` replaces an earlier one.
      if (parsed) stops[match[1] as keyof typeof STOP_POSITIONS] = parsed;
    }
    // Tailwind fades an unset end to transparent.
    const transparent = { color: '#000000', alpha: 0 };
    const list: WashStop[] = [
      { ...(stops.from ?? transparent), position: STOP_POSITIONS.from },
      ...(stops.via ? [{ ...stops.via, position: STOP_POSITIONS.via }] : []),
      { ...(stops.to ?? transparent), position: STOP_POSITIONS.to },
    ];
    return { kind: 'gradient', direction: { corner }, stops: list, opacity: 1 };
  }
  const solid = tokens.find(token => token.startsWith('bg-'));
  const parsed = solid ? parseColorToken(solid.slice(3)) : null;
  return parsed ? { kind: 'solid', ...parsed, opacity: 1 } : null;
}

function parseTile(size: string): [number, number] {
  const [w, h] = size.split(/\s+/).map(part => parseFloat(part));
  return [w || 115, h || w || 77];
}

/** The page's `--theme-bg-color`: the chosen colour at full strength, or the accent. */
function tintColor(bg: BgSettings, accent: string): string {
  if (
    !bg.gradient &&
    bg.custom_gradient &&
    bg.custom_gradient.stops.length >= 2
  ) {
    const dominant = getDominantStopColor(bg.custom_gradient.stops);
    if (isValidHexColor(dominant)) return dominant;
  }
  if (!bg.gradient && isValidHexColor(bg.background_color))
    return bg.background_color;
  return accent;
}

function resolveWash(bg: BgSettings): ShareWash | null {
  // Same priority as ThemeShell: preset class, then custom gradient, then solid colour.
  if (bg.gradient) return parseTailwindBackground(bg.gradient);
  const opacity = bg.background_opacity ?? TINT_OPACITY;
  const custom = bg.custom_gradient;
  if (
    custom &&
    custom.stops.length >= 2 &&
    custom.stops.every(stop => isValidHexColor(stop.color))
  ) {
    return {
      kind: 'gradient',
      direction: { angle: custom.angle },
      stops: [...custom.stops]
        .sort((a, b) => a.position - b.position)
        .map(stop => ({
          color: stop.color,
          alpha: 1,
          position: stop.position / 100,
        })),
      opacity,
    };
  }
  if (isValidHexColor(bg.background_color)) {
    return { kind: 'solid', color: bg.background_color, alpha: 1, opacity };
  }
  return null;
}

function resolveDecoration(
  theme: Theme,
  accent: string
): ShareDecoration | null {
  const { bg } = theme;
  const tint = tintColor(bg, accent);
  if (bg.decoration === 'image' && bg.image_url) {
    const resolved = resolveBgAsset(bg.image_url);
    if (!resolved) return null;
    const imageTint = bg.image_tint ?? 'background';
    return {
      kind: 'image',
      src: resolved.kind === 'library' ? resolved.asset.src : resolved.src,
      repeat: bg.image_mode === 'repeat',
      tile: parseTile(
        resolved.kind === 'library'
          ? (resolved.asset.tileSize ?? DEFAULT_PATTERN_TILE)
          : DEFAULT_PATTERN_TILE
      ),
      opacity: bg.opacity,
      overlay:
        imageTint === 'custom' && isValidHexColor(bg.image_color)
          ? bg.image_color
          : imageTint === 'accent'
            ? accent
            : imageTint === 'background'
              ? tint
              : null,
    };
  }
  if (bg.decoration === 'pattern' && bg.pattern_id) {
    const resolved = resolveBgAsset(bg.pattern_id);
    if (!resolved) return null;
    const asset = resolved.kind === 'library' ? resolved.asset : null;
    const patternTint = bg.pattern_tint ?? 'accent';
    return {
      kind: 'pattern',
      src: asset ? asset.src : (resolved as { src: string }).src,
      masked: asset?.masked ?? false,
      fullBleed: asset?.fullBleed ?? false,
      tile: parseTile(asset?.tileSize ?? DEFAULT_PATTERN_TILE),
      opacity: bg.opacity,
      color:
        patternTint === 'custom' && isValidHexColor(bg.pattern_color)
          ? bg.pattern_color
          : patternTint === 'background'
            ? tint
            : accent,
    };
  }
  if (bg.decoration === 'logo' && bg.logo_id) {
    const logo = LOGO_LIBRARY.find(entry => entry.id === bg.logo_id);
    return logo
      ? {
          kind: 'logo',
          src: logo.src,
          opacity: bg.opacity,
          invert: theme.mode === 'dark',
        }
      : null;
  }
  return null;
}

/** The background of a built theme (see `buildTheme`), ready to load and paint. */
export function resolveShareBackground(theme: Theme): ShareBackgroundSpec {
  const accent = getAccentColor(theme.accent);
  return {
    base: theme.mode === 'dark' ? '#000000' : '#ffffff',
    wash: resolveWash(theme.bg),
    decoration: resolveDecoration(theme, accent),
    animation: theme.bg.animation,
  };
}

// ---------- Loading ----------

/** Just enough of a canvas for both the browser and `@napi-rs/canvas`. */
export interface CanvasLike extends ShareImage {
  getContext(type: '2d'): unknown;
}

export interface ShareAssetLoader {
  loadImage: (src: string) => Promise<ShareImage | null>;
  createCanvas: (width: number, height: number) => CanvasLike;
}

const ctxOf = (canvas: CanvasLike) => canvas.getContext('2d') as Ctx;

// Masks are drawn at up to this size, enough for a 1920px side after cover scaling.
const MASK_MAX = 1920;
// The page tiles logos in a 100 × 200 CSS px unit; share images are about four times a phone's CSS width.
const LOGO_TILE = 400;

/** A white stencil, painted in `color`: the canvas version of the page's CSS mask. */
function paintMask(
  mask: ShareImage,
  color: string,
  loader: ShareAssetLoader
): ShareImage {
  const scale = Math.min(1, MASK_MAX / Math.max(mask.width, mask.height)) || 1;
  const canvas = loader.createCanvas(
    Math.round(mask.width * scale),
    Math.round(mask.height * scale)
  );
  const g = ctxOf(canvas);
  g.fillStyle = color;
  g.fillRect(0, 0, canvas.width, canvas.height);
  g.globalCompositeOperation = 'destination-in';
  g.drawImage(mask as CanvasImageSource, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** The page's half-drop logo tile: one logo centred in the top row, the bottom row shifted by half a tile. */
function buildLogoTile(
  logo: ShareImage,
  invert: boolean,
  loader: ShareAssetLoader
): ShareImage {
  const w = LOGO_TILE;
  const canvas = loader.createCanvas(w, w * 2);
  const g = ctxOf(canvas);
  const logoH = w * 0.4;
  const logoW = Math.min(w, (logo.width / logo.height) * logoH);
  const topY = (w - logoH) / 2;
  const place = (cx: number, y: number) =>
    g.drawImage(logo as CanvasImageSource, cx - logoW / 2, y, logoW, logoH);
  place(w / 2, topY);
  place(0, w + topY);
  place(w, w + topY);
  if (invert) {
    // Invert the colours and keep the shapes: difference with white, then cut back to the logos.
    const shapes = loader.createCanvas(w, w * 2);
    ctxOf(shapes).drawImage(canvas as CanvasImageSource, 0, 0);
    g.globalCompositeOperation = 'difference';
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, w, w * 2);
    g.globalCompositeOperation = 'destination-in';
    g.drawImage(shapes as CanvasImageSource, 0, 0);
  }
  return canvas;
}

export async function loadShareBackgroundAssets(
  spec: ShareBackgroundSpec,
  loader: ShareAssetLoader
): Promise<ShareBackgroundAssets> {
  const decoration = spec.decoration;
  if (!decoration) return {};
  const image = await loader.loadImage(decoration.src).catch(() => null);
  if (!image) return {};
  switch (decoration.kind) {
    case 'image':
      return { image };
    case 'pattern':
      return {
        pattern: decoration.masked
          ? paintMask(image, decoration.color, loader)
          : image,
      };
    case 'logo':
      return { logo: buildLogoTile(image, decoration.invert, loader) };
  }
}

// ---------- Painting ----------

function rgbaOf(hex: string, alpha: number) {
  return `rgba(${hexToRgb(hex).join(',')},${alpha})`;
}

/** The CSS gradient line for an angle or a `to-*` direction, over a w × h box. */
function gradientLine(
  direction: { angle: number } | { corner: Corner },
  w: number,
  h: number
) {
  let angle: number;
  if ('angle' in direction) angle = direction.angle;
  else {
    // A corner direction makes the 0% and 100% lines pass through the corners, so its angle depends on the box.
    const toCorner: Record<Corner, number> = {
      t: 0,
      r: 90,
      b: 180,
      l: 270,
      tr: (Math.atan2(h, w) * 180) / Math.PI,
      br: 180 - (Math.atan2(h, w) * 180) / Math.PI,
      bl: 180 + (Math.atan2(h, w) * 180) / Math.PI,
      tl: 360 - (Math.atan2(h, w) * 180) / Math.PI,
    };
    angle = toCorner[direction.corner] ?? 180;
  }
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
  return {
    x0: w / 2 - dx * half,
    y0: h / 2 - dy * half,
    x1: w / 2 + dx * half,
    y1: h / 2 + dy * half,
  };
}

function drawCover(g: Ctx, image: ShareImage, w: number, h: number) {
  const scale = Math.max(w / image.width, h / image.height);
  const dw = image.width * scale;
  const dh = image.height * scale;
  g.drawImage(image as CanvasImageSource, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

function drawTiled(
  g: Ctx,
  image: ShareImage,
  w: number,
  h: number,
  tileW: number,
  tileH: number,
  centred = false
) {
  // `background-position: center` puts one tile in the middle; `top left` starts at the corner.
  const x0 = centred
    ? (((((w - tileW) / 2) % tileW) + tileW) % tileW) - tileW
    : 0;
  const y0 = centred
    ? (((((h - tileH) / 2) % tileH) + tileH) % tileH) - tileH
    : 0;
  for (let y = y0; y < h; y += tileH) {
    for (let x = x0; x < w; x += tileW)
      g.drawImage(image as CanvasImageSource, x, y, tileW, tileH);
  }
}

/**
 * Paints the static layers: base, wash and decoration. The animation is drawn per frame by the renderer.
 * Decoration sizes on the page are CSS pixels on a screen; here they are scaled as if the image were a phone screen about 400 CSS px wide.
 */
export function paintShareBackground(
  g: Ctx,
  w: number,
  h: number,
  { spec, assets }: ShareBackground
) {
  g.save();
  g.fillStyle = spec.base;
  g.fillRect(0, 0, w, h);

  const wash = spec.wash;
  if (wash) {
    g.globalAlpha = wash.opacity;
    if (wash.kind === 'solid') g.fillStyle = rgbaOf(wash.color, wash.alpha);
    else {
      const line = gradientLine(wash.direction, w, h);
      const gradient = g.createLinearGradient(
        line.x0,
        line.y0,
        line.x1,
        line.y1
      );
      for (const stop of wash.stops)
        gradient.addColorStop(
          Math.min(1, Math.max(0, stop.position)),
          rgbaOf(stop.color, stop.alpha)
        );
      g.fillStyle = gradient;
    }
    g.fillRect(0, 0, w, h);
    g.globalAlpha = 1;
  }

  const decoration = spec.decoration;
  const scale = w / 400;
  if (decoration?.kind === 'image' && assets.image) {
    g.globalAlpha = decoration.opacity;
    if (decoration.repeat)
      drawTiled(
        g,
        assets.image,
        w,
        h,
        decoration.tile[0] * scale,
        decoration.tile[1] * scale,
        true
      );
    else drawCover(g, assets.image, w, h);
    if (decoration.overlay) {
      g.globalCompositeOperation = 'multiply';
      g.globalAlpha = Math.min(decoration.opacity, 0.55);
      g.fillStyle = decoration.overlay;
      g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'source-over';
    }
  } else if (decoration?.kind === 'pattern' && assets.pattern) {
    g.globalAlpha = decoration.opacity;
    if (decoration.fullBleed) drawCover(g, assets.pattern, w, h);
    else
      drawTiled(
        g,
        assets.pattern,
        w,
        h,
        decoration.tile[0] * scale,
        decoration.tile[1] * scale
      );
  } else if (decoration?.kind === 'logo' && assets.logo) {
    g.globalAlpha = decoration.opacity;
    // The tile is 100 × 200 CSS px on the page.
    drawTiled(g, assets.logo, w, h, 100 * scale, 200 * scale);
  }
  g.restore();
}
