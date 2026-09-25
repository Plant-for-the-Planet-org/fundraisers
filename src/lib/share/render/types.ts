import type { ShareFormatId } from '../formats';
import type { SeasonId } from './seasons';
import type { ShareBackground } from './theme-background';

/** A 2D context from the browser or from `@napi-rs/canvas` on the server. Both implement the same drawing calls. */
export type Ctx = CanvasRenderingContext2D;

/** Anything `drawImage` accepts: an HTMLImageElement in the browser, a `@napi-rs/canvas` Image on the server. */
export interface ShareImage {
  width: number;
  height: number;
}

/** Everything the image says, already translated and formatted by the caller. */
export interface ShareRenderData {
  name: string;
  /** "by Maya Schneider". */
  byLine: string;
  raised: number;
  /** Null hides the ring and the percentage, for a fundraiser that hides its goal. */
  goal: number | null;
  formatMoney: (amount: number) => string;
  /** "€3,400 raised of €5,000", or "€3,400 raised" when `goal` is null. Called every frame with the counted-up amount. */
  raisedLine: (raised: string, goal: string | null) => string;
  /** First names of public donors, top donors first. Their avatars, or initials until those load, fill the avatar row. */
  donors: string[];
  /** "Anna, Ben and 46 others have given". Null hides the avatar row. */
  donorsLine: string | null;
  /** "Be the first to give", shown in place of the avatar row before anyone has given. */
  firstLine: string | null;
  /** Replaces the percentage in the ring's badge, such as "New" before anyone has given. */
  badge: string | null;
  cta: string;
  /** The fundraiser has ended: confetti falls, whatever the style, and the button thanks people. */
  concluded: boolean;
  /** Shown under the button, without the protocol. */
  url: string;
}

export interface ShareRenderTheme {
  accent: string;
  mode: 'light' | 'dark';
  /** CSS font family names, already loaded in the browser or registered on the server. */
  titleFont: string;
  bodyFont: string;
  season: SeasonId;
}

export interface ShareRenderOptions {
  format: ShareFormatId;
  data: ShareRenderData;
  theme: ShareRenderTheme;
  photo: ShareImage | null;
  /** The fundraiser page's own background. Without it, the image uses a wash of the accent. */
  background?: ShareBackground | null;
  /** One image per donor in `data.donors`: their photo, or the app's generated avatar. */
  avatars?: Array<ShareImage | null> | null;
  /** Pixel density: the canvas is `scale` times the format's size. Images export at 2 for sharp text; video stays at 1. */
  scale?: number;
  /** Draws the safe zone, for checking a layout. Never on for files people share. */
  guides?: boolean;
}

export interface Palette {
  bg: string;
  glow: string;
  dot: string;
  text: string;
  muted: string;
  track: string;
  bar: string;
  ctaBg: string;
  ctaText: string;
  ctaShadow: string;
  ctaOutline: string;
  sparkle: string;
  tick: string;
  avatarRing: string;
  tip: string;
  tipGlow: string;
  badgeBg: string;
  badgeText: string;
  frame: string;
  avatars: string[];
}

export interface Fonts {
  title: string;
  body: string;
}

/** What every piece needs to draw one frame. */
export interface FrameContext {
  t: number;
  P: Palette;
  season: Season;
  data: ShareRenderData;
  photo: ShareImage | null;
  background: ShareBackground | null;
  avatars: Array<ShareImage | null>;
  dark: boolean;
  fonts: Fonts;
  /** The widest the button may grow, set by the layout before it draws the button. */
  maxCtaWidth: number;
}

export interface TickOptions {
  cx: number;
  cy: number;
  r: number;
  start: number;
  sweep: number;
  /** Share of the ring filled so far, 0 to 1. */
  reached: number;
  t: number;
  k: number;
  alpha: number;
  P: Palette;
}

/** A seasonal look: an optional palette and drawing hooks. The plain theme is a season with no hooks. */
export interface Season {
  palette?: () => Palette;
  background?: (g: Ctx, w: number, h: number, t: number) => void;
  ticks?: (g: Ctx, options: TickOptions) => void;
  tip?: (
    g: Ctx,
    x: number,
    y: number,
    t: number,
    k: number,
    P: Palette
  ) => void;
  behindPhoto?: (
    g: Ctx,
    cx: number,
    cy: number,
    r: number,
    t: number,
    k: number
  ) => void;
  photoDecor?: (
    g: Ctx,
    cx: number,
    cy: number,
    r: number,
    t: number,
    k: number
  ) => void;
  /** Drawn inside the button's own transform, after its fill. */
  ctaDecor?: (g: Ctx, w: number, h: number, k: number) => void;
  /** Drawn after the button, in canvas space. */
  ctaAround?: (
    g: Ctx,
    cx: number,
    cy: number,
    w: number,
    h: number,
    t: number,
    k: number,
    P: Palette
  ) => void;
  /** Extra room under the button, for decorations that hang below it. */
  urlGap?: number;
}
