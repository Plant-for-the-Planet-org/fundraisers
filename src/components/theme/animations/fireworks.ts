import { MOBILE_BREAKPOINT, pickRandom, rand } from './base';

// --- Burst size tiers ---
type BurstSize = 's' | 'm' | 'l';
interface SizeTier {
  fragments: number;
  speed: number;
  fadeFrames: number;
  trailWidth: number;
  glowRadius: number;
}

const SIZE_TIERS: Record<BurstSize, SizeTier> = {
  s: {
    fragments: 12,
    speed: 2.2,
    fadeFrames: 60,
    trailWidth: 1.5,
    glowRadius: 4,
  },
  m: {
    fragments: 18,
    speed: 2.6,
    fadeFrames: 120,
    trailWidth: 2,
    glowRadius: 5,
  },
  l: {
    fragments: 24,
    speed: 3.0,
    fadeFrames: 180,
    trailWidth: 2.5,
    glowRadius: 6,
  },
};

const BURST_SIZES: BurstSize[] = ['s', 'm', 'l'];

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

// --- Fragment ---
// Ring buffer trail, longer for visible streaks
const TRAIL_LENGTH = 18;

interface Fragment {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trailWidth: number;
  glowRadius: number;
  color: string;
  trailX: Float32Array;
  trailY: Float32Array;
  trailIdx: number;
  trailFill: number;
}

interface Burst {
  cx: number;
  cy: number;
  fragments: Fragment[];
  age: number;
  maxAge: number;
  gravity: number;
  opacity: number;
  color: string;
}

export interface FireworkState {
  bursts: Burst[];
  spawnTimer: number;
  nextSpawnAt: number;
  maxBursts: number;
  fragmentScale: number;
}

