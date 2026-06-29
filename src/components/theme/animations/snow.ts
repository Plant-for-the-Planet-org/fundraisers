import type { ParticleConfig } from './base';

import { initBase, rand } from './base';

const snowConfig: ParticleConfig = {
  count: 200,
  speedRange: [1.0, 2.8],
  sizeRange: [1.5, 3.5],
  driftRange: [0.4, 1.5],
  opacityRange: [0.5, 0.9],
  colors: ['#ffffff', '#e0f2fe', '#bae6fd'],
  init(p, w, h) {
    initBase(p, this, w, h);
    // bimodal: 60% small, 40% larger
    p.size = Math.random() < 0.75 ? rand(0.8, 2.5) : rand(3, 4);
    // t=0 small, t=1 large; large→more gravity, less wind; small→less gravity, more wind
    const t = Math.min(1, (p.size - 0.8) / 3.2);
    p.speed *= 0.5 + t * 0.75;
    p.drift *= 1.5 - t * 0.75;
  },
  update(p, w, h, time) {
    p.y += p.speed;
    p.x += Math.sin(time * 0.001 + p.phase) * 0.2 + p.drift;
    if (p.y > h + p.size) {
      p.y = -p.size;
      p.x = Math.random() * w;
    }
    if (p.x > w + p.size) p.x = -p.size;
    if (p.x < -p.size) p.x = w + p.size;
  },
  draw(ctx, p) {
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    g.addColorStop(0, p.color);
    g.addColorStop(0.5, p.color);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  },
};

export default snowConfig;
