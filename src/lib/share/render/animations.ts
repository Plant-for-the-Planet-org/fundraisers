import type { AnimationType } from '@/lib/theme/types';
import type { Ctx } from './types';

import { rand } from './primitives';
import { drawConfetti, drawSnow } from './seasons';

// Colours from the page's own animations (src/components/theme/animations).
const HEART_COLORS_LIGHT = ['#fb7185', '#f43f5e', '#e11d48', '#fda4af'];
const FIREWORK_COLORS = [
  '#f43f5e',
  '#fbbf24',
  '#3b82f6',
  '#22c55e',
  '#a855f7',
  '#ffffff',
  '#f97316',
  '#06b6d4',
];

function heartPath(g: Ctx, x: number, y: number, size: number) {
  const s = size / 2;
  g.beginPath();
  g.moveTo(x, y + s * 0.6);
  g.bezierCurveTo(
    x - s * 1.4,
    y - s * 0.4,
    x - s * 0.5,
    y - s * 1.4,
    x,
    y - s * 0.55
  );
  g.bezierCurveTo(
    x + s * 0.5,
    y - s * 1.4,
    x + s * 1.4,
    y - s * 0.4,
    x,
    y + s * 0.6
  );
  g.closePath();
}

/** Hearts drifting up. */
function drawHearts(g: Ctx, w: number, h: number, t: number, dark: boolean) {
  const count = Math.round((w * h) / 60000);
  const scale = w / 1080;
  for (let i = 0; i < count; i++) {
    const size = (18 + rand(i, 1) * 26) * scale;
    const speed = 50 + rand(i, 2) * 70;
    const y = h + 40 - ((rand(i, 3) * (h + 80) + t * speed) % (h + 80));
    const x = rand(i, 4) * w + Math.sin(t * 1.3 + i) * 24 * scale;
    g.globalAlpha = 0.35 + rand(i, 5) * 0.4;
    g.fillStyle = dark
      ? '#ffffff'
      : HEART_COLORS_LIGHT[i % HEART_COLORS_LIGHT.length];
    heartPath(g, x, y, size);
    g.fill();
  }
  g.globalAlpha = 1;
}

/** Bursts that open, fade, and start again somewhere else. */
function drawFireworks(g: Ctx, w: number, h: number, t: number) {
  const scale = w / 1080;
  const cycle = 2.4;
  for (let b = 0; b < 3; b++) {
    const local = t + b * (cycle / 3);
    const round = Math.floor(local / cycle);
    const p = (local % cycle) / cycle;
    const seed = b * 31 + round * 7;
    const cx = (0.15 + rand(seed, 1) * 0.7) * w;
    const cy = (0.1 + rand(seed, 2) * 0.35) * h;
    const color =
      FIREWORK_COLORS[Math.floor(rand(seed, 3) * FIREWORK_COLORS.length)];
    const radius = (140 + rand(seed, 4) * 120) * scale * Math.min(1, p * 1.6);
    g.fillStyle = color;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      g.globalAlpha = Math.max(0, 1 - p) * 0.9;
      g.beginPath();
      g.arc(
        cx + Math.cos(a) * radius,
        cy + Math.sin(a) * radius + p * p * 60 * scale,
        4 * scale,
        0,
        Math.PI * 2
      );
      g.fill();
    }
  }
  g.globalAlpha = 1;
}

/** The theme's animation, one frame. */
export function drawThemeAnimation(
  g: Ctx,
  animation: AnimationType,
  w: number,
  h: number,
  t: number,
  dark: boolean
) {
  switch (animation) {
    case 'snow':
      return drawSnow(g, w, h, t);
    case 'confetti':
      return drawConfetti(g, w, h, t);
    case 'hearts':
      return drawHearts(g, w, h, t, dark);
    case 'fireworks':
      return drawFireworks(g, w, h, t);
    default:
      return;
  }
}