// Parse hex color to "r,g,b" string for use in rgba(). Cached per color.
const rgbCache = new Map<string, string>();
function hexToRgb(hex: string): string {
  let cached = rgbCache.get(hex);
  if (cached) return cached;
  const n = parseInt(hex.slice(1), 16);
  cached = `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  rgbCache.set(hex, cached);
  return cached;
}

function createBurst(w: number, h: number, fragmentScale: number): Burst {
  const size = pickRandom(BURST_SIZES);
  const tier = SIZE_TIERS[size];
  const color = pickRandom(FIREWORK_COLORS);
  const cx = rand(w * 0.15, w * 0.85);
  const cy = rand(h * 0.1, h * 0.7);

  const fragmentCount = Math.max(4, Math.round(tier.fragments * fragmentScale));
  const fragments: Fragment[] = [];
  for (let i = 0; i < fragmentCount; i++) {
    const angle = (Math.PI * 2 * i) / fragmentCount + rand(-0.15, 0.15);
    const speed = rand(0.6, 1.0) * tier.speed;
    fragments.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      trailWidth: tier.trailWidth,
      glowRadius: tier.glowRadius,
      color,
      trailX: new Float32Array(TRAIL_LENGTH),
      trailY: new Float32Array(TRAIL_LENGTH),
      trailIdx: 0,
      trailFill: 0,
    });
  }

  return {
    cx,
    cy,
    fragments,
    age: 0,
    maxAge: tier.fadeFrames,
    gravity: 0.02,
    opacity: 1,
    color,
  };
}

export interface FireworkConfig {
  init: (w: number, h: number) => FireworkState;
  update: (state: FireworkState, w: number, h: number) => void;
  draw: (ctx: CanvasRenderingContext2D, state: FireworkState) => void;
}

const SPAWN_INTERVAL_MIN = 30;
const SPAWN_INTERVAL_MAX = 90;

export const fireworkConfig: FireworkConfig = {
  init(w) {
    const isMobile = w < MOBILE_BREAKPOINT;
    return {
      bursts: [],
      spawnTimer: 0,
      nextSpawnAt: Math.floor(rand(10, 40)),
      maxBursts: isMobile ? 6 : 10,
      fragmentScale: isMobile ? 0.6 : 1,
    };
  },

  update(state, w, h) {
    state.spawnTimer++;
    if (
      state.spawnTimer >= state.nextSpawnAt &&
      state.bursts.length < state.maxBursts
    ) {
      state.bursts.push(createBurst(w, h, state.fragmentScale));
      state.spawnTimer = 0;
      state.nextSpawnAt = Math.floor(
        rand(SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_MAX)
      );
    }

    for (const burst of state.bursts) {
      burst.age++;
      const progress = burst.age / burst.maxAge;
      burst.opacity = Math.max(0, 1 - progress * progress);

      for (const f of burst.fragments) {
        f.trailX[f.trailIdx] = f.x;
        f.trailY[f.trailIdx] = f.y;
        f.trailIdx = (f.trailIdx + 1) % TRAIL_LENGTH;
        if (f.trailFill < TRAIL_LENGTH) f.trailFill++;

        f.x += f.vx;
        f.y += f.vy;
        f.vy += burst.gravity;
        f.vx *= 0.99;
        f.vy *= 0.99;
      }
    }

    state.bursts = state.bursts.filter(b => b.age < b.maxAge);
  },

  draw(ctx, state) {
    ctx.lineCap = 'round';

    for (const burst of state.bursts) {
      if (burst.opacity <= 0) continue;

      const tw = burst.fragments[0].trailWidth;

      // 1) Trails: 4 opacity bands for smooth fade
      const bandCount = 4;
      const bandSize = Math.ceil(TRAIL_LENGTH / bandCount);
      const bandOpacities = [0.08, 0.2, 0.4, 0.65];
      const bandWidths = [0.3, 0.5, 0.75, 1.0];

      ctx.strokeStyle = burst.color;

      for (let band = 0; band < bandCount; band++) {
        ctx.globalAlpha = bandOpacities[band] * burst.opacity;
        ctx.lineWidth = tw * bandWidths[band];

        ctx.beginPath();
        for (const f of burst.fragments) {
          if (f.trailFill < 2) continue;

          const oldest = f.trailFill < TRAIL_LENGTH ? 0 : f.trailIdx;
          const bandStart = band * bandSize;
          const bandEnd = Math.min((band + 1) * bandSize, f.trailFill - 1);

          for (let j = bandStart; j < bandEnd; j++) {
            if (j >= f.trailFill - 1) break;
            const idxA = (oldest + j) % TRAIL_LENGTH;
            const idxB = (oldest + j + 1) % TRAIL_LENGTH;
            ctx.moveTo(f.trailX[idxA], f.trailY[idxA]);
            ctx.lineTo(f.trailX[idxB], f.trailY[idxB]);
          }
        }
        ctx.stroke();
      }

      // 2) Newest trail segment to current position
      ctx.globalAlpha = burst.opacity * 0.8;
      ctx.lineWidth = tw;
      ctx.beginPath();
      for (const f of burst.fragments) {
        if (f.trailFill < 1) continue;
        const lastIdx = (f.trailIdx - 1 + TRAIL_LENGTH) % TRAIL_LENGTH;
        ctx.moveTo(f.trailX[lastIdx], f.trailY[lastIdx]);
        ctx.lineTo(f.x, f.y);
      }
      ctx.stroke();

      // 3) Head dots: bright center
      ctx.globalAlpha = burst.opacity;
      ctx.fillStyle = burst.color;
      ctx.beginPath();
      for (const f of burst.fragments) {
        ctx.moveTo(f.x + tw * 0.6, f.y);
        ctx.arc(f.x, f.y, tw * 0.6, 0, Math.PI * 2);
      }
      ctx.fill();

      // 4) Radial gradient glow per head (individual draws, no shadowBlur)
      const rgb = hexToRgb(burst.color);
      for (const f of burst.fragments) {
        const r = f.glowRadius;
        const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
        grad.addColorStop(0, `rgba(${rgb},${burst.opacity * 0.7})`);
        grad.addColorStop(0.4, `rgba(${rgb},${burst.opacity * 0.3})`);
        grad.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = grad;
        ctx.globalAlpha = 1; // opacity baked into gradient stops
        ctx.beginPath();
        ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
  },
};
