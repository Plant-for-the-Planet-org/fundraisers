import type { Ctx } from './types';

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** `a` moved toward `b` by `t` (0 to 1), as a CSS color. */
export function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`;
}

/** `a` moved toward `b` by `t`, as a #rrggbb hex, for maths that needs hex input. */
export function mixHex(a: string, b: string, t: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return `#${x
    .map((v, i) =>
      Math.round(v + (y[i] - v) * t)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;
}

export function rgba(hex: string, alpha: number): string {
  return `rgba(${hexToRgb(hex).join(',')},${alpha})`;
}

const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);

/** Eased progress of an animation that runs from `start` to `end` seconds. */
export const phase = (t: number, start: number, end: number) =>
  easeOut((t - start) / (end - start));

/** Overshoots a little before it settles, for things that pop in. */
export const backOut = (t: number) => {
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

/** Seeded random in [0, 1), so every render of a frame draws the same thing. */
export const rand = (i: number, n: number) =>
  (((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1) + 1) % 1;

export function roundRect(
  g: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

const segmenter =
  typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;

/** The characters as a reader sees them, so an emoji or an accent is never cut in half. */
function graphemes(text: string): string[] {
  return segmenter
    ? Array.from(segmenter.segment(text), part => part.segment)
    : Array.from(text);
}

/** Pieces of a word too wide for one line, broken between characters: a title with no spaces (in Japanese, say) or a long compound. */
function breakWord(g: Ctx, word: string, maxWidth: number): string[] {
  const pieces: string[] = [];
  let piece = '';
  for (const char of graphemes(word)) {
    if (piece && g.measureText(piece + char).width > maxWidth) {
      pieces.push(piece);
      piece = char;
    } else piece += char;
  }
  if (piece) pieces.push(piece);
  return pieces;
}

/** The lines, and how many words had to be broken to fit them. */
function greedyWrap(
  g: Ctx,
  text: string,
  maxWidth: number
): { lines: string[]; broken: number } {
  const lines: string[] = [];
  let broken = 0;
  let line = '';
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (g.measureText(test).width <= maxWidth) {
      line = test;
      continue;
    }
    if (line) lines.push(line);
    let pieces = [word];
    if (g.measureText(word).width > maxWidth) {
      pieces = breakWord(g, word, maxWidth);
      broken++;
    }
    lines.push(...pieces.slice(0, -1));
    line = pieces[pieces.length - 1] ?? '';
  }
  if (line) lines.push(line);
  return { lines, broken };
}

/** Cuts the line until it fits with an ellipsis after it. */
function withEllipsis(g: Ctx, line: string, maxWidth: number): string {
  const chars = graphemes(line);
  const cut = () => `${chars.join('').trimEnd()}…`;
  while (chars.length > 0 && g.measureText(cut()).width > maxWidth) chars.pop();
  return cut();
}

/** Wraps into as few lines as fit, then narrows the width while the line count holds, so the lines come out even. Text past `maxLines` is cut, with an ellipsis. */
export function wrapBalanced(
  g: Ctx,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const full = greedyWrap(g, text, maxWidth);
  let lines = full.lines;
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    lines[maxLines - 1] = withEllipsis(g, lines[maxLines - 1], maxWidth);
    return lines;
  }
  if (lines.length > 1) {
    for (let w = maxWidth - 10; w > maxWidth * 0.5; w -= 10) {
      const tighter = greedyWrap(g, text, w);
      // Evener lines are not worth breaking a word that fits whole.
      if (
        tighter.lines.length !== lines.length ||
        tighter.broken !== full.broken
      )
        break;
      lines = tighter.lines;
    }
  }
  return lines;
}

/**
 * Sets the largest font, from `size` down to `minSize`, at which one line of `text` fits `maxWidth`, and returns its size.
 * Text still too wide at `minSize` needs `maxWidth` passed to fillText as well, which narrows it.
 */
export function fitFont(
  g: Ctx,
  text: string,
  maxWidth: number,
  size: number,
  font: (size: number) => string,
  minSize = Math.ceil(size * 0.7)
): number {
  g.font = font(size);
  const width = g.measureText(text).width;
  if (width <= maxWidth) return size;
  let fitted = Math.max(minSize, Math.floor((size * maxWidth) / width));
  g.font = font(fitted);
  while (fitted > minSize && g.measureText(text).width > maxWidth) {
    fitted--;
    g.font = font(fitted);
  }
  return fitted;
}

export function glowDot(
  g: Ctx,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha: number
) {
  const halo = g.createRadialGradient(x, y, 0, x, y, r);
  halo.addColorStop(0, color);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  g.globalAlpha = alpha;
  g.fillStyle = halo;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}

export function drawStar(
  g: Ctx,
  x: number,
  y: number,
  r: number,
  rotation: number,
  color: string
) {
  g.save();
  g.translate(x, y);
  g.rotate(rotation);
  g.fillStyle = color;
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    g.lineTo(rad * Math.cos(a), rad * Math.sin(a));
  }
  g.closePath();
  g.fill();
  g.restore();
}

/** A four-point twinkle. */
export function drawSparkle(
  g: Ctx,
  x: number,
  y: number,
  r: number,
  color: string
) {
  g.fillStyle = color;
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const rad = i % 2 === 0 ? r : r * 0.28;
    const a = (Math.PI / 4) * i - Math.PI / 2;
    g.lineTo(x + rad * Math.cos(a), y + rad * Math.sin(a));
  }
  g.closePath();
  g.fill();
}

/** A loose, hand-drawn arrow that curves down into the button. `side` is -1 for the left arrow, 1 for the right. */
export function drawArrow(
  g: Ctx,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  side: number,
  k: number
) {
  g.beginPath();
  g.moveTo(x0, y0);
  g.quadraticCurveTo(x0 - side * 10 * k, y1 - 10 * k, x1, y1);
  g.stroke();
  const ang = Math.atan2(10 * k, x1 - (x0 - side * 10 * k));
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(
    x1 - 26 * k * Math.cos(ang - 0.5),
    y1 - 26 * k * Math.sin(ang - 0.5)
  );
  g.moveTo(x1, y1);
  g.lineTo(
    x1 - 26 * k * Math.cos(ang + 0.5),
    y1 - 26 * k * Math.sin(ang + 0.5)
  );
  g.stroke();
}
