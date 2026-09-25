'use client';

import type { ShareFormatId } from '@/lib/share/formats';
import type { ShareDrawOptions } from './use-share-files';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { SHARE_FORMATS, SHARE_VIDEO_SECONDS } from '@/lib/share/formats';
import { drawShareFrame } from '@/lib/share/render/draw-share-frame';
import { cn } from '@/lib/utils';

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

/**
 * The share image or video, live, in a phone-like frame.
 * A video plays on a loop; an image, or a visitor who prefers reduced motion, gets the final frame.
 */
export function SharePreview({
  format,
  animate,
  options,
  label,
}: {
  format: ShareFormatId;
  animate: boolean;
  options: ShareDrawOptions;
  label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const optionsRef = useRef(options);
  // The latest options, for the animation loop and the file job, without restarting them.
  useLayoutEffect(() => {
    optionsRef.current = options;
  });
  const { w, h } = SHARE_FORMATS[format];
  const reducedMotion = useReducedMotion();
  const still = !animate || reducedMotion;

  useEffect(() => {
    const canvas = canvasRef.current;
    const g = canvas?.getContext('2d');
    if (!canvas || !g || still) return;
    let frame = 0;
    const start = performance.now();
    const draw = (now: number) => {
      const t = ((now - start) / 1000) % SHARE_VIDEO_SECONDS;
      drawShareFrame(g, t, { ...optionsRef.current, format });
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [format, still]);

  // A still preview (an image, or reduced motion) redraws its last frame when the options change; the animated one picks them up on its next frame.
  useEffect(() => {
    const g = canvasRef.current?.getContext('2d');
    if (g && still)
      drawShareFrame(g, SHARE_VIDEO_SECONDS, { ...options, format });
  }, [options, still, format]);

  const wide = w > h;
  return (
    <div
      className={cn(
        'w-full bg-neutral-900 shadow-lg',
        wide
          ? 'max-w-sm rounded-xl p-1.5'
          : 'max-w-[17rem] rounded-[1.75rem] p-2.5'
      )}
    >
      <canvas
        ref={canvasRef}
        width={w}
        height={h}
        role='img'
        aria-label={label}
        className={cn(
          'block h-auto w-full',
          wide ? 'rounded-lg' : 'rounded-[1.25rem]'
        )}
      />
    </div>
  );
}
