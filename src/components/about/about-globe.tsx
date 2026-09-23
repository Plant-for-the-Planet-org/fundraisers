'use client';

import { useEffect, useRef } from 'react';
import createGlobe from 'cobe';
import { PROJECT_POINTS } from './about-globe-points';

const FALLBACK_ACCENT: [number, number, number] = [0.71, 0.33, 0.04];

function readAccent(el: HTMLElement): [number, number, number] {
  const hex = getComputedStyle(el).getPropertyValue('--accent-color').trim();
  const match = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!match?.[1]) return FALLBACK_ACCENT;
  const value = parseInt(match[1], 16);
  return [(value >> 16) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

// Dotted globe with one marker per project location. It spins slowly while on screen, and stays still under reduced motion.
export function AboutGlobe({ label }: { label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const size = canvas.offsetWidth;
    const dpr = Math.min(window.devicePixelRatio, 2);
    let phi = 0;
    let frame = 0;
    let visible = true;

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: size * dpr,
      height: size * dpr,
      phi,
      theta: 0.25,
      dark: 0,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [1, 1, 1],
      markerColor: readAccent(canvas),
      glowColor: [1, 0.97, 0.9],
      markers: PROJECT_POINTS.map(location => ({ location, size: 0.025 })),
      markerElevation: 0,
    });

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    observer.observe(canvas);

    const spin = () => {
      if (visible) {
        phi += 0.0025;
        globe.update({ phi });
      }
      frame = requestAnimationFrame(spin);
    };
    if (!reducedMotion) frame = requestAnimationFrame(spin);

    canvas.style.opacity = '1';

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      globe.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role='img'
      aria-label={label}
      className='aspect-square w-full opacity-0 transition-opacity duration-700'
    />
  );
}
