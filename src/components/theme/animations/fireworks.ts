import { MOBILE_BREAKPOINT, pickRandom, rand } from './base';

// --- Burst size tiers ---
// A tier sets the *baseline* for a burst; every fragment jitters around it so no
// two fragments share size/force/brightness (kills the hollow uniform-ring look).
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
    fragments: 16,
    speed: 3.0,
    fadeFrames: 40,
    trailWidth: 1.5,
    glowRadius: 4,
  },
  m: {
    fragments: 28,
    speed: 3.8,
    fadeFrames: 70,
    trailWidth: 2,
    glowRadius: 5,
  },
  l: {
    fragments: 42,
    speed: 4.6,
    fadeFrames: 100,
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

// --- Trails (ring buffers) ---
const TRAIL_LENGTH = 10; // fragment streak
const ROCKET_TRAIL_LENGTH = 16; // rising rocket streak

interface Fragment {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trailWidth: number;
  glowRadius: number;
  brightness: number; // per-fragment base alpha multiplier (varying brightness)
  twinkleSpeed: number; // 0 = steady (small); >0 = sparkles (large)
  phase: number;
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
}

interface Rocket {
  x: number;
  y: number;
  vx: number;
  vy: number; // negative = rising
  size: BurstSize;
  color: string;
  trailX: Float32Array;
  trailY: Float32Array;
  trailIdx: number;
  trailFill: number;
}

export interface FireworkState {
  rockets: Rocket[];
  bursts: Burst[];
  spawnTimer: number;
  nextSpawnAt: number;
  maxRockets: number;
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

// --- Rocket physics ---
// Rocket force (vy0) directly drives its burst height: height = vy0² / (2 * gravity).
// Randomizing the target height and deriving vy0 from it (instead of randomizing
// speed and height independently) guarantees stronger launches visibly climb higher.
const ROCKET_GRAVITY = 0.15; // decelerates the rising rocket toward apex
const ROCKET_MIN_HEIGHT_FRAC = 0.3; // lowest apex, as a fraction of viewport height
const ROCKET_MAX_HEIGHT_FRAC = 0.8; // highest apex, as a fraction of viewport height
const ROCKET_MIN_APEX_FRAC = 0.08; // safety ceiling: never burst above this from the top
const ROCKET_MAX_TILT = 1.3; // horizontal velocity spread; near-vertical ("not too slant")

function createRocket(w: number, h: number): Rocket {
  const size = pickRandom(BURST_SIZES);
  const color = pickRandom(FIREWORK_COLORS);
  const riseHeight = h * rand(ROCKET_MIN_HEIGHT_FRAC, ROCKET_MAX_HEIGHT_FRAC);
  const speed = Math.sqrt(2 * ROCKET_GRAVITY * riseHeight);
  return {
    x: rand(w * 0.15, w * 0.85),
    y: h,
    vx: rand(-ROCKET_MAX_TILT, ROCKET_MAX_TILT),
    vy: -speed,
    size,
    color,
    trailX: new Float32Array(ROCKET_TRAIL_LENGTH),
    trailY: new Float32Array(ROCKET_TRAIL_LENGTH),
    trailIdx: 0,
    trailFill: 0,
  };
}

function createBurst(
  cx: number,
  cy: number,
  size: BurstSize,
  color: string,
  fragmentScale: number
): Burst {
  const tier = SIZE_TIERS[size];
  const count = Math.max(6, Math.round(tier.fragments * fragmentScale));
  const fragments: Fragment[] = new Array(count);

  for (let i = 0; i < count; i++) {
    // Pure-random angle (not evenly spaced) → organic clumps/gaps, no perfect ring.
    const angle = rand(0, Math.PI * 2);
    // Wide force range → slow fragments stay near center (filled), fast ones fly out.
    const speed = rand(0.15, 1) * tier.speed;
    const widthJitter = rand(0.6, 1.35);
    const sparkles = widthJitter >= 1; // larger fragments sparkle
    fragments[i] = {
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      trailWidth: tier.trailWidth * widthJitter,
      glowRadius: tier.glowRadius * rand(0.7, 1.4),
      brightness: rand(0.5, 1),
      twinkleSpeed: sparkles ? rand(0.15, 0.35) : 0,
      phase: rand(0, Math.PI * 2),
      color,
      trailX: new Float32Array(TRAIL_LENGTH),
      trailY: new Float32Array(TRAIL_LENGTH),
      trailIdx: 0,
      trailFill: 0,
    };
  }

  return {
    cx,
    cy,
    fragments,
    age: 0,
    maxAge: tier.fadeFrames,
    gravity: 0.03,
    opacity: 1,
  };
}

interface Trailed {
  x: number;
  y: number;
  trailX: Float32Array;
  trailY: Float32Array;
  trailIdx: number;
  trailFill: number;
}

function pushTrail(o: Trailed, len: number) {
  o.trailX[o.trailIdx] = o.x;
  o.trailY[o.trailIdx] = o.y;
  o.trailIdx = (o.trailIdx + 1) % len;
  if (o.trailFill < len) o.trailFill++;
}

export interface FireworkConfig {
  init: (w: number, h: number) => FireworkState;
  update: (state: FireworkState, w: number, h: number) => void;
  draw: (ctx: CanvasRenderingContext2D, state: FireworkState) => void;
}

const SPAWN_INTERVAL_MIN = 40;
const SPAWN_INTERVAL_MAX = 100;
const FLASH_DURATION = 2.5; // frames the blast-center flash stays visible
const FLASH_PEAK_ALPHA = 0.5; // dims the flash so it doesn't blow out the burst

export const fireworkConfig: FireworkConfig = {
  init(w) {
    const isMobile = w < MOBILE_BREAKPOINT;
    return {
      rockets: [],
      bursts: [],
      spawnTimer: 0,
      nextSpawnAt: Math.floor(rand(10, 40)),
      maxRockets: isMobile ? 2 : 4,
      maxBursts: isMobile ? 3 : 6,
      fragmentScale: isMobile ? 0.55 : 1,
    };
  },

  update(state, w, h) {
    // --- spawn rockets ---
    state.spawnTimer++;
    if (
      state.spawnTimer >= state.nextSpawnAt &&
      state.rockets.length < state.maxRockets &&
      state.bursts.length < state.maxBursts
    ) {
      state.rockets.push(createRocket(w, h));
      state.spawnTimer = 0;
      state.nextSpawnAt = Math.floor(
        rand(SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_MAX)
      );
    }

    // --- rockets rise, then explode ---
    for (let i = state.rockets.length - 1; i >= 0; i--) {
      const r = state.rockets[i];
      pushTrail(r, ROCKET_TRAIL_LENGTH);
      r.x += r.vx;
      r.y += r.vy;
      r.vy += ROCKET_GRAVITY;

      // Explode at apex (velocity turns downward), or at the safety ceiling for
      // strong launches on tall viewports.
      if (r.vy >= 0 || r.y <= h * ROCKET_MIN_APEX_FRAC) {
        if (state.bursts.length < state.maxBursts) {
          state.bursts.push(
            createBurst(r.x, r.y, r.size, r.color, state.fragmentScale)
          );
        }
        state.rockets.splice(i, 1);
      }
    }

    // --- bursts spread, fall, fade ---
    for (const burst of state.bursts) {
      burst.age++;
      const progress = burst.age / burst.maxAge;
      burst.opacity = Math.max(0, 1 - progress * progress); // quadratic fade envelope

      for (const f of burst.fragments) {
        pushTrail(f, TRAIL_LENGTH);
        f.x += f.vx;
        f.y += f.vy;
        f.vy += burst.gravity;
        f.vx *= 0.98;
        f.vy *= 0.98;
      }
    }

    state.bursts = state.bursts.filter(b => b.age < b.maxAge);
  },

  draw(ctx, state) {
    ctx.lineCap = 'round';

    // --- rockets ---
    for (const r of state.rockets) {
      const rgb = hexToRgb(r.color);
      // rising streak: fades from faint tail to bright head
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 2;
      strokeFadingTrail(ctx, r, ROCKET_TRAIL_LENGTH, 0.6);
      // bright head
      ctx.globalAlpha = 1;
      ctx.fillStyle = r.color;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
      // small glow
      const grad = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, 6);
      grad.addColorStop(0, `rgba(${rgb},0.6)`);
      grad.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- bursts ---
    for (const burst of state.bursts) {
      if (burst.opacity <= 0) continue;

      // Bright flash at the blast center, quick decay over the first few frames.
      if (burst.age <= FLASH_DURATION) {
        const flashAlpha =
          FLASH_PEAK_ALPHA * (1 - burst.age / FLASH_DURATION) ** 2;
        if (flashAlpha > 0.02) {
          const color = burst.fragments[0]?.color ?? '#ffffff';
          const rgb = hexToRgb(color);
          const flashRadius = 12 + burst.fragments.length * 0.35;
          const grad = ctx.createRadialGradient(
            burst.cx,
            burst.cy,
            0,
            burst.cx,
            burst.cy,
            flashRadius
          );
          grad.addColorStop(0, `rgba(255,255,255,${flashAlpha})`);
          grad.addColorStop(0.35, `rgba(${rgb},${flashAlpha * 0.85})`);
          grad.addColorStop(1, `rgba(${rgb},0)`);
          ctx.fillStyle = grad;
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(burst.cx, burst.cy, flashRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      for (const f of burst.fragments) {
        // sparkle: large fragments blip in brightness; small ones stay steady.
        const twinkle =
          f.twinkleSpeed > 0
            ? 0.55 + 0.45 * Math.sin(burst.age * f.twinkleSpeed + f.phase)
            : 1;
        const alpha = burst.opacity * f.brightness * twinkle;
        if (alpha <= 0.02) continue;

        ctx.strokeStyle = f.color;

        // trail streak (fainter)
        ctx.globalAlpha = alpha * 0.45;
        ctx.lineWidth = f.trailWidth * 0.7;
        strokeTrail(ctx, f, TRAIL_LENGTH);

        // fresh segment (last trail point → current)
        if (f.trailFill >= 1) {
          const lastIdx = (f.trailIdx - 1 + TRAIL_LENGTH) % TRAIL_LENGTH;
          ctx.globalAlpha = alpha * 0.85;
          ctx.lineWidth = f.trailWidth;
          ctx.beginPath();
          ctx.moveTo(f.trailX[lastIdx], f.trailY[lastIdx]);
          ctx.lineTo(f.x, f.y);
          ctx.stroke();
        }

        // head dot
        ctx.globalAlpha = alpha;
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.trailWidth * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // glow only for sparkling (large/bright) fragments → bounds fill cost
        if (f.twinkleSpeed > 0) {
          const rgb = hexToRgb(f.color);
          const rad = f.glowRadius;
          const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, rad);
          grad.addColorStop(0, `rgba(${rgb},${alpha * 0.7})`);
          grad.addColorStop(0.4, `rgba(${rgb},${alpha * 0.3})`);
          grad.addColorStop(1, `rgba(${rgb},0)`);
          ctx.fillStyle = grad;
          ctx.globalAlpha = 1; // opacity baked into stops
          ctx.beginPath();
          ctx.arc(f.x, f.y, rad, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.globalAlpha = 1;
  },
};

// Stroke the ring-buffer trail from oldest → newest as a connected polyline.
function strokeTrail(ctx: CanvasRenderingContext2D, o: Trailed, len: number) {
  if (o.trailFill < 2) return;
  const oldest = o.trailFill < len ? 0 : o.trailIdx;
  ctx.beginPath();
  for (let j = 0; j < o.trailFill - 1; j++) {
    const a = (oldest + j) % len;
    const b = (oldest + j + 1) % len;
    ctx.moveTo(o.trailX[a], o.trailY[a]);
    ctx.lineTo(o.trailX[b], o.trailY[b]);
  }
  ctx.stroke();
}

// Same as strokeTrail, but drawn in bands with rising opacity so the tail fades
// out and the head stays bright.
const FADE_BANDS = 4;
function strokeFadingTrail(
  ctx: CanvasRenderingContext2D,
  o: Trailed,
  len: number,
  baseAlpha: number
) {
  const totalSegs = o.trailFill - 1;
  if (totalSegs < 1) return;
  const oldest = o.trailFill < len ? 0 : o.trailIdx;
  const bandSize = Math.max(1, Math.ceil(totalSegs / FADE_BANDS));

  for (let band = 0; band < FADE_BANDS; band++) {
    const start = band * bandSize;
    const end = Math.min(start + bandSize, totalSegs);
    if (start >= end) break;

    const t = (band + 1) / FADE_BANDS;
    ctx.globalAlpha = baseAlpha * (0.12 + 0.88 * t * t);
    ctx.beginPath();
    for (let j = start; j < end; j++) {
      const a = (oldest + j) % len;
      const b = (oldest + j + 1) % len;
      ctx.moveTo(o.trailX[a], o.trailY[a]);
      ctx.lineTo(o.trailX[b], o.trailY[b]);
    }
    ctx.stroke();
  }
}
