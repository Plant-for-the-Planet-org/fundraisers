import type { ParticleConfig } from './base';

import { initBase } from './base';

const CONFETTI_COLORS = [
  '#f43f5e',
  '#3b82f6',
  '#eab308',
  '#22c55e',
  '#a855f7',
  '#f97316',
];

const confettiConfig: ParticleConfig = {
  count: 35,
  speedRange: [0.5, 1.2],
  sizeRange: [3, 6],
  driftRange: [-0.4, 0.4],
  opacityRange: [0.7, 1],
  colors: CONFETTI_COLORS,
  init(p, w, h) {
    initBase(p, this, w, h);
  },
  update(p, w, h) {
    p.y += p.speed;
    p.x += p.drift;
    p.rotation += 0.03;
    if (p.y > h + p.size) {
      p.y = -p.size;
      p.x = Math.random() * w;
      p.rotation = Math.random() * Math.PI * 2;
    }
    if (p.x > w + p.size) p.x = -p.size;
    if (p.x < -p.size) p.x = w + p.size;
  },
  draw(ctx, p) {
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillRect(-p.size * 0.4, -p.size, p.size * 0.8, p.size * 2);
    ctx.restore();
  },
};

export default confettiConfig;
