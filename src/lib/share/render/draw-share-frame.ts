// Link preview URLs are immutable snapshots. If a change here can alter the link preview banner (the `banner` format) for the same fundraiser, bump SHARE_IMAGE_DESIGN_VERSION in ./design-version.ts.
// Without the bump, a fundraiser keeps its old cached preview until something on it changes, and an ended one keeps it for good. share-banner.test.ts fails until you do.
import type { ShareFormat, ShareSizes, ShareZone } from '../formats';
import type {
  Ctx,
  FrameContext,
  Palette,
  ShareImage,
  ShareRenderData,
  ShareRenderOptions,
  ShareRenderTheme,
} from './types';

import { SHARE_FORMATS, SHARE_VIDEO_SECONDS } from '../formats';
import { drawThemeAnimation } from './animations';
import {
  accentGraphicOnLight,
  accentTextOnWhite,
  giftPillOnDark,
  giftPillOnLight,
  textOnAccent,
} from './contrast';
import {
  backOut,
  drawArrow,
  drawSparkle,
  fitFont,
  mix,
  mixHex,
  phase,
  rgba,
  roundRect,
  wrapBalanced,
} from './primitives';
import { SEASONS } from './seasons';
import { paintShareBackground } from './theme-background';

type Align = 'center' | 'left';

/** The Minimal and Story cards: a photo shown whole and a thin bar, in place of the ring and the donors. */
const isPlain = (f: FrameContext) => f.card === 'minimal' || f.card === 'story';

// Timeline, in seconds. Everything has landed by about 3.4 s; the rest of the video holds.
const RING_START = 1.0;
const RING_END = 2.8;
const CTA_START = 2.4;

// The donor's gift sits in a pill, its text a fifth larger than the amount. Padding and height are in gift font sizes.
const GIFT_SCALE = 1.2;
const PILL_PAD = 0.8;
const PILL_HEIGHT = 1.6;

/** A font in the given weight and family, by size, for fitFont. */
const fontOf = (weight: number, family: string) => (size: number) =>
  `${weight} ${size}px ${family}`;

/**
 * The name's font size. A word wider than the column, such as a German compound, makes the name up to a fifth smaller so the word stays whole.
 * A word that needs more (a title with no spaces, in Japanese say) keeps the full size and breaks between characters instead.
 */
function titleSize(
  g: Ctx,
  name: string,
  maxWidth: number,
  size: number,
  font: (size: number) => string
): number {
  g.font = font(size);
  const widest = name
    .split(' ')
    .reduce((a, b) =>
      g.measureText(b).width > g.measureText(a).width ? b : a
    );
  const fitted = fitFont(
    g,
    widest,
    maxWidth,
    size,
    font,
    Math.ceil(size * 0.8)
  );
  return g.measureText(widest).width <= maxWidth ? fitted : size;
}

function themePalette({ accent: a, mode }: ShareRenderTheme): Palette {
  const graphic = accentGraphicOnLight(a);
  const avatars = [
    mix(a, '#000000', 0.15),
    mix(a, '#ffffff', 0.25),
    mix(a, '#000000', 0.35),
    mix(a, '#ffffff', 0.45),
    mix(a, '#000000', 0.05),
  ];
  // Dark: a deep version of the accent with light text. Light: a pale wash of the accent with dark text.
  const darkBg = mixHex(a, '#050505', 0.72);
  const pill = mode === 'dark' ? giftPillOnDark(a, darkBg) : giftPillOnLight(a);
  return mode === 'dark'
    ? {
        bg: darkBg,
        glow: rgba(a, 0.55),
        dot: mix(a, '#ffffff', 0.6),
        text: '#ffffff',
        muted: 'rgba(255,255,255,0.75)',
        accentText: pill.text,
        giftPill: pill.fill,
        track: 'rgba(255,255,255,0.2)',
        bar: mix(a, '#ffffff', 0.45),
        ctaBg: '#ffffff',
        ctaText: accentTextOnWhite(a),
        ctaShadow: mix(a, '#000000', 0.55),
        ctaOutline: mix(a, '#000000', 0.55),
        sparkle: mix(a, '#ffffff', 0.7),
        tick: 'rgba(255,255,255,0.35)',
        avatarRing: mix(a, '#050505', 0.6),
        tip: '#ffffff',
        tipGlow: 'rgba(255,255,255,0.6)',
        badgeBg: '#ffffff',
        badgeText: accentTextOnWhite(a),
        frame: '#ffffff',
        avatars,
      }
    : {
        bg: mix(a, '#ffffff', 0.9),
        glow: rgba(a, 0.25),
        dot: a,
        text: '#111111',
        muted: 'rgba(17,17,17,0.65)',
        accentText: pill.text,
        giftPill: pill.fill,
        track: rgba(a, 0.18),
        bar: graphic,
        ctaBg: a,
        ctaText: textOnAccent(a),
        ctaShadow: mix(a, '#000000', 0.45),
        ctaOutline: mix(a, '#000000', 0.45),
        sparkle: graphic,
        tick: rgba(a, 0.35),
        avatarRing: '#ffffff',
        tip: mixHex(graphic, '#000000', 0.2),
        tipGlow: rgba(a, 0.45),
        badgeBg: a,
        badgeText: textOnAccent(a),
        frame: '#ffffff',
        avatars,
      };
}

// ---------- Pieces ----------

