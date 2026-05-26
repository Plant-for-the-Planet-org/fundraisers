'use client';

import type { AnimationType, ThemeMode } from '@/lib/theme/types';

import { useEffect, useRef } from 'react';
import { getAnimationConfig, type Particle } from './animation-configs';

const MOBILE_BREAKPOINT = 768;
const RESIZE_DEBOUNCE = 200;

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

    const cfg = getAnimationConfig(animation, mode);
    if (!cfg) return;
    const config: NonNullable<typeof cfg> = cfg;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    let particles: Particle[] = [];
    let w = 0;
    let h = 0;
    let rafId = 0;
    let alive = true;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      const count =
        w < MOBILE_BREAKPOINT ? Math.floor(config.count * 0.6) : config.count;

      particles = [];
      for (let i = 0; i < count; i++) {
        const p: Particle = {
          x: 0,
          y: 0,
          speed: 0,
          size: 0,
          drift: 0,
          opacity: 0,
          rotation: 0,
          color: '',
          phase: 0,
        };
        config.init(p, w, h);
        particles.push(p);
      }
    }

    resize();

    function loop(time: number) {
      if (!alive) return;

      if (document.hidden) {
        rafId = requestAnimationFrame(loop);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        if (!reducedMotion) {
          config.update(p, w, h, time);
        }
        config.draw(ctx, p);
      }

      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);

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

  return (
    <canvas
      ref={canvasRef}
      className='fixed inset-0 z-[5] pointer-events-none'
      style={{ willChange: 'transform' }}
      aria-hidden
    />
  );
}
