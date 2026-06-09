import type { ThemeMode } from '@/lib/theme/types';
import type { ParticleConfig } from './base';

import { initBase } from './base';

export function createHeartsConfig(mode: ThemeMode): ParticleConfig {
  const isDark = mode === 'dark';

  return {
    count: 25,
    speedRange: [0.2, 0.6],
    sizeRange: [6, 12],
    driftRange: [-0.2, 0.2],
    opacityRange: isDark ? [0.2, 0.7] : [0.3, 0.6],
    colors: isDark ? ['#ffffff'] : ['#fb7185', '#f43f5e', '#e11d48', '#fda4af'],
    init(p, w, h) {
      initBase(p, this, w, h);
    },
    update(p, w, h, time) {
      p.y -= p.speed;
      p.x += Math.sin(time * 0.0008 + p.phase) * 0.4 + p.drift;
      if (p.y < -p.size * 2) {
        p.y = h + p.size;
        p.x = Math.random() * w;
      }
      if (p.x > w + p.size) p.x = -p.size;
      if (p.x < -p.size) p.x = w + p.size;
    },
    draw(ctx, p) {
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      const s = p.size;
      const h = s * 1.6;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + s * 0.35);
      ctx.bezierCurveTo(
        p.x,
        p.y,
        p.x - s,
        p.y - s * 0.1,
        p.x - s,
        p.y + s * 0.35
      );
      ctx.bezierCurveTo(
        p.x - s,
        p.y + s * 0.8,
        p.x - s * 0.3,
        p.y + h * 0.7,
        p.x,
        p.y + h
      );
      ctx.bezierCurveTo(
        p.x + s * 0.3,
        p.y + h * 0.7,
        p.x + s,
        p.y + s * 0.8,
        p.x + s,
        p.y + s * 0.35
      );
      ctx.bezierCurveTo(p.x + s, p.y - s * 0.1, p.x, p.y, p.x, p.y + s * 0.35);
      ctx.fill();
    },
  };
}