function drawBackground(
  g: Ctx,
  f: FrameContext,
  w: number,
  h: number,
  glowX: number,
  glowY: number
) {
  const { P, season, t, background } = f;
  // The plain style and Birthday sit on the fundraiser page's own background; Christmas and Halloween bring their own colours.
  const themed = background && !season.palette;
  if (themed) paintShareBackground(g, w, h, background);
  else {
    g.fillStyle = P.bg;
    g.fillRect(0, 0, w, h);
  }
  const glow = g.createRadialGradient(
    glowX,
    glowY,
    0,
    glowX,
    glowY,
    Math.max(w, h) * 0.5
  );
  glow.addColorStop(0, P.glow);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, w, h);
  if (season.background) {
    season.background(g, w, h, t);
    return;
  }
  // An ended fundraiser celebrates, unless a style brings its own background.
  if (f.data.concluded) {
    drawThemeAnimation(g, 'confetti', w, h, t, f.dark);
    return;
  }
  if (themed && background.spec.animation !== 'none') {
    drawThemeAnimation(g, background.spec.animation, w, h, t, f.dark);
    return;
  }
  // The page's own pattern or image is the texture; the dots only fill a plain background.
  if (themed && background.spec.decoration) return;
  // A dot grid that pulses out from the ring in a slow wave.
  const gap = 54;
  g.fillStyle = P.dot;
  for (let y = gap / 2; y < h; y += gap) {
    for (let x = gap / 2; x < w; x += gap) {
      const wave = Math.sin(t * 2.2 - Math.hypot(x - glowX, y - glowY) / 110);
      g.globalAlpha = 0.14 + (0.16 * (wave + 1)) / 2;
      g.beginPath();
      g.arc(x, y, 2.5 + (2 * (wave + 1)) / 2, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.globalAlpha = 1;
}

/** Round photo inside a 270 degree ring; `size` is the square the whole gauge fits in. */
function drawGauge(
  g: Ctx,
  f: FrameContext,
  cx: number,
  cy: number,
  size: number
) {
  const { t, P, season, data, photo, fonts } = f;
  const k = size / 640;
  const ringR = size / 2 - 32 * k;
  const ringW = 28 * k;
  const photoR = ringR - 44 * k;
  const start = Math.PI * 0.75;
  const sweep = Math.PI * 1.5;
  const pIn = phase(t, 0, 0.7);
  const pBar = phase(t, RING_START, RING_END);
  // The ring stops when full; the badge keeps counting past 100%.
  const ratio = data.goal ? data.raised / data.goal : 0;
  const share = Math.min(1, ratio);

  g.save();
  g.globalAlpha = pIn;
  const scaleIn = 0.9 + 0.1 * pIn;
  g.translate(cx, cy);
  g.scale(scaleIn, scaleIn);
  g.translate(-cx, -cy);

  if (data.goal) {
    g.lineCap = 'round';
    g.lineWidth = ringW;
    g.strokeStyle = P.track;
    g.beginPath();
    g.arc(cx, cy, ringR, start, start + sweep);
    g.stroke();
    const end = start + sweep * share * pBar;
    if (pBar > 0) {
      g.strokeStyle = P.bar;
      g.beginPath();
      g.arc(cx, cy, ringR, start, end);
      g.stroke();
    }

    const tickR = ringR + ringW / 2 + 18 * k;
    if (season.ticks) {
      season.ticks(g, {
        cx,
        cy,
        r: tickR,
        start,
        sweep,
        reached: share * pBar,
        t,
        k,
        alpha: pIn,
        P,
      });
    } else {
      g.fillStyle = P.tick;
      for (let i = 0; i <= 20; i++) {
        const ang = start + sweep * (i / 20);
        g.beginPath();
        g.arc(
          cx + tickR * Math.cos(ang),
          cy + tickR * Math.sin(ang),
          (i % 5 === 0 ? 5 : 3) * k,
          0,
          Math.PI * 2
        );
        g.fill();
      }
    }
    g.globalAlpha = pIn;

    if (share === 0) {
      // Nothing raised yet: a soft glow pulses where the ring will start filling.
      const sx = cx + ringR * Math.cos(start);
      const sy = cy + ringR * Math.sin(start);
      // Brightest on the last frame, which is also the still image.
      const pulse = 0.55 + 0.45 * Math.cos((t - SHARE_VIDEO_SECONDS) * 3);
      const glow = g.createRadialGradient(sx, sy, 0, sx, sy, 60 * k);
      glow.addColorStop(0, P.tipGlow);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = pIn * pulse;
      g.fillStyle = glow;
      g.beginPath();
      g.arc(sx, sy, 60 * k, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = pIn;
    } else if (pBar > 0) {
      const tx = cx + ringR * Math.cos(end);
      const ty = cy + ringR * Math.sin(end);
      const tipGlow = g.createRadialGradient(tx, ty, 0, tx, ty, 50 * k);
      tipGlow.addColorStop(0, P.tipGlow);
      tipGlow.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = tipGlow;
      g.beginPath();
      g.arc(tx, ty, 50 * k, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = pIn;
      if (season.tip) season.tip(g, tx, ty, t, k, P);
      else {
        g.fillStyle = P.tip;
        g.beginPath();
        g.arc(tx, ty, ringW / 2 + 4 * k, 0, Math.PI * 2);
        g.fill();
      }
    }
  }

  season.behindPhoto?.(g, cx, cy, photoR, t, k);
  g.globalAlpha = pIn;
  g.shadowColor = 'rgba(0,0,0,0.3)';
  // Shadows ignore the canvas scale, so a denser canvas scales them by hand.
  g.shadowBlur = 50 * k * f.scale;
  g.shadowOffsetY = 16 * k * f.scale;
  g.fillStyle = P.frame;
  g.beginPath();
  g.arc(cx, cy, photoR + 10 * k, 0, Math.PI * 2);
  g.fill();
  g.shadowColor = 'transparent';
  g.save();
  g.beginPath();
  g.arc(cx, cy, photoR, 0, Math.PI * 2);
  g.clip();
  if (photo) {
    // A slow zoom out over the whole video.
    const zoom = 1.15 - 0.15 * (t / SHARE_VIDEO_SECONDS);
    const cover = ((photoR * 2) / Math.min(photo.width, photo.height)) * zoom;
    g.drawImage(
      photo as CanvasImageSource,
      cx - (photo.width * cover) / 2,
      cy - (photo.height * cover) / 2,
      photo.width * cover,
      photo.height * cover
    );
  } else {
    g.fillStyle = P.bar;
    g.fillRect(cx - photoR, cy - photoR, photoR * 2, photoR * 2);
  }
  g.restore();
  season.photoDecor?.(g, cx, cy, photoR, t, k);

  if (data.goal) {
    const pct = data.badge ?? `${Math.round(ratio * 100 * pBar)}%`;
    g.globalAlpha = pIn;
    g.font = `800 ${44 * k}px ${fonts.body}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const bw = Math.max(150 * k, g.measureText(pct).width + 60 * k);
    const by = cy + ringR - 8 * k;
    g.fillStyle = P.badgeBg;
    roundRect(g, cx - bw / 2, by - 36 * k, bw, 72 * k, 36 * k);
    g.fill();
    g.fillStyle = P.badgeText;
    g.fillText(pct, cx, by + 2 * k);
  }
  g.restore();
}

/** Name, host, amount and the donor's gift line, if there is one. Returns the height used; with `measureOnly` it draws nothing. */
function drawTitle(
  g: Ctx,
  f: FrameContext,
  x: number,
  y: number,
  align: Align,
  maxWidth: number,
  s: ShareSizes,
  measureOnly = false
): number {
  const { t, P, data, fonts } = f;
  const giftLine = data.giftLine;
  const giftWidth = (size: number) => {
    g.font = `800 ${size}px ${fonts.body}`;
    return g.measureText(giftLine ?? '').width + 2 * PILL_PAD * size;
  };
  let giftFont = 0;
  if (giftLine) {
    giftFont = Math.round(s.raised * GIFT_SCALE);
    // A large amount in a narrow column: shrink the pill rather than let it run past the zone.
    const full = giftWidth(giftFont);
    if (full > maxWidth) {
      giftFont = Math.floor((giftFont * maxWidth) / full);
      while (giftFont > 1 && giftWidth(giftFont) > maxWidth) giftFont--;
    }
  }
  const pillH = giftFont * PILL_HEIGHT;
  const giftGap = s.raised * 0.25;

  // The Story card leads with the host's own words as the one big line; the name and host drop to supporting lines.
  const hookFirst = f.card === 'story' && Boolean(data.note?.trim());
  const caps = (text: string) =>
    f.season.uppercaseTitle ? text.toLocaleUpperCase() : text;
  const headline = caps(hookFirst ? data.note!.trim() : data.name);
  const titleFont = fontOf(700, fonts.title);
  const nameSize = titleSize(
    g,
    headline,
    maxWidth,
    hookFirst ? Math.round(s.title * 0.82) : s.title,
    titleFont
  );
  g.font = titleFont(nameSize);
  const lines = wrapBalanced(g, headline, maxWidth, 3);
  const subGap = hookFirst ? s.by * 0.4 : 0;
  const subH = hookFirst ? s.by * 1.55 + subGap : 0;
  const lineH = nameSize * 1.17;
  const byH = s.by * 1.4;
  // The host's own line, or on the Story card the story, sits between the host name and the amount.
  const isStory = f.card === 'story';
  const noteFont = fontOf(isStory ? 500 : 600, fonts.body);
  const noteText = hookFirst ? null : data.note?.trim() || null;
  let noteLines: string[] = [];
  if (noteText) {
    g.font = noteFont(s.by);
    noteLines = wrapBalanced(g, noteText, maxWidth, isStory ? 5 : 3);
  }
  const noteLineH = s.by * 1.35;
  const noteGap = noteText ? s.by * 0.35 : 0;
  const noteH = noteLines.length * noteLineH;
  const raisedLine = data.raisedLine;
  const raisedH = raisedLine ? s.raised * 1.6 : 0;
  // The name and host belong together; the amount is its own line, so it gets a little room.
  const raisedGap = raisedLine ? s.raised * 0.55 : 0;
  const giftH = giftLine ? giftGap + pillH : 0;
  const height =
    lines.length * lineH +
    subH +
    byH +
    noteGap +
    noteH +
    raisedGap +
    raisedH +
    giftH;
  if (measureOnly) return height;

  const aTitle = phase(t, 0.5, 1.1);
  const lift = (1 - aTitle) * 30;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.globalAlpha = aTitle;
  g.fillStyle = P.text;
  let cy = y;
  // The note's wrapping above changed the font, so the name's is set again.
  g.font = titleFont(nameSize);
  for (const line of lines) {
    g.fillText(line, x, cy + lineH / 2 + lift);
    cy += lineH;
  }
  // A long host name or amount shrinks to fit the column, and past that is narrowed by fillText.
  if (hookFirst) {
    fitFont(g, caps(data.name), maxWidth, s.by * 1.25, fontOf(700, fonts.body));
    g.fillStyle = P.text;
    g.fillText(
      caps(data.name),
      x,
      cy + subGap + (subH - subGap) / 2 + lift,
      maxWidth
    );
    cy += subH;
  }
  fitFont(g, data.byLine, maxWidth, s.by, fontOf(500, fonts.body));
  g.fillStyle = P.muted;
  g.fillText(data.byLine, x, cy + byH / 2 + lift, maxWidth);
  cy += byH + noteGap;
  if (noteText) {
    g.font = noteFont(s.by);
    g.fillStyle = P.text;
    for (const line of noteLines) {
      g.fillText(line, x, cy + noteLineH / 2 + lift, maxWidth);
      cy += noteLineH;
    }
  }
  cy += raisedGap;
  if (raisedLine) {
    const goalText = data.goal ? data.formatMoney(data.goal) : null;
    // Fitted to the final amount, so the size holds while the amount counts up.
    fitFont(
      g,
      raisedLine(data.formatMoney(data.raised), goalText),
      maxWidth,
      s.raised,
      fontOf(600, fonts.body)
    );
    const counted = data.raised * phase(t, RING_START, RING_END);
    g.fillStyle = P.text;
    g.fillText(
      raisedLine(data.formatMoney(counted), goalText),
      x,
      cy + raisedH / 2 + lift,
      maxWidth
    );
  }
  if (giftLine) {
    cy += raisedH + giftGap;
    const aGift = phase(t, 1.4, 2.0);
    const drop = (1 - aGift) * 20;
    const pad = PILL_PAD * giftFont;
    const pillW = giftWidth(giftFont);
    g.globalAlpha = aGift;
    g.fillStyle = P.giftPill;
    roundRect(
      g,
      align === 'center' ? x - pillW / 2 : x,
      cy + drop,
      pillW,
      pillH,
      pillH / 2
    );
    g.fill();
    g.fillStyle = P.accentText;
    // A hair below the middle, which looks centred in the pill.
    g.fillText(
      giftLine,
      align === 'center' ? x : x + pad,
      cy + pillH / 2 + giftFont * 0.04 + drop
    );
  }
  g.globalAlpha = 1;
  return height;
}

/** A thin bar for the Minimal and Story cards: the share of the goal, filling over the same time as the ring. Returns the height it takes, with its gap above; with `measureOnly` it draws nothing. */
function drawBar(
  g: Ctx,
  f: FrameContext,
  x: number,
  y: number,
  align: Align,
  maxWidth: number,
  s: ShareSizes,
  measureOnly = false
): number {
  const { t, P, data } = f;
  if (!data.goal) return 0;
  const thick = Math.max(8, Math.round(s.raised * 0.4));
  const gap = s.raised * 0.7;
  if (measureOnly) return gap + thick;
  const width = Math.min(maxWidth, s.title * 9);
  const left = align === 'center' ? x - width / 2 : x;
  const top = y + gap;
  const share =
    Math.min(1, data.raised / data.goal) * phase(t, RING_START, RING_END);
  g.globalAlpha = phase(t, 0.7, 1.3);
  g.fillStyle = P.track;
  roundRect(g, left, top, width, thick, thick / 2);
  g.fill();
  if (share > 0) {
    g.fillStyle = P.bar;
    roundRect(g, left, top, Math.max(thick, width * share), thick, thick / 2);
    g.fill();
  }
  g.globalAlpha = 1;
  return gap + thick;
}

/** The photo's size when shown whole: as wide as `maxW` allows, no taller than `maxH`, and never cropped. Without a photo it is a 4:3 placeholder. */
function fitPhoto(
  photo: ShareImage | null,
  maxW: number,
  maxH: number
): { w: number; h: number } {
  const aspect = photo ? photo.width / photo.height : 4 / 3;
  if (aspect >= maxW / maxH) return { w: maxW, h: maxW / aspect };
  return { w: maxH * aspect, h: maxH };
}

/** The Minimal and Story cards' photo: the whole picture in a rounded frame, as it was uploaded. */
function drawPhotoFrame(
  g: Ctx,
  f: FrameContext,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const { t, P, photo } = f;
  const pIn = phase(t, 0, 0.7);
  const r = Math.min(w, h) * 0.06;
  g.save();
  g.globalAlpha = pIn;
  g.shadowColor = 'rgba(0,0,0,0.25)';
  g.shadowBlur = 36 * f.scale;
  g.shadowOffsetY = 10 * f.scale;
  g.fillStyle = P.frame;
  roundRect(g, x - 7, y - 7, w + 14, h + 14, r + 7);
  g.fill();
  g.shadowColor = 'transparent';
  g.save();
  roundRect(g, x, y, w, h, r);
  g.clip();
  if (photo) g.drawImage(photo as CanvasImageSource, x, y, w, h);
  else {
    g.fillStyle = P.bar;
    g.fillRect(x, y, w, h);
  }
  g.restore();
  g.restore();
}

/** `text` cut with an ellipsis until it fits `maxWidth` in the current font. */
function ellipsize(g: Ctx, text: string, maxWidth: number): string {
  if (g.measureText(text).width <= maxWidth) return text;
  const chars = Array.from(text);
  while (
    chars.length > 1 &&
    g.measureText(`${chars.join('').trimEnd()}…`).width > maxWidth
  )
    chars.pop();
  return `${chars.join('').trimEnd()}…`;
}

/** The most rows of project chips the Impact card draws. */
const IMPACT_MAX_ROWS = 3;

/**
 * The Impact card's content: a small heading ("Supporting 5 projects") and the projects as chips.
 * A chip carries the project's own round picture when there is one, and a plain mark when not.
 * No shares and no amounts: it says what is being made possible, however many projects a bouquet holds.
 * Chips that do not fit in three rows give way to a "+N" chip. Returns the height; with `measureOnly` it draws nothing.
 */
function drawImpact(
  g: Ctx,
  f: FrameContext,
  x: number,
  y: number,
  align: Align,
  maxWidth: number,
  s: ShareSizes,
  measureOnly = false,
  maxRows = IMPACT_MAX_ROWS
): number {
  const impact = f.data.impact;
  if (!impact || impact.names.length === 0) return 0;
  const { t, P, fonts } = f;
  const size = Math.round(s.by * 0.95);
  // With pictures the chips grow to hold them. A project with no picture then gets its initial on a plain disc.
  const photos = impact.names.some((_, i) => f.projectImages[i]);
  const chipH = Math.round(size * (photos ? 2.6 : 1.9));
  const pad = Math.round(size * 0.3);
  const disc = chipH - 2 * pad;
  const padX = size * 0.8;
  const dot = size * 0.4;
  const gapX = size * 0.55;
  const gapY = size * 0.5;
  const labelH = s.by * 1.5;
  // A chip is: left padding, the picture or dot, a gap, the name, right padding.
  const padL = photos ? pad : padX * 0.7;
  const lead = (photos ? disc : dot) + size * 0.45;
  g.font = `600 ${size}px ${fonts.body}`;
  const inner = maxWidth - padL - lead - padX;
  const chipWidth = (text: string) =>
    Math.min(maxWidth, padL + lead + g.measureText(text).width + padX);

  interface Chip {
    text: string;
    /** The project's place in `impact.names`, or -1 for the "+N" chip. */
    index: number;
    w: number;
  }
  const pack = (items: Array<{ text: string; index: number }>) => {
    const rows: Chip[][] = [[]];
    let used = 0;
    for (const item of items) {
      const w =
        item.index < 0
          ? Math.min(maxWidth, g.measureText(item.text).width + 2 * padX)
          : chipWidth(item.text);
      if (used > 0 && used + gapX + w > maxWidth) {
        rows.push([]);
        used = 0;
      }
      rows[rows.length - 1].push({ ...item, w });
      used += (used > 0 ? gapX : 0) + w;
    }
    return rows;
  };
  const names = impact.names.map((name, index) => ({
    text: ellipsize(g, name, inner),
    index,
  }));
  let shown = names.length;
  let rows: Chip[][];
  for (;;) {
    const hidden = impact.more + (names.length - shown);
    rows = pack([
      ...names.slice(0, shown),
      ...(hidden > 0 ? [{ text: `+${hidden}`, index: -1 }] : []),
    ]);
    if (rows.length <= maxRows || shown <= 1) break;
    shown--;
  }
  const height = labelH + rows.length * chipH + (rows.length - 1) * gapY;
  if (measureOnly) return height;

  g.textBaseline = 'middle';
  g.globalAlpha = phase(t, 1.9, 2.4);
  g.fillStyle = P.muted;
  g.font = `700 ${Math.round(s.by * 0.85)}px ${fonts.body}`;
  g.textAlign = align;
  g.fillText(impact.label, x, y + labelH * 0.4, maxWidth);

  let drawn = 0;
  rows.forEach((row, r) => {
    const rowW =
      row.reduce((sum, chip) => sum + chip.w, 0) + (row.length - 1) * gapX;
    let cx = align === 'center' ? x - rowW / 2 : x;
    const top = y + labelH + r * (chipH + gapY);
    for (const chip of row) {
      g.globalAlpha = phase(t, 2.0 + drawn * 0.12, 2.7 + drawn * 0.12);
      g.fillStyle = P.track;
      roundRect(g, cx, top, chip.w, chipH, chipH / 2);
      g.fill();
      const isMore = chip.index < 0;
      if (!isMore) {
        const mx = cx + padL;
        const my = top + chipH / 2;
        const image = f.projectImages[chip.index];
        if (photos) {
          if (image) {
            g.save();
            g.beginPath();
            g.arc(mx + disc / 2, my, disc / 2, 0, Math.PI * 2);
            g.clip();
            const cover = Math.max(disc / image.width, disc / image.height);
            g.drawImage(
              image as CanvasImageSource,
              mx + (disc - image.width * cover) / 2,
              my - disc / 2 + (disc - image.height * cover) / 2,
              image.width * cover,
              image.height * cover
            );
            g.restore();
          } else {
            g.fillStyle = P.badgeBg;
            g.beginPath();
            g.arc(mx + disc / 2, my, disc / 2, 0, Math.PI * 2);
            g.fill();
            g.fillStyle = P.badgeText;
            g.font = `700 ${Math.round(disc * 0.42)}px ${fonts.body}`;
            g.textAlign = 'center';
            g.fillText(
              Array.from(impact.names[chip.index])[0]?.toUpperCase() ?? '',
              mx + disc / 2,
              my + disc * 0.03
            );
          }
        } else {
          g.fillStyle = P.bar;
          g.beginPath();
          g.arc(mx + dot / 2, my, dot / 2, 0, Math.PI * 2);
          g.fill();
        }
      }
      g.fillStyle = P.text;
      g.font = `600 ${size}px ${fonts.body}`;
      g.textAlign = 'left';
      g.fillText(
        chip.text,
        cx + (isMore ? padX : padL + lead),
        top + chipH / 2 + size * 0.04,
        chip.w - (isMore ? 2 * padX : padL + lead + padX)
      );
      cx += chip.w + gapX;
      drawn++;
    }
  });
  g.globalAlpha = 1;
  return height;
}

/** Before anyone has given: an empty, dashed avatar with a plus, and an invitation to be first. */
function drawFirstGift(
  g: Ctx,
  f: FrameContext,
  x: number,
  y: number,
  align: Align,
  maxWidth: number,
  s: ShareSizes
) {
  const { t, P, data, fonts } = f;
  const size = s.avatar;
  const p = backOut(phase(t, 1.5, 1.9));
  const acx = align === 'center' ? x : x + size / 2;
  const acy = y + size / 2;
  if (p > 0) {
    const r = (size / 2) * p;
    g.save();
    g.strokeStyle = P.muted;
    g.lineWidth = Math.max(2, size * 0.05);
    g.setLineDash([size * 0.12, size * 0.09]);
    // The dashes turn slowly, so the empty seat looks like it is waiting.
    g.lineDashOffset = -t * size * 0.2;
    g.beginPath();
    g.arc(acx, acy, r, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);
    g.lineCap = 'round';
    const arm = r * 0.38;
    g.beginPath();
    g.moveTo(acx - arm, acy);
    g.lineTo(acx + arm, acy);
    g.moveTo(acx, acy - arm);
    g.lineTo(acx, acy + arm);
    g.stroke();
    g.restore();
  }
  const textGap = s.avatarText * 0.6;
  const text = data.firstLine ?? '';
  g.globalAlpha = phase(t, 2.1, 2.5);
  g.fillStyle = P.muted;
  fitFont(g, text, maxWidth, s.avatarText, fontOf(500, fonts.body));
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillText(text, x, y + size + textGap + s.avatarText * 0.65, maxWidth);
  g.globalAlpha = 1;
}

/** Overlapping avatars that pop in one by one, the names line below. */
function drawAvatars(
  g: Ctx,
  f: FrameContext,
  x: number,
  y: number,
  align: Align,
  maxWidth: number,
  s: ShareSizes,
  measureOnly = false
): number {
  const { t, P, data, fonts } = f;
  const size = s.avatar;
  const overlap = size * 0.31;
  const shown = data.donors.slice(0, 5);
  const textGap = s.avatarText * 0.6;
  const height = size + textGap + s.avatarText * 1.3;
  if (measureOnly) return height;

  if (shown.length === 0 && data.firstLine) {
    drawFirstGift(g, f, x, y, align, maxWidth, s);
    return height;
  }

  const rowW = shown.length * size - (shown.length - 1) * overlap;
  let ax = align === 'center' ? x - rowW / 2 : x;
  const acy = y + size / 2;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  shown.forEach((name, i) => {
    const p = backOut(phase(t, 1.5 + i * 0.12, 1.9 + i * 0.12));
    if (p > 0) {
      const r = (size / 2) * p;
      const acx = ax + size / 2;
      g.fillStyle = P.avatarRing;
      g.beginPath();
      g.arc(acx, acy, r + size * 0.06, 0, Math.PI * 2);
      g.fill();
      const avatar = f.avatars[i];
      if (avatar) {
        g.save();
        g.beginPath();
        g.arc(acx, acy, r, 0, Math.PI * 2);
        g.clip();
        g.drawImage(
          avatar as CanvasImageSource,
          acx - r,
          acy - r,
          r * 2,
          r * 2
        );
        g.restore();
        ax += size - overlap;
        return;
      }
      g.fillStyle = P.avatars[i % P.avatars.length];
      g.beginPath();
      g.arc(acx, acy, r, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#ffffff';
      g.font = `700 ${Math.max(1, Math.round(size * 0.43 * p))}px ${fonts.body}`;
      g.fillText(Array.from(name)[0]?.toUpperCase() ?? '', acx, acy + 2);
    }
    ax += size - overlap;
  });
  const text = data.donorsLine ?? '';
  g.globalAlpha = phase(t, 2.1, 2.5);
  g.fillStyle = P.muted;
  fitFont(g, text, maxWidth, s.avatarText, fontOf(500, fonts.body));
  g.textAlign = align;
  g.fillText(text, x, y + size + textGap + s.avatarText * 0.65, maxWidth);
  g.globalAlpha = 1;
  return height;
}

/** Tilted sticker button with arrows and sparkles, then the link. */
function drawCta(
  g: Ctx,
  f: FrameContext,
  x: number,
  y: number,
  align: Align,
  maxWidth: number,
  s: ShareSizes,
  measureOnly = false
): number {
  const { t, P, data, season, fonts } = f;
  const k = s.cta / 104;
  const urlGap = (season.urlGap ?? 0) * k;
  // Room under the button for its shadow and pop, then the link.
  const urlH = s.url * 3 + urlGap;
  const height = s.cta + urlH;
  if (measureOnly) return height;

  const aCta = phase(t, CTA_START, 3.0);
  const rise = (1 - aCta) * 40 * k;
  const pad =
    (align === 'center' ? 120 : 90) * k + (season.ctaDecor ? s.cta * 0.5 : 0);
  // Custom text can be long: shrink the font until the button, and the arrows beside it, fit.
  let fontSize = s.ctaFont;
  g.font = `800 ${fontSize}px ${fonts.body}`;
  while (
    fontSize > s.ctaFont * 0.6 &&
    g.measureText(data.cta).width + pad > f.maxCtaWidth
  ) {
    fontSize -= 1;
    g.font = `800 ${fontSize}px ${fonts.body}`;
  }
  const ctaW = Math.min(
    f.maxCtaWidth,
    Math.max(
      (align === 'center' ? 480 : 360) * k,
      g.measureText(data.cta).width + pad
    )
  );
  const cx = align === 'center' ? x : x + ctaW / 2;
  const cy = y + s.cta / 2 + rise;
  const pop =
    t < 3.0
      ? 0.6 + 0.4 * backOut(phase(t, CTA_START, 3.0))
      : 1 + 0.035 * Math.sin((t - 3.0) * 5);

  g.save();
  g.globalAlpha = aCta;
  g.translate(cx, cy);
  // Minimal and Story keep the button flat and quiet: no tilt, a small shadow, no arrows or sparkles.
  const flat = isPlain(f);
  g.rotate(flat ? 0 : -0.045);
  g.scale(pop, pop);
  g.fillStyle = P.ctaShadow;
  roundRect(
    g,
    -ctaW / 2 + (flat ? 5 : 10) * k,
    -s.cta / 2 + (flat ? 6 : 12) * k,
    ctaW,
    s.cta,
    s.cta / 2
  );
  g.fill();
  g.fillStyle = P.ctaBg;
  roundRect(g, -ctaW / 2, -s.cta / 2, ctaW, s.cta, s.cta / 2);
  g.fill();
  g.lineWidth = 5 * k;
  g.strokeStyle = P.ctaOutline;
  g.stroke();
  season.ctaDecor?.(g, ctaW, s.cta, k);
  g.fillStyle = P.ctaText;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  // Past the smallest font the button stops growing, so the text narrows to keep its padding.
  g.fillText(
    data.cta,
    season.ctaDecor ? s.cta * 0.45 : 0,
    3 * k,
    Math.max(1, ctaW - pad)
  );
  g.restore();
  season.ctaAround?.(g, cx, cy, ctaW, s.cta, t, k, P);

  // Arrows only in the centred layout; beside a left-aligned button there is no room.
  const aArrow = phase(t, 2.9, 3.4);
  if (aArrow > 0 && align === 'center' && !flat) {
    const bounce = Math.sin((t - 2.9) * 6) * 12 * k;
    g.save();
    g.globalAlpha = aArrow;
    g.strokeStyle = P.text;
    g.lineWidth = 7 * k;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const side of [-1, 1]) {
      const edge = cx + side * (ctaW / 2 + 40 * k - bounce);
      drawArrow(
        g,
        edge + side * 90 * k,
        cy - 66 * k,
        edge,
        cy - 4 * k,
        side,
        k
      );
    }
    g.restore();
  }
  if (aCta > 0 && !flat) {
    const spots = [
      [-ctaW / 2 - 30 * k, -80 * k, 26],
      [ctaW / 2 + 20 * k, 70 * k, 22],
      [ctaW / 2 - 40 * k, -95 * k, 18],
      [-ctaW / 2 + 60 * k, 88 * k, 16],
    ];
    spots.forEach(([dx, dy, r], i) => {
      // Beside a left-aligned button, sparkles above it would sit on the text.
      if (align !== 'center' && dy < 0) return;
      const twinkle = (Math.sin(t * 4 + i * 1.7) + 1) / 2;
      g.globalAlpha = aCta * (0.35 + 0.65 * twinkle);
      drawSparkle(
        g,
        cx + dx,
        cy + dy,
        r * k * (0.7 + 0.5 * twinkle),
        P.sparkle
      );
    });
  }
  g.globalAlpha = aCta;
  g.fillStyle = P.muted;
  fitFont(g, data.url, maxWidth, s.url, fontOf(500, fonts.body));
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillText(
    data.url,
    x,
    y + s.cta + urlH / 2 + 16 * k + urlGap / 2 + rise,
    maxWidth
  );
  g.globalAlpha = 1;
  return height;
}

// ---------- Layouts ----------

/** Donors who gave, or the invitation to be first. */
function hasAvatarRow(data: ShareRenderData) {
  return (
    (data.donorsLine !== null && data.donors.length > 0) ||
    data.firstLine !== null
  );
}

function drawGuides(g: Ctx, z: ShareZone, w: number, h: number) {
  g.fillStyle = 'rgba(255,0,0,0.7)';
  g.fillRect(0, z.y, w, 3);
  g.fillRect(0, z.y + z.h, w, 3);
  g.fillRect(z.x, 0, 3, h);
  g.fillRect(z.x + z.w, 0, 3, h);
}

/** The format's sizes with the text scaled by `factor`, keeping the ring at `gauge`. */
function scaleText(
  base: ShareSizes,
  factor: number,
  gauge: number
): ShareSizes {
  const s = Object.fromEntries(
    Object.entries(base).map(([key, value]) => [
      key,
      Math.round(value * factor),
    ])
  ) as unknown as ShareSizes;
  s.gauge = gauge;
  return s;
}

/** What can sit under the title: the supported projects (the Impact card) and the donors (every card). */
interface Extras {
  projects: boolean;
  donors: boolean;
}

/**
 * The donors on the card. The progress card also shows its invitation to be first; the others show a row only when there are donors to name.
 */
function hasDonorRow(f: FrameContext) {
  return f.card === 'progress'
    ? hasAvatarRow(f.data)
    : f.data.donorsLine !== null && f.data.donors.length > 0;
}

function wantedExtras(f: FrameContext): Extras {
  return {
    projects: f.card === 'impact' && (f.data.impact?.names.length ?? 0) > 0,
    donors: hasDonorRow(f),
  };
}

const extraBlocks = (e: Extras) => (e.projects ? 1 : 0) + (e.donors ? 1 : 0);

/** The project chips take two rows when the donors share the card, so both fit; alone they may take three. */
const impactRows = (e: Extras) => (e.donors ? 2 : IMPACT_MAX_ROWS);

/** The height of the extras. */
function measureExtras(
  g: Ctx,
  f: FrameContext,
  align: Align,
  maxWidth: number,
  s: ShareSizes,
  e: Extras
): number {
  return (
    (e.projects
      ? drawImpact(g, f, 0, 0, align, maxWidth, s, true, impactRows(e))
      : 0) + (e.donors ? drawAvatars(g, f, 0, 0, align, maxWidth, s, true) : 0)
  );
}

/**
 * One centred column. Tight zones shrink the ring, then drop the donors, then the projects, then scale the text.
 */
function layoutStack(g: Ctx, f: FrameContext, F: ShareFormat, guides: boolean) {
  const z = F.zone;
  const cx = z.x + z.w / 2;
  const textW = z.w - 40;
  const plain = isPlain(f);
  // The photo: whole in a frame (Minimal small, Story large), or round inside the ring.
  const photoBox = (s: ShareSizes) =>
    plain
      ? fitPhoto(
          f.photo,
          textW,
          Math.round(s.gauge * (f.card === 'story' ? 0.9 : 0.5))
        )
      : { w: s.gauge, h: s.gauge };
  const measure = (s: ShareSizes, e: Extras) => {
    const gs = s.gauge / 640;
    return (
      photoBox(s).h +
      drawTitle(g, f, 0, 0, 'center', textW, s, true) +
      (plain ? drawBar(g, f, 0, 0, 'center', textW, s, true) : 0) +
      measureExtras(g, f, 'center', textW, s, e) +
      drawCta(g, f, 0, 0, 'center', textW, s, true) +
      (48 + 80 + extraBlocks(e) * 48 + (extraBlocks(e) > 0 ? 28 : 0)) * gs
    );
  };
  const shrinkRing = (s: ShareSizes, e: Extras) => {
    while (measure(s, e) > z.h && s.gauge > F.size.gauge * 0.62) s.gauge -= 10;
  };

  // Fit by shrinking the ring, then the text a little (down to `minFactor`). Only when that is not enough is something dropped: the donors first, then the projects.
  const attempt = (e: Extras, minFactor: number): ShareSizes => {
    let size: ShareSizes = { ...F.size };
    shrinkRing(size, e);
    for (
      let factor = 0.97;
      measure(size, e) > z.h && factor >= minFactor;
      factor -= 0.03
    ) {
      size = scaleText(F.size, factor, size.gauge);
    }
    return size;
  };
  let extras = wantedExtras(f);
  let s = attempt(extras, 0.85);
  for (const drop of ['donors', 'projects'] as const) {
    if (measure(s, extras) <= z.h || !extras[drop]) continue;
    extras = { ...extras, [drop]: false };
    s = attempt(extras, 0.85);
  }
  // Without anything left to drop, the text may shrink further.
  if (measure(s, extras) > z.h) s = attempt(extras, 0.7);

  // Spare height goes to the gaps, most of it between the fundraiser and the invite.
  const gs = s.gauge / 640;
  const blocks = extraBlocks(extras);
  const gaps = {
    photo: 48 * gs,
    group: 80 * gs,
    // The room above the button too, so the arrows beside it clear the last line.
    social: (blocks * 48 + (blocks > 0 ? 28 : 0)) * gs,
  };
  const weights = { photo: 1, group: 2, social: blocks };
  const fixed = measure(s, extras) - gaps.photo - gaps.group - gaps.social;
  const spare = Math.max(
    0,
    z.h - fixed - gaps.photo - gaps.group - gaps.social
  );
  const weightSum = weights.photo + weights.group + weights.social;
  for (const key of Object.keys(gaps) as Array<keyof typeof gaps>) {
    gaps[key] += Math.min(
      (spare * weights[key]) / weightSum,
      (plain ? 56 : 90) * weights[key]
    );
  }
  const total = fixed + gaps.photo + gaps.group + gaps.social;
  let y = z.y + Math.max(0, (z.h - total) / 2);

  const box = photoBox(s);
  drawBackground(g, f, F.w, F.h, cx, y + box.h / 2);
  if (plain) drawPhotoFrame(g, f, cx - box.w / 2, y, box.w, box.h);
  else drawGauge(g, f, cx, y + s.gauge / 2, s.gauge);
  y += box.h + gaps.photo;
  y += drawTitle(g, f, cx, y, 'center', textW, s);
  if (plain) y += drawBar(g, f, cx, y, 'center', textW, s);
  y += gaps.group;
  const socialGap = blocks > 0 ? (gaps.social - 28 * gs) / blocks : 0;
  if (extras.projects)
    y +=
      drawImpact(g, f, cx, y, 'center', textW, s, false, impactRows(extras)) +
      socialGap;
  if (extras.donors)
    y += drawAvatars(g, f, cx, y, 'center', textW, s) + socialGap;
  if (blocks > 0) y += 28 * gs;
  f.maxCtaWidth = z.w - 2 * 170 * (s.cta / 104);
  drawCta(g, f, cx, y, 'center', textW, s);
  if (guides) drawGuides(g, z, F.w, F.h);
}

/** The photo on the left, the text on the right, for wide formats. Text that does not fit drops the donors, then the projects, then scales down. */
function layoutSplit(g: Ctx, f: FrameContext, F: ShareFormat, guides: boolean) {
  const z = F.zone;
  const gaugeSize = Math.min(F.size.gauge, z.h);
  const textX = z.x + gaugeSize + z.w * 0.05;
  const textW = z.x + z.w - textX;
  const plain = isPlain(f);
  const measure = (s: ShareSizes, e: Extras) =>
    drawTitle(g, f, 0, 0, 'left', textW, s, true) +
    (plain ? drawBar(g, f, 0, 0, 'left', textW, s, true) : 0) +
    s.title * 0.7 +
    measureExtras(g, f, 'left', textW, s, e) +
    extraBlocks(e) * s.title * 0.55 +
    drawCta(g, f, 0, 0, 'left', textW, s, true);

  let extras = wantedExtras(f);
  for (const drop of ['donors', 'projects'] as const) {
    if (measure(F.size, extras) <= z.h || !extras[drop]) continue;
    extras = { ...extras, [drop]: false };
  }
  let s: ShareSizes = { ...F.size };
  for (
    let factor = 0.97;
    measure(s, extras) > z.h && factor > 0.7;
    factor -= 0.03
  ) {
    s = scaleText(F.size, factor, s.gauge);
  }
  const gapGroup = s.title * 0.7;
  const gapSocial = s.title * 0.55;
  const total = measure(s, extras);
  const gcx = z.x + gaugeSize / 2;
  const gcy = z.y + z.h / 2;

  drawBackground(g, f, F.w, F.h, gcx, gcy);
  if (plain) {
    const box = fitPhoto(
      f.photo,
      gaugeSize,
      Math.round(z.h * (f.card === 'story' ? 0.92 : 0.6))
    );
    drawPhotoFrame(g, f, gcx - box.w / 2, gcy - box.h / 2, box.w, box.h);
  } else drawGauge(g, f, gcx, gcy, gaugeSize);
  let y = z.y + Math.max(0, (z.h - total) / 2);
  y += drawTitle(g, f, textX, y, 'left', textW, s);
  if (plain) y += drawBar(g, f, textX, y, 'left', textW, s);
  y += gapGroup;
  if (extras.projects)
    y +=
      drawImpact(g, f, textX, y, 'left', textW, s, false, impactRows(extras)) +
      gapSocial;
  if (extras.donors)
    y += drawAvatars(g, f, textX, y, 'left', textW, s) + gapSocial;
  f.maxCtaWidth = textW - 30;
  drawCta(g, f, textX, y, 'left', textW, s);
  if (guides) drawGuides(g, z, F.w, F.h);
}

/**
 * Draws one frame of a share image or video at time `t` seconds.
 * The same code runs in the browser (share files) and on the server (link previews), so both always match.
 * A still image is the frame at `SHARE_VIDEO_SECONDS`, after everything has landed.
 */
export function drawShareFrame(g: Ctx, t: number, options: ShareRenderOptions) {
  const F = SHARE_FORMATS[options.format];
  const season = SEASONS[options.theme.season] ?? SEASONS.none;
  const frame: FrameContext = {
    t,
    P: season.palette ? season.palette() : themePalette(options.theme),
    season,
    card: options.theme.card ?? 'progress',
    data: options.data,
    photo: options.photo,
    background: options.background ?? null,
    avatars: options.avatars ?? [],
    projectImages: options.projectImages ?? [],
    dark: options.theme.mode === 'dark',
    fonts: {
      title: `"${options.theme.titleFont}", sans-serif`,
      body: `"${options.theme.bodyFont}", sans-serif`,
    },
    maxCtaWidth: Number.POSITIVE_INFINITY,
    scale: options.scale ?? 1,
  };
  g.save();
  // Everything is laid out in format units; a denser canvas only scales them.
  g.scale(frame.scale, frame.scale);
  if (F.layout === 'stack') layoutStack(g, frame, F, options.guides ?? false);
  else layoutSplit(g, frame, F, options.guides ?? false);
  g.restore();
  g.globalAlpha = 1;
  g.textBaseline = 'alphabetic';
}
