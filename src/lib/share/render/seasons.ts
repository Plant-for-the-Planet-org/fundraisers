import type { Ctx, Palette, Season, TickOptions } from './types';

import {
  accentTextOnDark,
  giftPillOnLight,
  pillOnDark,
  textOnAccent,
} from './contrast';
import {
  drawSparkle,
  drawStar,
  glowDot,
  mix,
  phase,
  rand,
  rgba,
  roundRect,
} from './primitives';

/** The order of the style picker: your theme, then complete designs, then occasions. The picker shows names only, with no headings. */
export const SEASON_IDS = [
  'none',
  'minimal',
  'corporate',
  'luxe',
  'sport',
  'tech',
  'playful',
  'pastel',
  'love',
  'friendship',
  'blossom',
  'balloons',
  'festival',
  'neon',
  'classic',
  'birthday',
  'wedding',
  'inMemory',
  'earthDay',
  'celebration',
  'christmas',
  'halloween',
] as const;
export type SeasonId = (typeof SEASON_IDS)[number];

// ---------- Christmas ----------

const XMAS = { green: '#0e3b2c', red: '#c62828', gold: '#f4c542' };
const LIGHT_COLORS = ['#ff5252', '#ffd54f', '#69f0ae', '#40c4ff'];

export function drawSnow(g: Ctx, w: number, h: number, t: number) {
  const count = Math.round((w * h) / 22000);
  g.fillStyle = '#ffffff';
  for (let i = 0; i < count; i++) {
    const size = 2 + rand(i, 1) * 7;
    const speed = 40 + size * 18;
    const y = ((rand(i, 2) * (h + 40) + t * speed) % (h + 40)) - 20;
    const x = rand(i, 3) * w + Math.sin(t * 1.2 + i) * (8 + size * 2);
    g.globalAlpha = 0.35 + rand(i, 4) * 0.55;
    g.beginPath();
    g.arc(x, y, size, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
}

/** Fairy lights on a wire; each bulb switches on as the fill passes it, then blinks. */
function drawFairyLights(
  g: Ctx,
  { cx, cy, r, start, sweep, reached, t, k, alpha }: TickOptions
) {
  g.strokeStyle = 'rgba(0,0,0,0.45)';
  g.lineWidth = 3 * k;
  g.beginPath();
  g.arc(cx, cy, r, start, start + sweep);
  g.stroke();
  for (let i = 0; i <= 20; i++) {
    const at = i / 20;
    const ang = start + sweep * at;
    const bx = cx + r * Math.cos(ang);
    const by = cy + r * Math.sin(ang);
    const lit = at <= reached + 0.001;
    const color = LIGHT_COLORS[i % LIGHT_COLORS.length];
    if (lit) {
      const blink = 0.65 + 0.35 * Math.sin(t * 5 + i * 1.3);
      glowDot(g, bx, by, 26 * k, color, alpha * 0.55 * blink);
      g.globalAlpha = alpha * (0.7 + 0.3 * blink);
    } else g.globalAlpha = alpha * 0.35;
    g.fillStyle = lit ? color : 'rgba(255,255,255,0.5)';
    g.beginPath();
    g.ellipse(bx, by, 8 * k, 11 * k, ang + Math.PI / 2, 0, Math.PI * 2);
    g.fill();
  }
}

/** A sprig on the upper left of the photo: two leaves and three berries. */
function drawHolly(
  g: Ctx,
  cx: number,
  cy: number,
  r: number,
  t: number,
  k: number
) {
  g.save();
  g.translate(cx - r * 0.72, cy - r * 0.72);
  g.rotate(Math.sin(t * 2) * 0.05);
  g.fillStyle = '#1b5e20';
  g.strokeStyle = '#0d3b12';
  g.lineWidth = 3 * k;
  for (const [angle, dx] of [
    [-0.6, -1],
    [0.5, 1],
  ]) {
    g.save();
    g.rotate(angle);
    g.translate(dx * 46 * k, 0);
    g.beginPath();
    g.ellipse(0, 0, 52 * k, 22 * k, 0, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.restore();
  }
  const berries = [
    [-10, -6],
    [12, -10],
    [2, 12],
  ];
  g.fillStyle = '#d32f2f';
  for (const [bx, by] of berries) {
    g.beginPath();
    g.arc(bx * k, by * k, 13 * k, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = 'rgba(255,255,255,0.6)';
  for (const [bx, by] of berries) {
    g.beginPath();
    g.arc((bx - 4) * k, (by - 4) * k, 3.5 * k, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

/** A gold band and bow on the button, with snow resting on its top edge. */
function drawRibbon(g: Ctx, w: number, h: number, k: number) {
  const bandX = -w / 2 + h * 0.9;
  g.save();
  roundRect(g, -w / 2, -h / 2, w, h, h / 2);
  g.clip();
  g.fillStyle = XMAS.gold;
  g.fillRect(bandX - 9 * k, -h / 2, 18 * k, h);
  g.restore();
  g.fillStyle = XMAS.gold;
  for (const side of [-1, 1]) {
    g.beginPath();
    g.ellipse(
      bandX + side * 20 * k,
      -h / 2 - 6 * k,
      22 * k,
      12 * k,
      side * 0.5,
      0,
      Math.PI * 2
    );
    g.fill();
  }
  g.beginPath();
  g.arc(bandX, -h / 2 - 4 * k, 9 * k, 0, Math.PI * 2);
  g.fill();

  const x0 = bandX + 40 * k;
  const x1 = w / 2 - h * 0.35;
  const bumps = 5;
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.moveTo(x0, -h / 2 + 4 * k);
  for (let i = 0; i <= bumps; i++) {
    const x = x0 + ((x1 - x0) * i) / bumps;
    g.quadraticCurveTo(
      x - (x1 - x0) / bumps / 2,
      -h / 2 - 16 * k,
      x,
      -h / 2 + 2 * k
    );
  }
  g.lineTo(x1, -h / 2 + 8 * k);
  g.lineTo(x0, -h / 2 + 8 * k);
  g.closePath();
  g.fill();
}

// ---------- Halloween ----------

const HW = { night: '#1a1026', orange: '#ff7a1a', moon: '#fff3c4' };

function drawBat(g: Ctx, x: number, y: number, s: number, flap: number) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.fillStyle = '#05030a';
  g.beginPath();
  g.ellipse(0, 0, 8, 12, 0, 0, Math.PI * 2);
  g.fill();
  const lift = flap * 14;
  for (const side of [-1, 1]) {
    g.beginPath();
    g.moveTo(0, -4);
    g.quadraticCurveTo(side * 22, -18 - lift, side * 44, -6 - lift);
    g.quadraticCurveTo(side * 36, 0, side * 32, 6 - lift * 0.3);
    g.quadraticCurveTo(side * 24, 0, side * 18, 8 - lift * 0.2);
    g.quadraticCurveTo(side * 10, 2, 0, 6);
    g.closePath();
    g.fill();
  }
  g.restore();
}

/** Twinkling stars, fog along the bottom and bats crossing. */
function drawNight(g: Ctx, w: number, h: number, t: number) {
  const stars = Math.round((w * h) / 30000);
  g.fillStyle = '#ffffff';
  for (let i = 0; i < stars; i++) {
    g.globalAlpha =
      0.2 + ((0.6 * (Math.sin(t * 3 + i * 2.1) + 1)) / 2) * rand(i, 5);
    g.beginPath();
    g.arc(rand(i, 1) * w, rand(i, 2) * h, 1 + rand(i, 3) * 2.2, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 5; i++) {
    const fx = ((rand(i, 7) * w + t * (20 + i * 8)) % (w + 600)) - 300;
    const fy = h * (0.86 + rand(i, 8) * 0.12);
    glowDot(g, fx, fy, w * 0.35, 'rgba(210,200,255,0.16)', 1);
  }
  g.globalAlpha = 1;
  const scale = w / 1080;
  for (let i = 0; i < 5; i++) {
    const speed = 120 + rand(i, 9) * 140;
    const x = ((rand(i, 10) * w + t * speed) % (w + 240)) - 120;
    const y = h * (0.08 + rand(i, 11) * 0.8) + Math.sin(t * 2 + i) * 30 * scale;
    drawBat(g, x, y, (1.4 + rand(i, 12)) * scale, Math.sin(t * 14 + i * 2));
  }
}

/** Small pumpkins that light up as the fill passes them. */
function drawPumpkins(
  g: Ctx,
  { cx, cy, r, start, sweep, reached, t, k, alpha }: TickOptions
) {
  for (let i = 0; i <= 20; i += 2) {
    const at = i / 20;
    const ang = start + sweep * at;
    const px = cx + r * Math.cos(ang);
    const py = cy + r * Math.sin(ang);
    const lit = at <= reached + 0.001;
    if (lit) {
      glowDot(
        g,
        px,
        py,
        30 * k,
        'rgba(255,140,0,0.9)',
        alpha * (0.45 + 0.25 * Math.sin(t * 9 + i))
      );
    }
    g.globalAlpha = alpha * (lit ? 1 : 0.4);
    g.fillStyle = lit ? HW.orange : '#4a3a5c';
    g.beginPath();
    g.ellipse(px, py, 15 * k, 12 * k, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#2e7d32';
    g.fillRect(px - 2 * k, py - 17 * k, 4 * k, 7 * k);
    if (lit) {
      g.fillStyle = '#3a1500';
      for (const side of [-1, 1]) {
        g.beginPath();
        g.moveTo(px + side * 7 * k, py - 4 * k);
        g.lineTo(px + side * 3 * k, py - 4 * k);
        g.lineTo(px + side * 5 * k, py - 8 * k);
        g.fill();
      }
      g.fillRect(px - 6 * k, py + 3 * k, 12 * k, 3 * k);
    }
  }
}

function drawFlame(g: Ctx, x: number, y: number, t: number, k: number) {
  const f = 1 + 0.12 * Math.sin(t * 17) + 0.08 * Math.sin(t * 29);
  glowDot(g, x, y, 44 * k, 'rgba(255,140,0,0.9)', 0.8);
  g.globalAlpha = 1;
  g.save();
  g.translate(x, y);
  g.scale(f, f);
  g.fillStyle = '#ffb300';
  g.beginPath();
  g.moveTo(0, -30 * k);
  g.quadraticCurveTo(16 * k, -4 * k, 0, 12 * k);
  g.quadraticCurveTo(-16 * k, -4 * k, 0, -30 * k);
  g.fill();
  g.fillStyle = '#fff3c4';
  g.beginPath();
  g.moveTo(0, -14 * k);
  g.quadraticCurveTo(7 * k, 0, 0, 8 * k);
  g.quadraticCurveTo(-7 * k, 0, 0, -14 * k);
  g.fill();
  g.restore();
}

/** A web in the photo's upper right, and a spider bobbing on a thread. */
function drawCobweb(
  g: Ctx,
  cx: number,
  cy: number,
  r: number,
  t: number,
  k: number
) {
  g.save();
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.clip();
  const ax = cx + r * 0.72;
  const ay = cy - r * 0.72;
  const spokes = [
    Math.PI * 0.55,
    Math.PI * 0.7,
    Math.PI * 0.85,
    Math.PI,
    Math.PI * 1.1,
  ];
  const len = r * 0.75;
  g.strokeStyle = 'rgba(255,255,255,0.75)';
  g.lineWidth = 2.2 * k;
  for (const a of spokes) {
    g.beginPath();
    g.moveTo(ax, ay);
    g.lineTo(ax + len * Math.cos(a), ay + len * Math.sin(a));
    g.stroke();
  }
  for (let ring = 1; ring <= 4; ring++) {
    const d = (len / 4.4) * ring;
    g.beginPath();
    spokes.forEach((a, i) => {
      const x = ax + d * Math.cos(a);
      const y = ay + d * Math.sin(a);
      if (i === 0) g.moveTo(x, y);
      else
        g.quadraticCurveTo(
          (ax + x) / 2 + (x - ax) * 0.35,
          (ay + y) / 2 + (y - ay) * 0.35,
          x,
          y
        );
    });
    g.stroke();
  }
  g.restore();

  const sx = cx - r * 0.35;
  const top = cy - r - 20 * k;
  const sy = cy - r * 0.35 + Math.sin(t * 2) * 18 * k;
  g.strokeStyle = 'rgba(255,255,255,0.8)';
  g.lineWidth = 2 * k;
  g.beginPath();
  g.moveTo(sx, top);
  g.lineTo(sx, sy);
  g.stroke();
  g.fillStyle = '#07040c';
  g.strokeStyle = '#07040c';
  g.lineWidth = 3 * k;
  for (const side of [-1, 1]) {
    for (let l = 0; l < 4; l++) {
      const wiggle = Math.sin(t * 8 + l) * 3 * k;
      g.beginPath();
      g.moveTo(sx, sy + 4 * k);
      g.quadraticCurveTo(
        sx + side * 16 * k,
        sy - 10 * k + l * 8 * k,
        sx + side * 24 * k,
        sy + l * 9 * k + wiggle
      );
      g.stroke();
    }
  }
  g.beginPath();
  g.arc(sx, sy + 6 * k, 12 * k, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.arc(sx, sy - 6 * k, 8 * k, 0, Math.PI * 2);
  g.fill();
}

/** Slime drips that grow under the button. */
function drawDrips(
  g: Ctx,
  cx: number,
  cy: number,
  w: number,
  h: number,
  t: number,
  k: number
) {
  const drips = [
    [-0.3, 26],
    [-0.06, 38],
    [0.18, 20],
    [0.36, 32],
  ];
  g.save();
  g.translate(cx, cy);
  g.rotate(-0.045);
  g.fillStyle = HW.orange;
  drips.forEach(([at, max], i) => {
    const grow = phase(t, 2.7 + i * 0.15, 3.6 + i * 0.15);
    if (grow <= 0) return;
    const len = max * k * grow + Math.sin(t * 2 + i) * 3 * k;
    const x = at * w;
    const y0 = h / 2 - 8 * k;
    g.fillRect(x - 8 * k, y0, 16 * k, len);
    g.beginPath();
    g.arc(x, y0 + len, 10 * k, 0, Math.PI * 2);
    g.fill();
  });
  g.restore();
}

// ---------- Birthday ----------

const CONFETTI = [
  '#ff5252',
  '#ffd54f',
  '#40c4ff',
  '#69f0ae',
  '#e040fb',
  '#ff9100',
];

export function drawConfetti(g: Ctx, w: number, h: number, t: number) {
  const count = Math.round((w * h) / 30000);
  const scale = w / 1080;
  for (let i = 0; i < count; i++) {
    const speed = 80 + rand(i, 1) * 140;
    const y = ((rand(i, 2) * (h + 60) + t * speed) % (h + 60)) - 30;
    const x = rand(i, 3) * w + Math.sin(t * 1.5 + i) * 20 * scale;
    g.save();
    g.translate(x, y);
    g.rotate(t * (1 + rand(i, 4) * 3) + i);
    g.scale(Math.cos(t * 5 + i), 1);
    g.globalAlpha = 0.85;
    g.fillStyle = CONFETTI[i % CONFETTI.length];
    g.fillRect(-6 * scale, -10 * scale, 12 * scale, 20 * scale);
    g.restore();
  }
  g.globalAlpha = 1;
}

function drawConfettiTicks(
  g: Ctx,
  { cx, cy, r, start, sweep, reached, k, alpha, P }: TickOptions
) {
  for (let i = 0; i <= 20; i++) {
    const at = i / 20;
    const ang = start + sweep * at;
    const lit = at <= reached + 0.001;
    g.globalAlpha = alpha;
    g.fillStyle = lit ? CONFETTI[i % CONFETTI.length] : P.tick;
    g.beginPath();
    g.arc(
      cx + r * Math.cos(ang),
      cy + r * Math.sin(ang),
      (lit ? 8 : 4) * k,
      0,
      Math.PI * 2
    );
    g.fill();
  }
}

/** Balloons floating on both sides of the ring. Any that would leave the canvas are skipped. */
function drawBalloons(
  g: Ctx,
  cx: number,
  cy: number,
  r: number,
  t: number,
  k: number
) {
  const sets: Array<[number, number, string]> = [
    [-1, 0, '#ff5252'],
    [-1, 1, '#ffd54f'],
    [1, 0, '#40c4ff'],
    [1, 1, '#e040fb'],
  ];
  // In format units, even on a denser canvas.
  const canvasWidth = g.canvas.width / (g.getTransform().a || 1);
  for (const [side, n, color] of sets) {
    const bx = cx + side * (r + 150 * k + n * 70 * k);
    const by = cy - 40 * k - n * 90 * k + Math.sin(t * 1.6 + n + side) * 14 * k;
    if (bx - 60 * k < 0 || bx + 60 * k > canvasWidth) continue;
    g.globalAlpha = 1;
    g.strokeStyle = 'rgba(255,255,255,0.7)';
    g.lineWidth = 2 * k;
    g.beginPath();
    g.moveTo(bx, by + 70 * k);
    g.quadraticCurveTo(
      bx - side * 20 * k,
      by + 150 * k,
      bx - side * 30 * k,
      by + 230 * k
    );
    g.stroke();
    g.fillStyle = color;
    g.beginPath();
    g.ellipse(bx, by, 52 * k, 64 * k, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(bx - 8 * k, by + 70 * k);
    g.lineTo(bx + 8 * k, by + 70 * k);
    g.lineTo(bx, by + 60 * k);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.45)';
    g.beginPath();
    g.ellipse(bx - 18 * k, by - 22 * k, 10 * k, 18 * k, -0.4, 0, Math.PI * 2);
    g.fill();
  }
}

function drawPartyHat(
  g: Ctx,
  cx: number,
  cy: number,
  r: number,
  t: number,
  k: number
) {
  const hw = 62 * k;
  const hh = 150 * k;
  g.save();
  g.translate(cx + r * 0.42, cy - r * 0.86);
  g.rotate(0.45 + Math.sin(t * 2) * 0.04);
  g.beginPath();
  g.moveTo(-hw, 0);
  g.lineTo(hw, 0);
  g.lineTo(0, -hh);
  g.closePath();
  g.fillStyle = '#ff5252';
  g.fill();
  g.save();
  g.clip();
  g.fillStyle = '#ffd54f';
  for (let i = -3; i < 6; i++) {
    g.beginPath();
    g.moveTo(-hw * 2, -i * 36 * k);
    g.lineTo(hw * 2, -i * 36 * k - 60 * k);
    g.lineTo(hw * 2, -i * 36 * k - 76 * k);
    g.lineTo(-hw * 2, -i * 36 * k - 16 * k);
    g.fill();
  }
  g.restore();
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.arc(0, -hh, 18 * k, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

/** Confetti bursts out of the button as it pops in. */
function drawBurst(
  g: Ctx,
  cx: number,
  cy: number,
  w: number,
  h: number,
  t: number,
  k: number
) {
  const p = (t - 2.4) / 1.1;
  if (p <= 0 || p >= 1) return;
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2 + rand(i, 20);
    const dist = p * (180 + rand(i, 21) * 180) * k;
    const x = cx + Math.cos(a) * dist * (w / h) * 0.35;
    const y = cy + Math.sin(a) * dist + p * p * 140 * k;
    g.save();
    g.translate(x, y);
    g.rotate(p * 8 + i);
    g.globalAlpha = 1 - p;
    g.fillStyle = CONFETTI[i % CONFETTI.length];
    g.fillRect(-6 * k, -10 * k, 12 * k, 20 * k);
    g.restore();
  }
  g.globalAlpha = 1;
}

// ---------- Life events, awareness days and celebrations ----------
// These do not depend on a place or a faith, so they fit any country. Christmas and Halloween stay as they were.

/** A palette on a light ground: `bg` for the ground, `accent` for the button, ring and badge. The gift pill keeps 4.5:1 through giftPillOnLight. */
function lightPalette(bg: string, accent: string, ink: string): Palette {
  const pill = giftPillOnLight(accent);
  return {
    bg,
    glow: rgba(accent, 0.22),
    dot: accent,
    text: ink,
    muted: rgba(ink, 0.68),
    accentText: pill.text,
    giftPill: pill.fill,
    track: rgba(accent, 0.18),
    bar: mix(accent, '#000000', 0.15),
    ctaBg: accent,
    ctaText: textOnAccent(accent),
    ctaShadow: mix(accent, '#000000', 0.45),
    ctaOutline: mix(accent, '#000000', 0.45),
    sparkle: mix(accent, '#000000', 0.1),
    tick: rgba(accent, 0.35),
    avatarRing: '#ffffff',
    tip: mix(accent, '#000000', 0.2),
    tipGlow: rgba(accent, 0.45),
    badgeBg: accent,
    badgeText: textOnAccent(accent),
    frame: '#ffffff',
    avatars: [
      mix(accent, '#000000', 0.15),
      mix(accent, '#ffffff', 0.25),
      mix(accent, '#000000', 0.35),
      mix(accent, '#ffffff', 0.45),
      mix(accent, '#000000', 0.05),
    ],
  };
}

const WEDDING = { ivory: '#fbf4ec', gold: '#a9812f', ink: '#3b2f2a' };
const PETALS = ['#f4c6c6', '#f8dada', '#f0b4b8', '#fbe7e7'];
const MEMORY = { ground: '#eef1ee', sage: '#4f6f62', ink: '#1f2a26' };
const EARTH = { ground: '#e9f6ec', green: '#1f7a45', ink: '#0c2a1a' };
const LEAVES = ['#2e9d5b', '#58b872', '#1f7a45', '#8fcf9b'];

/** A leaf pointing up from its centre, `size` tall from the middle to the tip. */
function leafPath(g: Ctx, size: number) {
  g.beginPath();
  g.moveTo(0, -size);
  g.quadraticCurveTo(size * 0.85, -size * 0.2, 0, size);
  g.quadraticCurveTo(-size * 0.85, -size * 0.2, 0, -size);
  g.closePath();
}

/** Leaves drifting down, each on its own slow sway. */
function drawLeaves(g: Ctx, w: number, h: number, t: number) {
  const count = Math.round((w * h) / 70000);
  for (let i = 0; i < count; i++) {
    const size = 12 + rand(i, 1) * 16;
    const speed = 26 + size * 3;
    const y = ((rand(i, 2) * (h + 80) + t * speed) % (h + 80)) - 40;
    const x = rand(i, 3) * w + Math.sin(t * 0.8 + i) * 34;
    g.save();
    g.translate(x, y);
    g.rotate(Math.sin(t * 0.9 + i) * 0.9 + i);
    g.globalAlpha = 0.3 + rand(i, 4) * 0.4;
    g.fillStyle = LEAVES[i % LEAVES.length];
    leafPath(g, size);
    g.fill();
    g.restore();
  }
  g.globalAlpha = 1;
}

function drawLeafTicks(
  g: Ctx,
  { cx, cy, r, start, sweep, reached, k, alpha, P }: TickOptions
) {
  for (let i = 0; i <= 20; i++) {
    const at = i / 20;
    const ang = start + sweep * at;
    const lit = at <= reached + 0.001;
    const x = cx + r * Math.cos(ang);
    const y = cy + r * Math.sin(ang);
    g.globalAlpha = alpha;
    if (lit) {
      g.save();
      g.translate(x, y);
      g.rotate(ang + Math.PI / 2 + (i % 2 ? 0.5 : -0.5));
      g.fillStyle = LEAVES[i % LEAVES.length];
      leafPath(g, 14 * k);
      g.fill();
      g.restore();
    } else {
      g.fillStyle = P.tick;
      g.beginPath();
      g.arc(x, y, 4 * k, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.globalAlpha = 1;
}

/** Soft petals falling slowly and turning as they go. */
function drawPetals(g: Ctx, w: number, h: number, t: number) {
  const count = Math.round((w * h) / 80000);
  for (let i = 0; i < count; i++) {
    const size = 9 + rand(i, 1) * 12;
    const speed = 22 + size * 3;
    const y = ((rand(i, 2) * (h + 60) + t * speed) % (h + 60)) - 30;
    const x = rand(i, 3) * w + Math.sin(t * 0.7 + i) * 40;
    g.save();
    g.translate(x, y);
    g.rotate(t * (0.4 + rand(i, 4)) + i);
    g.globalAlpha = 0.45 + rand(i, 5) * 0.4;
    g.fillStyle = PETALS[i % PETALS.length];
    g.beginPath();
    g.ellipse(0, 0, size, size * 0.62, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  g.globalAlpha = 1;
}

/** Gold marks around the ring: small until the fill reaches them, then a larger one. */
function drawGoldTicks(
  g: Ctx,
  { cx, cy, r, start, sweep, reached, k, alpha, P }: TickOptions
) {
  for (let i = 0; i <= 20; i++) {
    const at = i / 20;
    const ang = start + sweep * at;
    const lit = at <= reached + 0.001;
    g.globalAlpha = alpha;
    g.fillStyle = lit ? WEDDING.gold : P.tick;
    g.beginPath();
    g.arc(
      cx + r * Math.cos(ang),
      cy + r * Math.sin(ang),
      (lit ? 7 : 4) * k,
      0,
      Math.PI * 2
    );
    g.fill();
  }
  g.globalAlpha = 1;
}

/** One still, soft light behind the ring. Nothing moves, which suits a fundraiser in someone's memory. */
function drawSoftLight(g: Ctx, w: number, h: number) {
  const light = g.createRadialGradient(
    w / 2,
    h * 0.4,
    0,
    w / 2,
    h * 0.4,
    Math.max(w, h) * 0.7
  );
  light.addColorStop(0, 'rgba(255,255,255,0.7)');
  light.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = light;
  g.fillRect(0, 0, w, h);
}

/** Small lights that fade in and out, each at its own pace. */
function drawTwinkles(g: Ctx, w: number, h: number, t: number) {
  const count = Math.round((w * h) / 90000);
  for (let i = 0; i < count; i++) {
    const x = rand(i, 1) * w;
    const y = rand(i, 2) * h;
    const size = 6 + rand(i, 3) * 12;
    const twinkle = 0.5 + 0.5 * Math.sin(t * (1.4 + rand(i, 4)) + i * 1.7);
    g.globalAlpha = 0.15 + 0.7 * twinkle;
    drawSparkle(g, x, y, size, '#f2b705');
  }
  g.globalAlpha = 1;
}

/** Sparkles that light up around the ring as the fill reaches them. */
function sparkleTicks(color: string) {
  return (
    g: Ctx,
    { cx, cy, r, start, sweep, reached, k, alpha, P }: TickOptions
  ) => {
    for (let i = 0; i <= 20; i++) {
      const at = i / 20;
      const ang = start + sweep * at;
      const lit = at <= reached + 0.001;
      const x = cx + r * Math.cos(ang);
      const y = cy + r * Math.sin(ang);
      g.globalAlpha = alpha;
      if (lit) drawSparkle(g, x, y, 13 * k, color);
      else {
        g.fillStyle = P.tick;
        g.beginPath();
        g.arc(x, y, 4 * k, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.globalAlpha = 1;
  };
}

// ---------- Looks ----------
// A look is a complete design, not an occasion: its own colours, typefaces, background and ring marks. They suit any country and any cause.

/** A palette on a dark ground. `accent` carries the button, ring and badge, and the gift text is lightened until it reads on its pill. */
function darkPalette(
  bg: string,
  accent: string,
  ink: string,
  frame = '#ffffff'
): Palette {
  const pill = pillOnDark(bg);
  return {
    bg,
    glow: rgba(accent, 0.22),
    dot: rgba(accent, 0.55),
    text: ink,
    muted: rgba(ink, 0.72),
    accentText: accentTextOnDark(accent, pill),
    giftPill: pill,
    track: 'rgba(255,255,255,0.14)',
    bar: accent,
    ctaBg: accent,
    ctaText: textOnAccent(accent),
    ctaShadow: mix(accent, '#000000', 0.6),
    ctaOutline: mix(accent, '#000000', 0.35),
    sparkle: mix(accent, '#ffffff', 0.5),
    tick: 'rgba(255,255,255,0.3)',
    avatarRing: bg,
    tip: accent,
    tipGlow: rgba(accent, 0.7),
    badgeBg: accent,
    badgeText: textOnAccent(accent),
    frame,
    avatars: [
      mix(accent, '#000000', 0.3),
      mix(accent, '#ffffff', 0.2),
      mix(accent, '#000000', 0.5),
      mix(accent, '#ffffff', 0.4),
      mix(accent, '#000000', 0.15),
    ],
  };
}

const CORPORATE = { ground: '#0b1f3a', blue: '#5eb1ff', ink: '#f2f7ff' };
const LUXE = { ground: '#0d0b09', gold: '#e2bd57', ink: '#f6ecd6' };
const SPORT = { ground: '#0a1330', lime: '#c8ff3d', ink: '#ffffff' };
const TECH = { ground: '#070b12', cyan: '#2ee6ff', ink: '#e6f4ff' };
const PASTEL = { ground: '#fbf6ef', terracotta: '#c4553a', ink: '#2b2530' };
const PLAYFUL = { ground: '#fff3c4', blue: '#1747d6', ink: '#10265c' };

/** A deep navy ground with a faint grid, quiet rings in the corner and a light bar on top. Still. */
function drawCorporate(g: Ctx, w: number, h: number) {
  g.strokeStyle = 'rgba(94,177,255,0.07)';
  g.lineWidth = 1.5;
  for (let x = 0; x <= w; x += 90) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, h);
    g.stroke();
  }
  for (let y = 0; y <= h; y += 90) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y);
    g.stroke();
  }
  g.strokeStyle = 'rgba(94,177,255,0.14)';
  g.lineWidth = 3;
  for (let i = 1; i <= 4; i++) {
    g.beginPath();
    g.arc(w, h, i * Math.min(w, h) * 0.16, 0, Math.PI * 2);
    g.stroke();
  }
  g.fillStyle = CORPORATE.blue;
  g.fillRect(0, 0, w, Math.max(14, Math.round(h * 0.012)));
}

/** Gold glitter: tiny sparkles that fade in and out, over a warm glow. */
function drawGlitter(g: Ctx, w: number, h: number, t: number) {
  const glow = g.createRadialGradient(
    w / 2,
    h * 0.3,
    0,
    w / 2,
    h * 0.3,
    Math.max(w, h) * 0.7
  );
  glow.addColorStop(0, 'rgba(226,189,87,0.22)');
  glow.addColorStop(1, 'rgba(226,189,87,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, w, h);
  const count = Math.round((w * h) / 42000);
  for (let i = 0; i < count; i++) {
    const twinkle = 0.5 + 0.5 * Math.sin(t * (1.8 + rand(i, 4) * 2) + i * 2.1);
    g.globalAlpha = 0.1 + 0.85 * twinkle * twinkle;
    drawSparkle(
      g,
      rand(i, 1) * w,
      rand(i, 2) * h,
      4 + rand(i, 3) * 11,
      '#f5d77a'
    );
  }
  g.globalAlpha = 1;
}

/** Slanted speed lines sweeping across the picture. */
function drawSpeedLines(g: Ctx, w: number, h: number, t: number) {
  const long = Math.hypot(w, h);
  g.save();
  g.translate(w / 2, h / 2);
  g.rotate(-0.38);
  for (let i = 0; i < 16; i++) {
    const y = -long / 2 + (i / 16) * long;
    const thick = 14 + rand(i, 1) * 64;
    const travel = long * 1.5;
    const x =
      ((t * (140 + rand(i, 2) * 260) + rand(i, 3) * travel) % travel) -
      long * 0.75;
    g.globalAlpha = 0.05 + rand(i, 5) * 0.11;
    g.fillStyle = i % 3 === 0 ? SPORT.lime : '#ffffff';
    g.fillRect(x, y, 220 + rand(i, 4) * 520, thick);
  }
  g.restore();
  g.globalAlpha = 1;
}

/** Chevrons along the ring, like lane arrows on a track. */
function drawChevronTicks(
  g: Ctx,
  { cx, cy, r, start, sweep, reached, k, alpha, P }: TickOptions
) {
  for (let i = 0; i <= 20; i++) {
    const at = i / 20;
    const ang = start + sweep * at;
    const lit = at <= reached + 0.001;
    g.save();
    g.translate(cx + r * Math.cos(ang), cy + r * Math.sin(ang));
    g.rotate(ang + Math.PI / 2);
    g.globalAlpha = alpha;
    g.fillStyle = lit ? SPORT.lime : P.tick;
    const size = (lit ? 13 : 8) * k;
    g.beginPath();
    g.moveTo(-size, -size);
    g.lineTo(size, 0);
    g.lineTo(-size, size);
    g.lineTo(-size * 0.4, 0);
    g.closePath();
    g.fill();
    g.restore();
  }
  g.globalAlpha = 1;
}

/** A dot grid, two soft glows and a band of light that scans down the picture. */
function drawTechGrid(g: Ctx, w: number, h: number, t: number) {
  for (const [x, y, color] of [
    [0.15, 0.2, 'rgba(46,230,255,0.16)'],
    [0.9, 0.8, 'rgba(160,102,255,0.16)'],
  ] as const) {
    const glow = g.createRadialGradient(
      w * x,
      h * y,
      0,
      w * x,
      h * y,
      Math.max(w, h) * 0.6
    );
    glow.addColorStop(0, color);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, w, h);
  }
  g.fillStyle = 'rgba(46,230,255,0.22)';
  for (let x = 30; x < w; x += 60) {
    for (let y = 30; y < h; y += 60) {
      g.beginPath();
      g.arc(x, y, 1.8, 0, Math.PI * 2);
      g.fill();
    }
  }
  const y = ((t * 150) % (h + 300)) - 150;
  const band = g.createLinearGradient(0, y - 90, 0, y + 90);
  band.addColorStop(0, 'rgba(46,230,255,0)');
  band.addColorStop(0.5, 'rgba(46,230,255,0.09)');
  band.addColorStop(1, 'rgba(46,230,255,0)');
  g.fillStyle = band;
  g.fillRect(0, y - 90, w, 180);
}

/** Square marks along the ring, like a progress meter. */
function drawSquareTicks(
  g: Ctx,
  { cx, cy, r, start, sweep, reached, k, alpha, P }: TickOptions
) {
  for (let i = 0; i <= 20; i++) {
    const at = i / 20;
    const ang = start + sweep * at;
    const lit = at <= reached + 0.001;
    const size = (lit ? 9 : 5) * k;
    g.globalAlpha = alpha;
    g.fillStyle = lit ? TECH.cyan : P.tick;
    g.fillRect(
      cx + r * Math.cos(ang) - size,
      cy + r * Math.sin(ang) - size,
      size * 2,
      size * 2
    );
  }
  g.globalAlpha = 1;
}

const WASH = ['#f4a98f', '#a8d5ba', '#c3b1f0', '#f7d774', '#f29bb0'];

/** Large soft washes of colour drifting slowly, like watercolour on paper. */
function drawWashes(g: Ctx, w: number, h: number, t: number) {
  const size = Math.min(w, h) * 0.55;
  WASH.forEach((color, i) => {
    const x = w * (0.2 + 0.6 * rand(i, 1)) + Math.sin(t * 0.25 + i * 2) * 50;
    const y = h * (0.1 + 0.8 * rand(i, 2)) + Math.cos(t * 0.2 + i * 3) * 60;
    const wash = g.createRadialGradient(x, y, 0, x, y, size);
    wash.addColorStop(0, color);
    wash.addColorStop(1, 'rgba(255,255,255,0)');
    g.globalAlpha = 0.95;
    g.fillStyle = wash;
    g.fillRect(0, 0, w, h);
  });
  g.globalAlpha = 1;
}

const PLAY = ['#ff7aa8', '#34c8a0', '#ffb020', '#7a5cff', '#1747d6'];

/** Bubbles, stars and rings floating up. */
function drawPlayShapes(g: Ctx, w: number, h: number, t: number) {
  const count = Math.round((w * h) / 110000);
  for (let i = 0; i < count; i++) {
    const size = 14 + rand(i, 1) * 30;
    const y =
      h +
      60 -
      ((t * (30 + rand(i, 2) * 50) + rand(i, 3) * (h + 120)) % (h + 120));
    const x = rand(i, 4) * w + Math.sin(t * 0.9 + i) * 24;
    const color = PLAY[i % PLAY.length];
    g.globalAlpha = 0.32;
    if (i % 3 === 0) drawStar(g, x, y, size, t * 0.6 + i, color);
    else if (i % 3 === 1) {
      g.strokeStyle = color;
      g.lineWidth = 6;
      g.beginPath();
      g.arc(x, y, size * 0.8, 0, Math.PI * 2);
      g.stroke();
    } else {
      g.fillStyle = color;
      g.beginPath();
      g.arc(x, y, size * 0.7, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.globalAlpha = 1;
}

const LOVE = { ground: '#fff0f3', rose: '#e0245e', ink: '#4a1327' };
const HEARTS = ['#ff6b8b', '#ff9fb5', '#e0245e', '#ffc2d1'];

/** A heart, `size` from the centre to the sides, with its tip pointing down. */
function heartPath(g: Ctx, size: number) {
  g.beginPath();
  g.moveTo(0, size);
  g.bezierCurveTo(
    -size * 1.4,
    -size * 0.2,
    -size * 0.6,
    -size * 1.1,
    0,
    -size * 0.35
  );
  g.bezierCurveTo(size * 0.6, -size * 1.1, size * 1.4, -size * 0.2, 0, size);
  g.closePath();
}

/** Hearts of every size rising slowly, each swaying on its own. */
function drawHearts(g: Ctx, w: number, h: number, t: number) {
  const count = Math.round((w * h) / 52000);
  for (let i = 0; i < count; i++) {
    const size = 10 + rand(i, 1) * 22;
    const speed = 24 + size * 2.2;
    const y = h + 60 - ((t * speed + rand(i, 2) * (h + 120)) % (h + 120));
    const x = rand(i, 3) * w + Math.sin(t * 0.9 + i) * 26;
    g.save();
    g.translate(x, y);
    g.rotate(Math.sin(t + i) * 0.25);
    g.globalAlpha = 0.3 + rand(i, 4) * 0.4;
    g.fillStyle = HEARTS[i % HEARTS.length];
    heartPath(g, size);
    g.fill();
    g.restore();
  }
  g.globalAlpha = 1;
}

/** Hearts along the ring: small dots until the fill reaches them, then a heart. */
function drawHeartTicks(
  g: Ctx,
  { cx, cy, r, start, sweep, reached, k, alpha, P }: TickOptions
) {
  for (let i = 0; i <= 20; i++) {
    const at = i / 20;
    const ang = start + sweep * at;
    const lit = at <= reached + 0.001;
    const x = cx + r * Math.cos(ang);
    const y = cy + r * Math.sin(ang);
    g.globalAlpha = alpha;
    if (lit) {
      g.save();
      g.translate(x, y);
      g.fillStyle = HEARTS[i % HEARTS.length];
      heartPath(g, 11 * k);
      g.fill();
      g.restore();
    } else {
      g.fillStyle = P.tick;
      g.beginPath();
      g.arc(x, y, 4 * k, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.globalAlpha = 1;
}

const FRIENDSHIP = { ground: '#fff6e0', orange: '#d96f00', ink: '#3a2a0a' };
const CIRCLES = [
  '#ffb703',
  '#8ecae6',
  '#ff8fab',
  '#90be6d',
  '#b185db',
  '#fb8500',
];

/** Big soft circles that overlap at the edges and drift, like friends standing close. */
function drawCircles(g: Ctx, w: number, h: number, t: number) {
  CIRCLES.forEach((color, i) => {
    const left = i % 2 === 0;
    const x = (left ? 0.02 : 0.98) * w + Math.sin(t * 0.4 + i) * 24;
    const y = h * (0.08 + 0.17 * i) + Math.cos(t * 0.35 + i * 2) * 28;
    const r = Math.min(w, h) * (0.16 + 0.05 * rand(i, 3));
    g.globalAlpha = 0.4;
    g.fillStyle = color;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  });
  g.globalAlpha = 1;
}

const BLOSSOM = { ground: '#f4faf1', pink: '#c2417a', ink: '#23311f' };
const PETAL_COLORS = ['#f8b4cf', '#ffffff', '#f48fb1', '#fbd0e0'];

/** A five-petal flower with a gold centre, `size` from the middle to a petal tip. */
function drawFlower(
  g: Ctx,
  x: number,
  y: number,
  size: number,
  rotation: number,
  color: string
) {
  g.save();
  g.translate(x, y);
  g.rotate(rotation);
  g.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    g.save();
    g.rotate((i * Math.PI * 2) / 5);
    g.beginPath();
    g.ellipse(0, -size * 0.55, size * 0.34, size * 0.5, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  g.fillStyle = '#f2b705';
  g.beginPath();
  g.arc(0, 0, size * 0.2, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

/** Blossoms tumbling down, turning as they fall. */
function drawBlossoms(g: Ctx, w: number, h: number, t: number) {
  const count = Math.round((w * h) / 90000);
  for (let i = 0; i < count; i++) {
    const size = 14 + rand(i, 1) * 22;
    const y = ((rand(i, 2) * (h + 80) + t * (22 + size * 1.6)) % (h + 80)) - 40;
    const x = rand(i, 3) * w + Math.sin(t * 0.7 + i) * 36;
    g.globalAlpha = 0.4 + rand(i, 4) * 0.4;
    drawFlower(
      g,
      x,
      y,
      size,
      t * 0.5 + i,
      PETAL_COLORS[i % PETAL_COLORS.length]
    );
  }
  g.globalAlpha = 1;
}

/** Small flowers along the ring: dots until the fill reaches them, then a blossom. */
function drawFlowerTicks(
  g: Ctx,
  { cx, cy, r, start, sweep, reached, k, alpha, P }: TickOptions
) {
  for (let i = 0; i <= 20; i++) {
    const at = i / 20;
    const ang = start + sweep * at;
    const lit = at <= reached + 0.001;
    const x = cx + r * Math.cos(ang);
    const y = cy + r * Math.sin(ang);
    g.globalAlpha = alpha;
    if (lit) drawFlower(g, x, y, 16 * k, ang, i % 2 ? '#f48fb1' : '#f8b4cf');
    else {
      g.fillStyle = P.tick;
      g.beginPath();
      g.arc(x, y, 4 * k, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.globalAlpha = 1;
}

const BALLOONS = { ground: '#e8f4ff', blue: '#2f6fe0', ink: '#12304d' };
const BALLOON_COLORS = [
  '#ffadad',
  '#ffd6a5',
  '#fdffb6',
  '#caffbf',
  '#9bf6ff',
  '#bdb2ff',
  '#ffc6ff',
];

/** A pale sky, a few soft clouds and balloons floating up on their strings. */
function drawBalloonSky(g: Ctx, w: number, h: number, t: number) {
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, 'rgba(120,180,255,0.35)');
  sky.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 4; i++) {
    const cx = ((rand(i, 9) * w + t * (8 + i * 4)) % (w + 400)) - 200;
    const cy = h * (0.12 + 0.24 * i);
    for (const [dx, dy, r] of [
      [0, 0, 60],
      [70, 12, 48],
      [-70, 14, 44],
      [30, -24, 40],
    ] as const) {
      g.beginPath();
      g.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
      g.fill();
    }
  }
  const count = Math.round((w * h) / 120000);
  for (let i = 0; i < count; i++) {
    const rx = 34 + rand(i, 1) * 26;
    const ry = rx * 1.2;
    const travel = h + 360;
    const y =
      h + 180 - ((t * (26 + rand(i, 2) * 30) + rand(i, 3) * travel) % travel);
    const x = rand(i, 4) * w + Math.sin(t * 0.8 + i) * 18;
    g.globalAlpha = 0.85;
    g.strokeStyle = 'rgba(18,48,77,0.35)';
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(x, y + ry);
    g.quadraticCurveTo(x - 14, y + ry + 60, x + 6, y + ry + 130);
    g.stroke();
    g.fillStyle = BALLOON_COLORS[i % BALLOON_COLORS.length];
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.5)';
    g.beginPath();
    g.ellipse(
      x - rx * 0.35,
      y - ry * 0.35,
      rx * 0.16,
      ry * 0.28,
      -0.4,
      0,
      Math.PI * 2
    );
    g.fill();
  }
  g.globalAlpha = 1;
}

const FESTIVAL = { ground: '#0b0618', pink: '#ff4fd8', ink: '#ffffff' };
const BEAMS = ['#ff4fd8', '#35d7ff', '#ffb02e', '#8a5cff'];

/** Stage lights: beams sweeping from the top, and a row of bars bouncing like an equaliser at the bottom. */
function drawStage(g: Ctx, w: number, h: number, t: number) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  BEAMS.forEach((color, i) => {
    const originX = w * (0.12 + 0.76 * (i / (BEAMS.length - 1)));
    const angle = Math.sin(t * 0.7 + i * 1.6) * 0.45;
    const length = h * 0.95;
    const spread = 0.16;
    const beam = g.createLinearGradient(
      originX,
      0,
      originX + Math.sin(angle) * length,
      Math.cos(angle) * length
    );
    beam.addColorStop(0, `${color}55`);
    beam.addColorStop(1, `${color}00`);
    g.fillStyle = beam;
    g.beginPath();
    g.moveTo(originX, -20);
    g.lineTo(originX + Math.tan(angle - spread) * length, length);
    g.lineTo(originX + Math.tan(angle + spread) * length, length);
    g.closePath();
    g.fill();
  });
  g.restore();
  const bars = 28;
  const gap = w / bars;
  for (let i = 0; i < bars; i++) {
    const height =
      h *
      (0.03 +
        0.07 *
          (0.5 +
            0.5 * Math.sin(t * 5 + i * 0.9) * Math.sin(t * 1.7 + i * 0.4)));
    g.fillStyle = BEAMS[i % BEAMS.length];
    g.globalAlpha = 0.55;
    g.fillRect(i * gap + gap * 0.15, h - height, gap * 0.7, height);
  }
  g.globalAlpha = 1;
}

const NEON = {
  ground: '#ff5fa8',
  ink: '#111111',
  yellow: '#ffe600',
  lilac: '#b9a4ff',
  cyan: '#46e0ff',
};

/** A loud poster: big flat shapes pushed to the edges and drifting, and black stars bouncing near the top and bottom. The middle stays clear for the text. */
function drawPoster(g: Ctx, w: number, h: number, t: number) {
  const shapes: Array<[number, number, number, string]> = [
    [0.02, 0.05, 0.2, NEON.yellow],
    [1.0, 0.17, 0.15, NEON.lilac],
    [0.0, 0.93, 0.19, NEON.cyan],
    [1.0, 0.96, 0.2, NEON.yellow],
  ];
  shapes.forEach(([x, y, r, color], i) => {
    const size = Math.min(w, h) * r;
    g.fillStyle = color;
    g.beginPath();
    g.arc(
      w * x + Math.sin(t * 0.6 + i) * 18,
      h * y + Math.cos(t * 0.5 + i * 2) * 18,
      size,
      0,
      Math.PI * 2
    );
    g.fill();
    g.strokeStyle = NEON.ink;
    g.lineWidth = 7;
    g.stroke();
  });
  for (let i = 0; i < 6; i++) {
    const top = i % 2 === 0;
    const bounce = Math.abs(Math.sin(t * 2.2 + i * 1.3)) * 24;
    const y = top
      ? h * (0.025 + 0.06 * rand(i, 7))
      : h * (0.93 + 0.05 * rand(i, 7));
    drawStar(
      g,
      w * (0.12 + 0.15 * i),
      y - bounce,
      24 + rand(i, 8) * 18,
      t + i,
      NEON.ink
    );
  }
}

const CLASSIC = { ground: '#f7f1e3', burgundy: '#7a1f2b', ink: '#1d2433' };

/** A formal double border with a small ornament in each corner, on paper. Still. */
function drawCertificate(g: Ctx, w: number, h: number) {
  g.strokeStyle = CLASSIC.burgundy;
  g.lineWidth = 5;
  g.strokeRect(34, 34, w - 68, h - 68);
  g.lineWidth = 2;
  g.strokeRect(52, 52, w - 104, h - 104);
  g.fillStyle = CLASSIC.burgundy;
  for (const [cx, cy] of [
    [34, 34],
    [w - 34, 34],
    [34, h - 34],
    [w - 34, h - 34],
  ] as const) {
    g.beginPath();
    g.arc(cx, cy, 16, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = CLASSIC.ground;
    g.beginPath();
    g.arc(cx, cy, 7, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = CLASSIC.burgundy;
  }
}

// ---------- Seasons ----------

export const SEASONS: Record<SeasonId, Season> = {
  none: {},
  // As little as possible: white, black type and nothing else.
  minimal: {
    fonts: { title: 'inter', body: 'inter' },
    // A black accent would make a grey smudge of the usual glow, so the glow is nearly clear.
    palette: () => ({
      ...lightPalette('#ffffff', '#111111', '#111111'),
      glow: 'rgba(0,0,0,0)',
      dot: 'rgba(0,0,0,0)',
    }),
  },
  corporate: {
    fonts: { title: 'inter', body: 'inter' },
    palette: () =>
      darkPalette(CORPORATE.ground, CORPORATE.blue, CORPORATE.ink, '#ffffff'),
    background: drawCorporate,
  },
  luxe: {
    fonts: { title: 'playfair', body: 'inter' },
    palette: () => darkPalette(LUXE.ground, LUXE.gold, LUXE.ink, LUXE.gold),
    background: drawGlitter,
    ticks: sparkleTicks('#f5d77a'),
    tip: (g, x, y, t, k) => drawSparkle(g, x, y, 28 * k, '#f5d77a'),
  },
  sport: {
    fonts: { title: 'poppins', body: 'poppins' },
    uppercaseTitle: true,
    palette: () => darkPalette(SPORT.ground, SPORT.lime, SPORT.ink, SPORT.lime),
    background: drawSpeedLines,
    ticks: drawChevronTicks,
  },
  tech: {
    fonts: { title: 'roboto', body: 'roboto' },
    palette: () => darkPalette(TECH.ground, TECH.cyan, TECH.ink, TECH.cyan),
    background: drawTechGrid,
    ticks: drawSquareTicks,
  },
  pastel: {
    fonts: { title: 'playfair', body: 'open-sans' },
    palette: () => lightPalette(PASTEL.ground, PASTEL.terracotta, PASTEL.ink),
    background: drawWashes,
  },
  love: {
    fonts: { title: 'playfair', body: 'open-sans' },
    palette: () => lightPalette(LOVE.ground, LOVE.rose, LOVE.ink),
    background: drawHearts,
    ticks: drawHeartTicks,
    tip: (g, x, y, t, k, P) => {
      g.save();
      g.translate(x, y);
      const beat = 1 + 0.12 * Math.sin(t * 6);
      g.scale(beat, beat);
      g.fillStyle = P.tip;
      heartPath(g, 20 * k);
      g.fill();
      g.restore();
    },
  },
  friendship: {
    fonts: { title: 'poppins', body: 'poppins' },
    palette: () =>
      lightPalette(FRIENDSHIP.ground, FRIENDSHIP.orange, FRIENDSHIP.ink),
    background: drawCircles,
    ticks: drawConfettiTicks,
  },
  blossom: {
    fonts: { title: 'poppins', body: 'poppins' },
    palette: () => lightPalette(BLOSSOM.ground, BLOSSOM.pink, BLOSSOM.ink),
    background: drawBlossoms,
    ticks: drawFlowerTicks,
  },
  balloons: {
    fonts: { title: 'poppins', body: 'poppins' },
    palette: () => lightPalette(BALLOONS.ground, BALLOONS.blue, BALLOONS.ink),
    background: drawBalloonSky,
  },
  festival: {
    fonts: { title: 'poppins', body: 'poppins' },
    uppercaseTitle: true,
    palette: () =>
      darkPalette(FESTIVAL.ground, FESTIVAL.pink, FESTIVAL.ink, '#ffffff'),
    background: drawStage,
    ticks: sparkleTicks('#ffd1f4'),
  },
  neon: {
    fonts: { title: 'poppins', body: 'poppins' },
    uppercaseTitle: true,
    palette: () => ({
      ...lightPalette(NEON.ground, NEON.ink, NEON.ink),
      track: 'rgba(17,17,17,0.2)',
      frame: '#ffffff',
    }),
    background: drawPoster,
    ticks: drawChevronTicks,
  },
  classic: {
    fonts: { title: 'playfair', body: 'open-sans' },
    palette: () => lightPalette(CLASSIC.ground, CLASSIC.burgundy, CLASSIC.ink),
    background: drawCertificate,
  },
  playful: {
    fonts: { title: 'poppins', body: 'poppins' },
    palette: () => lightPalette(PLAYFUL.ground, PLAYFUL.blue, PLAYFUL.ink),
    background: drawPlayShapes,
    ticks: drawConfettiTicks,
  },
  christmas: {
    palette: (): Palette => ({
      bg: XMAS.green,
      glow: 'rgba(244,197,66,0.22)',
      dot: '#ffffff',
      text: '#ffffff',
      muted: 'rgba(255,255,255,0.78)',
      accentText: XMAS.gold,
      giftPill: pillOnDark(XMAS.green),
      track: 'rgba(255,255,255,0.14)',
      bar: '#e53935',
      ctaBg: XMAS.red,
      ctaText: '#ffffff',
      ctaShadow: '#6d1414',
      ctaOutline: XMAS.gold,
      sparkle: XMAS.gold,
      tick: 'rgba(255,255,255,0.3)',
      avatarRing: XMAS.green,
      tip: XMAS.gold,
      tipGlow: 'rgba(244,197,66,0.7)',
      badgeBg: XMAS.gold,
      badgeText: XMAS.green,
      frame: '#ffffff',
      avatars: ['#c62828', '#2e7d32', '#b8860b', '#ad1457', '#1b5e20'],
    }),
    background: drawSnow,
    ticks: drawFairyLights,
    tip: (g, x, y, t, k, P) => drawStar(g, x, y, 26 * k, t * 1.5, P.tip),
    photoDecor: drawHolly,
    ctaDecor: drawRibbon,
  },
  halloween: {
    palette: (): Palette => ({
      bg: HW.night,
      glow: 'rgba(255,122,26,0.18)',
      dot: '#ffffff',
      text: '#ffffff',
      muted: 'rgba(255,255,255,0.75)',
      accentText: HW.orange,
      giftPill: pillOnDark(HW.night),
      track: 'rgba(255,255,255,0.12)',
      bar: HW.orange,
      ctaBg: HW.orange,
      ctaText: HW.night,
      ctaShadow: '#5a1f00',
      ctaOutline: HW.night,
      sparkle: '#ffb74d',
      tick: 'rgba(255,255,255,0.3)',
      avatarRing: HW.night,
      tip: '#ffcc80',
      tipGlow: 'rgba(255,122,26,0.8)',
      badgeBg: HW.orange,
      badgeText: HW.night,
      frame: HW.moon,
      avatars: ['#ff7a1a', '#6a1b9a', '#43a047', '#ef6c00', '#4a148c'],
    }),
    background: drawNight,
    ticks: drawPumpkins,
    tip: drawFlame,
    behindPhoto: (g, cx, cy, r) =>
      glowDot(g, cx, cy, r * 1.7, 'rgba(255,243,196,0.45)', 1),
    photoDecor: drawCobweb,
    ctaAround: drawDrips,
    urlGap: 44,
  },
  // Calm: soft colours and one still light, with the standard ring and no moving decoration.
  inMemory: {
    palette: () => lightPalette(MEMORY.ground, MEMORY.sage, MEMORY.ink),
    background: drawSoftLight,
  },
  wedding: {
    palette: () => lightPalette(WEDDING.ivory, WEDDING.gold, WEDDING.ink),
    background: drawPetals,
    ticks: drawGoldTicks,
    tip: (g, x, y, t, k, P) => {
      g.save();
      g.translate(x, y);
      g.rotate(t * 1.2);
      drawSparkle(g, 0, 0, 26 * k, P.sparkle);
      g.restore();
    },
  },
  earthDay: {
    palette: () => lightPalette(EARTH.ground, EARTH.green, EARTH.ink),
    background: drawLeaves,
    ticks: drawLeafTicks,
  },
  // Keeps the fundraiser's own colors, with gold lights that twinkle.
  celebration: {
    background: drawTwinkles,
    ticks: sparkleTicks('#f2b705'),
    tip: (g, x, y, t, k, P) => {
      g.save();
      g.translate(x, y);
      g.rotate(t * 2);
      drawSparkle(g, 0, 0, 28 * k, P.sparkle);
      g.restore();
    },
  },
  // Keeps the fundraiser's own colors.
  birthday: {
    background: drawConfetti,
    ticks: drawConfettiTicks,
    tip: (g, x, y, t, k, P) => {
      g.save();
      g.translate(x, y);
      g.rotate(t * 3);
      drawSparkle(g, 0, 0, 30 * k, P.sparkle);
      g.restore();
    },
    behindPhoto: drawBalloons,
    photoDecor: drawPartyHat,
    ctaAround: drawBurst,
  },
};

export function isSeasonId(value: string): value is SeasonId {
  return (SEASON_IDS as readonly string[]).includes(value);
}
