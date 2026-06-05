'use client';

import type { AnimationType, ThemeMode } from '@/lib/theme/types';
import type { Particle, ParticleConfig } from './animations/base';
import type { FireworkConfig, FireworkState } from './animations/fireworks';

import { useEffect, useRef } from 'react';
import { MOBILE_BREAKPOINT } from './animations/base';

const RESIZE_DEBOUNCE = 200;

// Animations above content (z-20), below overlays (z-50)
const ABOVE_CONTENT: ReadonlySet<AnimationType> = new Set([
  'confetti',
  'fireworks',
]);

type LoadedConfig =
  | { kind: 'particle'; config: ParticleConfig }
  | { kind: 'firework'; config: FireworkConfig };

// Lazy-load per-animation config. Only the selected animation's code is fetched.
async function loadConfig(
  type: AnimationType,
  mode: ThemeMode
): Promise<LoadedConfig | null> {
  switch (type) {
    case 'snow': {
      const mod = await import('./animations/snow');
      return { kind: 'particle', config: mod.default };
    }
    case 'confetti': {
      const mod = await import('./animations/confetti');
      return { kind: 'particle', config: mod.default };
    }
    case 'hearts': {
      const mod = await import('./animations/hearts');
      return { kind: 'particle', config: mod.createHeartsConfig(mode) };
    }
    case 'fireworks': {
      const mod = await import('./animations/fireworks');
      return { kind: 'firework', config: mod.fireworkConfig };
    }
    default:
      return null;
  }
}

export default function AnimationOverlay({
  animation,
  mode,
}: {
  animation: AnimationType;
  mode: ThemeMode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas: HTMLCanvasElement = canvasRef.current;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let particles: Particle[] = [];
    let fireworkState: FireworkState | null = null;
    let loadedConfig: LoadedConfig | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let w = 0;
    let h = 0;
    let rafId = 0;
    let alive = true;

    function setupCanvas() {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      // Cache the 2D context once; reused every frame in loop().
      ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }

    function initParticles(config: ParticleConfig) {
      const count =
        w < MOBILE_BREAKPOINT ? Math.floor(config.count * 0.6) : config.count;

      particles = [];
      for (let i = 0; i < count; i++) {
        // config.init() -> initBase() fully populates every Particle field.
        const p = {} as Particle;
        config.init(p, w, h);
        particles.push(p);
      }
    }

    function resize() {
      setupCanvas();
      if (loadedConfig?.kind === 'particle') {
        initParticles(loadedConfig.config);
      }
      if (loadedConfig?.kind === 'firework') {
        fireworkState = loadedConfig.config.init(w, h);
      }
    }

    function loop(time: number) {
      if (!alive) return;

      if (document.hidden) {
        rafId = requestAnimationFrame(loop);
        return;
      }

      if (!ctx || !loadedConfig) {
        rafId = requestAnimationFrame(loop);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      if (loadedConfig.kind === 'particle') {
        const config = loadedConfig.config;
        for (const p of particles) {
          if (!reducedMotion) {
            config.update(p, w, h, time);
          }
          config.draw(ctx, p);
        }
      } else if (loadedConfig.kind === 'firework' && fireworkState) {
        if (!reducedMotion) {
          loadedConfig.config.update(fireworkState, w, h);
        }
        loadedConfig.config.draw(ctx, fireworkState);
      }

      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(loop);
    }

    // Setup canvas immediately, load config async
    setupCanvas();

    loadConfig(animation, mode).then(result => {
      if (!alive) return;
      loadedConfig = result;
      if (!result) return;

      if (result.kind === 'particle') {
        initParticles(result.config);
      } else {
        fireworkState = result.config.init(w, h);
      }

      rafId = requestAnimationFrame(loop);
    });

    let resizeTimer: ReturnType<typeof setTimeout>;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, RESIZE_DEBOUNCE);
    }
    window.addEventListener('resize', onResize);

    return () => {
      alive = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      clearTimeout(resizeTimer);
    };
  }, [animation, mode]);

  if (animation === 'none') return null;

  const zClass = ABOVE_CONTENT.has(animation) ? 'z-[20]' : 'z-[5]';

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 ${zClass} pointer-events-none`}
      style={{ willChange: 'transform' }}
      aria-hidden
    />
  );
}
