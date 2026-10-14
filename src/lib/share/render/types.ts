import type { FontId } from '@/lib/theme/types';
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
  /** "€3,400 raised of €5,000", or "€3,400 raised" when `goal` is null. Called every frame with the counted-up amount. Null leaves the amount out, for a fundraiser that hides its goal section. */
  raisedLine: ((raised: string, goal: string | null) => string) | null;
  /** The donor's own gift, such as "I just gave €50!", in a pill under the amount. Null leaves it out. */
  giftLine: string | null;
  /** First names of public donors, top donors first. Their avatars, or initials until those load, fill the avatar row. */
  donors: string[];
  /** "Anna, Ben and 46 others have given". Null hides the avatar row. */
  donorsLine: string | null;
  /** "Be the first to give", shown in place of the avatar row before anyone has given. */
  firstLine: string | null;
  /** Replaces the percentage in the ring's badge, such as "New" before anyone has given. */
  badge: string | null;
  /** The host's own line, under the host name: why this fundraiser matters to them. Wrapped to three lines. */
  note?: string | null;
  /**
   * The Impact card's content: how many projects the fundraiser supports, and their names (at most five).
   * It carries no shares or amounts: the card is about the impact being made, not how the gifts are split.
   * Null leaves it out. The link preview never sets it.
   */
  impact?: {
    label: string;
    names: readonly string[];
    /** How many more projects there are than names. */
    more: number;
  } | null;
  cta: string;
  /** The fundraiser has ended: confetti falls, whatever the style, and the button thanks people. */
  concluded: boolean;
  /** Shown under the button, without the protocol. */
  url: string;
}

/**
 * What a share image is built around.
 * `progress` is the ring and the donors: the link preview and the donor's thank-you use it.
 * `impact` is the ring and where the money goes, as a bar for each project.
 * `minimal` is a small photo, the title and a thin bar: sparse and sophisticated.
 * `story` is a large photo, shown whole, with the host's own words.
 */
export const SHARE_CARD_IDS = [
  'progress',
  'impact',
  'minimal',
  'story',
] as const;
export type ShareCardId = (typeof SHARE_CARD_IDS)[number];

export interface ShareRenderTheme {
  accent: string;
  mode: 'light' | 'dark';
  /** CSS font family names, already loaded in the browser or registered on the server. */
  titleFont: string;
  bodyFont: string;
  season: SeasonId;
  /** Defaults to `progress`. */
  card?: ShareCardId;
}

export interface ShareRenderOptions {
  format: ShareFormatId;
  data: ShareRenderData;
  theme: ShareRenderTheme;
  photo: ShareImage | null;
  /** The fundraiser page's own background. Without it, the image uses a wash of the accent. */
  background?: ShareBackground | null;
  /** One picture per project in `data.impact.names`, in the same order: the project's own, or null for none. Without any, the chips carry a plain mark instead. */
  projectImages?: ReadonlyArray<ShareImage | null> | null;
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
  /** The donor's gift line, in the accent. It reads on `giftPill` at 4.5:1. */
  accentText: string;
  /** The soft pill behind the donor's gift line. */
  giftPill: string;
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
  card: ShareCardId;
  data: ShareRenderData;
  photo: ShareImage | null;
  background: ShareBackground | null;
  avatars: Array<ShareImage | null>;
  projectImages: ReadonlyArray<ShareImage | null>;
  dark: boolean;
  fonts: Fonts;
  /** The widest the button may grow, set by the layout before it draws the button. */
  maxCtaWidth: number;
  /** The canvas pixels per format unit (`ShareRenderOptions.scale`). */
  scale: number;
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
  /** A look's own typefaces, in place of the fundraiser page's. The studio resolves them in the browser; the link preview never uses a look. */
  fonts?: { title: FontId; body: FontId };
  /** Draws the name in capitals. */
  uppercaseTitle?: boolean;
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
