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

export function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function initBase(
  p: Particle,
  cfg: ParticleConfig,
  w: number,
  h: number,
) {
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
