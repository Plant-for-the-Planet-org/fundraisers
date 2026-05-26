import type { AnimationType, ThemeMode } from '@/lib/theme/types';

export interface Particle {
  x: number;
  y: number;
  speed: number;
  size: number;
  drift: number;
  opacity: number;
  rotation: number;
  color: string;
  phase: number;
}

export interface ParticleConfig {
  count: number;
  speedRange: [number, number];
  sizeRange: [number, number];
  driftRange: [number, number];
  opacityRange: [number, number];
  colors: string[];
  init: (p: Particle, w: number, h: number) => void;
  update: (p: Particle, w: number, h: number, time: number) => void;
  draw: (ctx: CanvasRenderingContext2D, p: Particle) => void;
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function initBase(p: Particle, cfg: ParticleConfig, w: number, h: number) {
  p.x = Math.random() * w;
  p.y = Math.random() * h;
  p.speed = rand(...cfg.speedRange);
  p.size = rand(...cfg.sizeRange);
  p.drift = rand(...cfg.driftRange);
  p.opacity = rand(...cfg.opacityRange);
  p.rotation = Math.random() * Math.PI * 2;
  p.color = cfg.colors[Math.floor(Math.random() * cfg.colors.length)];
  p.phase = Math.random() * Math.PI * 2;
}

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
    ctx.strokeStyle = p.color;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 3;
    ctx.lineWidth = 1.5;
    const s = p.size;
    const arms = 6;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.beginPath();
    for (let i = 0; i < arms; i++) {
      const angle = (Math.PI * 2 * i) / arms;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      ctx.moveTo(0, 0);
      ctx.lineTo(cos * s, sin * s);
      ctx.moveTo(
        cos * s * 0.5 - sin * s * 0.25,
        sin * s * 0.5 + cos * s * 0.25
      );
      ctx.lineTo(cos * s * 0.5, sin * s * 0.5);
      ctx.moveTo(
        cos * s * 0.5 + sin * s * 0.25,
        sin * s * 0.5 - cos * s * 0.25
      );
      ctx.lineTo(cos * s * 0.5, sin * s * 0.5);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;
    // -- round snowflake (alternative) --
    // ctx.beginPath();
    // ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    // ctx.fill();
  },
};

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

const heartsConfig: ParticleConfig = {
  count: 25,
  speedRange: [0.2, 0.8],
  sizeRange: [6, 12],
  driftRange: [-0.2, 0.2],
  opacityRange: [0.3, 0.6],
  colors: ['#fb7185', '#f43f5e', '#e11d48', '#fda4af'],
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
    const h = s * 1.8;
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

function getParticleColors(mode: ThemeMode): string[] {
  return mode === 'dark'
    ? ['#ffffff', '#e2e8f0', '#cbd5e1']
    : ['#fbbf24', '#f59e0b', '#ffffff', '#fde68a'];
}

function createParticlesConfig(mode: ThemeMode): ParticleConfig {
  return {
    count: 30,
    speedRange: [0.1, 0.4],
    sizeRange: [3, 6],
    driftRange: [-0.2, 0.2],
    opacityRange: [0.4, 0.85],
    colors: getParticleColors(mode),
    init(p, w, h) {
      initBase(p, this, w, h);
      p.drift = rand(-0.2, 0.2);
      p.speed = rand(-0.2, 0.2);
    },
    update(p, w, h, time) {
      p.x += p.drift;
      p.y += p.speed;
      p.opacity = rand(0.3, 0.5) + Math.sin(time * 0.002 + p.phase) * 0.2;
      if (p.x > w + p.size) p.x = -p.size;
      if (p.x < -p.size) p.x = w + p.size;
      if (p.y > h + p.size) p.y = -p.size;
      if (p.y < -p.size) p.y = h + p.size;
    },
    draw(ctx, p) {
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 4;
      const s = p.size;
      const points = 4;
      const inner = s * 0.3;
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const angle = (Math.PI * i) / points - Math.PI / 2;
        const r = i % 2 === 0 ? s : inner;
        const px = p.x + Math.cos(angle) * r;
        const py = p.y + Math.sin(angle) * r;
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          const prevAngle = (Math.PI * (i - 1)) / points - Math.PI / 2;
          const prevR = (i - 1) % 2 === 0 ? s : inner;
          const midAngle = (prevAngle + angle) / 2;
          const cpR = (prevR + r) * 0.35;
          const cpx = p.x + Math.cos(midAngle) * cpR;
          const cpy = p.y + Math.sin(midAngle) * cpR;
          ctx.quadraticCurveTo(cpx, cpy, px, py);
        }
      }
      const firstAngle = -Math.PI / 2;
      const lastAngle = (Math.PI * (points * 2 - 1)) / points - Math.PI / 2;
      const midAngle = (lastAngle + firstAngle + Math.PI * 2) / 2;
      const cpR = (s + inner) * 0.35;
      ctx.quadraticCurveTo(
        p.x + Math.cos(midAngle) * cpR,
        p.y + Math.sin(midAngle) * cpR,
        p.x + Math.cos(firstAngle) * s,
        p.y + Math.sin(firstAngle) * s
      );
      ctx.fill();
      ctx.shadowBlur = 0;
    },
  };
}

export function getAnimationConfig(
  type: AnimationType,
  mode: ThemeMode
): ParticleConfig | null {
  switch (type) {
    case 'snow':
      return snowConfig;
    case 'confetti':
      return confettiConfig;
    case 'hearts':
      return heartsConfig;
    case 'particles':
      return createParticlesConfig(mode);
    default:
      return null;
  }
}
