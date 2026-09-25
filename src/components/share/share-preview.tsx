'use client';

import type { ShareFormatId } from '@/lib/share/formats';
import type { ShareDrawOptions } from './use-share-files';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { SHARE_FORMATS, SHARE_VIDEO_SECONDS } from '@/lib/share/formats';
import { drawShareFrame } from '@/lib/share/render/draw-share-frame';
import { cn } from '@/lib/utils';

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

  useEffect(() => {
    const canvas = canvasRef.current;
    const g = canvas?.getContext('2d');
    if (!canvas || !g) return;
    const still =
      !animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    const start = performance.now();
    const draw = (now: number) => {
      const t = still
        ? SHARE_VIDEO_SECONDS
        : ((now - start) / 1000) % SHARE_VIDEO_SECONDS;
      drawShareFrame(g, t, { ...optionsRef.current, format });
      if (!still) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [format, animate]);

  // A still preview redraws when the options change; the animated one picks them up on its next frame.
  useEffect(() => {
    const g = canvasRef.current?.getContext('2d');
    if (g && !animate)
      drawShareFrame(g, SHARE_VIDEO_SECONDS, { ...options, format });
  }, [options, animate, format]);

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
