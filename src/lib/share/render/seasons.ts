import type { Ctx, Palette, Season, TickOptions } from './types';

import {
  drawSparkle,
  drawStar,
  glowDot,
  phase,
  rand,
  roundRect,
} from './primitives';

export const SEASON_IDS = [
  'none',
  'christmas',
  'halloween',
  'birthday',
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

// ---------- Seasons ----------

export const SEASONS: Record<SeasonId, Season> = {
  none: {},
  christmas: {
    palette: (): Palette => ({
      bg: XMAS.green,
      glow: 'rgba(244,197,66,0.22)',
      dot: '#ffffff',
      text: '#ffffff',
      muted: 'rgba(255,255,255,0.78)',
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
