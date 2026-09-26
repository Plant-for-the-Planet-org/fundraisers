'use client';

import { useEffect, useRef } from 'react';
import createGlobe from 'cobe';
import { PROJECT_POINTS } from './about-globe-points';

// Same pin colours as the planet-webapp project map: golden yellow, leaf green, medium grey.
const TIER_COLORS: [number, number, number][] = [
  [243 / 255, 187 / 255, 68 / 255],
  [39 / 255, 174 / 255, 96 / 255],
  [189 / 255, 189 / 255, 189 / 255],
];

// Starts facing Africa, where most projects are. cobe shows longitude 270° - phi at the front.
const START_PHI = (3 * Math.PI) / 2 - (20 * Math.PI) / 180;
const THETA = 0.3;
const SPIN_SPEED = 0.002;
// How much faster it turns while the Pacific faces the viewer, where there are few projects.
const PACIFIC_BOOST = 3;

// The boost peaks at 180° and fades out by ±90°.
function spinSpeed(phi: number) {
  const frontLng = (3 * Math.PI) / 2 - phi;
  const towardsPacific = Math.max(0, -Math.cos(frontLng));
  return SPIN_SPEED * (1 + PACIFIC_BOOST * towardsPacific ** 2);
}

const PULSE_SPEED = 0.0025;
const PULSE_AMOUNT = 0.35;

const BASE_MARKERS = PROJECT_POINTS.map(([lat, lng, count, tier]) => ({
  location: [lat, lng] as [number, number],
  size: 0.018 + Math.min(count, 5) * 0.005,
  color: TIER_COLORS[tier],
}));

// Each dot pulses on its own offset, so they breathe out of step.
function pulsingMarkers(time: number) {
  return BASE_MARKERS.map((marker, index) => ({
    ...marker,
    size:
      marker.size *
      (1 + PULSE_AMOUNT * Math.sin(time * PULSE_SPEED + index * 2.399)),
  }));
}

// Dotted globe with a pulsing marker per project area, larger where more projects are. It spins slowly while on screen, can be dragged, and stays still under reduced motion.
export function AboutGlobe({ label }: { label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragStart = useRef<number | null>(null);
  const dragOffset = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const size = canvas.offsetWidth;
    const dpr = Math.min(window.devicePixelRatio, 2);
    let phi = START_PHI;
    let frame = 0;
    let visible = true;

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: size * dpr,
      height: size * dpr,
      phi,
      theta: THETA,
      // cobe uses one colour for both: the ocean shows it, and the land dots are a darker shade of it. The pale blush is the page background here (white under the theme's pink-100 wash), so the globe sits in the page and the land stays a soft tint.
      dark: 0,
      diffuse: 0.8,
      mapSamples: 16000,
      mapBrightness: 0.4,
      baseColor: [1, 0.955, 0.97],
      markerColor: TIER_COLORS[1]!,
      glowColor: [1, 0.96, 0.98],
      markerElevation: 0,
      markers: BASE_MARKERS,
    });

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    observer.observe(canvas);

    let drawnPhi = NaN;

    const render = (time: number) => {
      if (visible) {
        if (!reducedMotion && dragStart.current === null) {
          phi += spinSpeed(phi + dragOffset.current);
        }
        const viewPhi = phi + dragOffset.current;
        // Each update redraws the globe, so under reduced motion only redraw when a drag moves it.
        if (!reducedMotion || viewPhi !== drawnPhi) {
          globe.update({
            phi: viewPhi,
            ...(reducedMotion ? {} : { markers: pulsingMarkers(time) }),
          });
          drawnPhi = viewPhi;
        }
      }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
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
      className='aspect-square w-full cursor-grab touch-pan-y opacity-0 transition-opacity duration-1000 active:cursor-grabbing'
      onPointerDown={event => {
        dragStart.current = event.clientX - dragOffset.current * 200;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        if (dragStart.current === null) return;
        dragOffset.current = (event.clientX - dragStart.current) / 200;
      }}
      onPointerUp={() => {
        dragStart.current = null;
      }}
      onPointerCancel={() => {
        dragStart.current = null;
      }}
    />
  );
}
