import type { Particle, ParticleConfig } from './base';

import { initBase, rand } from './base';

const CONFETTI_COLORS = [
  '#f43f5e',
  '#3b82f6',
  '#eab308',
  '#22c55e',
  '#a855f7',
  '#f97316',
];

// Per-particle shape + spin geometry, kept out of the shared Particle type
// since it's confetti-only.
type ConfettiShape = 'circle' | 'rect' | 'twisted-rect' | 'rhombus';
const SHAPES: ConfettiShape[] = ['circle', 'rect', 'twisted-rect', 'rhombus'];

interface ConfettiExtra {
  shape: ConfettiShape;
  axis: number; // in-plane angle of the flip axis (0 = width, π/2 = height, anything between = diagonal)
  axisSpeed: number; // axis slowly precesses so the tumble isn't locked to one direction
  twist: number; // baked-in static rotation for the 'twisted-rect' shape
}

const extraByParticle = new WeakMap<Particle, ConfettiExtra>();

function rollExtra(): ConfettiExtra {
  return {
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    axis: rand(0, Math.PI),
    axisSpeed: rand(-0.015, 0.015),
    twist: rand(-0.6, 0.6),
  };
}

const confettiConfig: ParticleConfig = {
  count: 35,
  speedRange: [2.2, 4.5],
  sizeRange: [3, 9],
  driftRange: [-0.4, 0.4],
  opacityRange: [0.7, 1],
  colors: CONFETTI_COLORS,
  init(p, w, h) {
    initBase(p, this, w, h);
    extraByParticle.set(p, rollExtra());
  },
  update(p, w, h) {
    p.y += p.speed;
    p.x += p.drift;
    // p.phase (0..2π, unused elsewhere in confetti) doubles as each piece's own
    // tumble rate — spinning every piece at the same fixed rate looked robotic.
    p.rotation += 0.1 + (p.phase / (Math.PI * 2)) * 0.3;

    const extra = extraByParticle.get(p);
    if (extra) extra.axis += extra.axisSpeed;

    if (p.y > h + p.size) {
      p.y = -p.size;
      p.x = Math.random() * w;
      p.rotation = Math.random() * Math.PI * 2;
      p.phase = Math.random() * Math.PI * 2;
      extraByParticle.set(p, rollExtra());
    }
    if (p.x > w + p.size) p.x = -p.size;
    if (p.x < -p.size) p.x = w + p.size;
  },
  draw(ctx, p) {
    const extra = extraByParticle.get(p);
    if (!extra) return;

    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    ctx.save();
    ctx.translate(p.x, p.y);
    // Tumble around an arbitrary in-plane axis (never perpendicular to the
    // screen): rotate the axis to local-x, foreshorten across it, rotate back.
    // The axis itself slowly precesses (extra.axisSpeed), so pieces spin in
    // varied directions instead of a single fixed flip.
    ctx.rotate(extra.axis);
    ctx.scale(1, Math.cos(p.rotation));
    ctx.rotate(-extra.axis);

    switch (extra.shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'twisted-rect':
        ctx.rotate(extra.twist);
        ctx.fillRect(-p.size * 0.4, -p.size, p.size * 0.8, p.size * 2);
        break;
      case 'rhombus':
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.6, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.6, 0);
        ctx.closePath();
        ctx.fill();
        break;
      default:
        ctx.fillRect(-p.size * 0.4, -p.size, p.size * 0.8, p.size * 2);
    }

    ctx.restore();
  },
};

export default confettiConfig;
