import type { ParticleConfig } from './base';

import { initBase } from './base';

const snowConfig: ParticleConfig = {
  count: 40,
  speedRange: [0.3, 0.8],
  sizeRange: [4, 8],
  driftRange: [-0.3, 0.3],
  opacityRange: [0.4, 0.8],
  colors: ['#ffffff', '#e0f2fe', '#bae6fd'],
  init(p, w, h) {
    initBase(p, this, w, h);
  },
  update(p, w, h, time) {
    p.y += p.speed;
    p.x += Math.sin(time * 0.001 + p.phase) * 0.5 + p.drift;
    if (p.y > h + p.size) {
      p.y = -p.size;
      p.x = Math.random() * w;
    }
    if (p.x > w + p.size) p.x = -p.size;
    if (p.x < -p.size) p.x = w + p.size;
  },
  draw(ctx, p) {
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  },
};

export default snowConfig;
