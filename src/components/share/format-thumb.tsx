'use client';

import type { ShareFormatId } from '@/lib/share/formats';
import type { ShareDrawOptions } from './use-share-files';

import { useEffect, useRef } from 'react';
import { SHARE_FORMATS, SHARE_VIDEO_SECONDS } from '@/lib/share/formats';
import { drawShareFrame } from '@/lib/share/render/draw-share-frame';

/** The default long side of a thumbnail, in CSS px. */
const THUMB_LONG_SIDE = 44;
const DENSITY = 2;

/** A tiny picture of the real design in one format, so a tile shows what it will make. */
export function FormatThumb({
  format,
  options,
  ready,
  size = THUMB_LONG_SIDE,
}: {
  format: ShareFormatId;
  options: ShareDrawOptions;
  ready: boolean;
  /** The long side, in CSS px. */
  size?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { w, h } = SHARE_FORMATS[format];
  const unit = (size * DENSITY) / Math.max(w, h);
  const cssW = Math.round((w / Math.max(w, h)) * size);
  const cssH = Math.round((h / Math.max(w, h)) * size);

  useEffect(() => {
    const g = ref.current?.getContext('2d');
    if (!g || !ready) return;
    drawShareFrame(g, SHARE_VIDEO_SECONDS, {
      ...options,
      format,
      scale: unit,
    });
  }, [format, options, ready, unit]);

  return (
    <canvas
      ref={ref}
      width={Math.round(w * unit)}
      height={Math.round(h * unit)}
      aria-hidden='true'
      className='rounded-[3px] border border-border/60 bg-muted'
      style={{ width: cssW, height: cssH }}
    />
  );
}
