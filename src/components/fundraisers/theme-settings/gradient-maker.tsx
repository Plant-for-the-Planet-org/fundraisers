'use client';

import type { CustomGradient, GradientStop } from '@/lib/theme/types';

import { useEffect, useRef, useState } from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import { useTranslations } from 'next-intl';
import { Plus, X } from 'lucide-react';
import { hexToRgb, normalizeHex } from '@/lib/theme/color-utils';
import { cn } from '@/lib/utils/cn';

const MAX_STOPS = 6;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

// Left-to-right preview of the stops, independent of the gradient angle, so a
// stop's handle sits at its position along the bar.
function barCss(stops: GradientStop[]): string {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  return `linear-gradient(to right, ${sorted
    .map(s => `${s.color} ${s.position}%`)
    .join(', ')})`;
}

function toHex(n: number): string {
  return clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
}

// Colour of the gradient at a given position — linear RGB blend of the two
// surrounding stops, so a stop added on the bar matches what's already there.
function colorAt(stops: GradientStop[], position: number): string {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const before = [...sorted].reverse().find(s => s.position <= position);
  const after = sorted.find(s => s.position >= position);
  if (!before) return after?.color ?? '#ffffff';
  if (!after) return before.color;
  if (before === after) return before.color;
  const span = after.position - before.position || 1;
  const t = (position - before.position) / span;
  const a = hexToRgb(before.color);
  const b = hexToRgb(after.color);
  return `#${toHex(a.r + (b.r - a.r) * t)}${toHex(a.g + (b.g - a.g) * t)}${toHex(
    a.b + (b.b - a.b) * t
  )}`;
}

// CSS gradient angle: 0deg points up, increasing clockwise.
function angleFromPointer(
  cx: number,
  cy: number,
  x: number,
  y: number
): number {
  const deg = (Math.atan2(x - cx, cy - y) * 180) / Math.PI;
  return Math.round((deg + 360) % 360);
}

export function GradientMaker({
  gradient,
  onChange,
}: {
  gradient: CustomGradient;
  onChange: (next: CustomGradient) => void;
}) {
  const tTheme = useTranslations('Fundraisers.form.theme');
  const [active, setActive] = useState(0);
  const [dragStop, setDragStop] = useState<number | null>(null);
  const [dragAngle, setDragAngle] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<HTMLButtonElement>(null);

  const stops = gradient.stops;
  const activeStop = stops[active] ?? stops[0];

  const patchStop = (index: number, patch: Partial<GradientStop>) =>
    onChange({
      ...gradient,
      stops: stops.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    });

  const addStop = (position: number) => {
    if (stops.length >= MAX_STOPS) return;
    const next = [...stops, { color: colorAt(stops, position), position }];
    onChange({ ...gradient, stops: next });
    setActive(next.length - 1);
  };

  // "+ Add stop" drops a stop at a random point inside the widest gap between
  // existing stops (so repeated clicks spread out instead of stacking), taking
  // the interpolated colour there.
  const addStopInGap = () => {
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    let start = 0;
    let end = 100;
    let widest = -1;
    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = sorted[i + 1].position - sorted[i].position;
      if (gap > widest) {
        widest = gap;
        start = sorted[i].position;
        end = sorted[i + 1].position;
      }
    }
    // Random point kept off the exact edges so it never lands on a neighbour.
    const position = Math.round(
      start + (end - start) * (0.25 + Math.random() * 0.5)
    );
    addStop(position);
  };

  const removeStop = (index: number) => {
    if (stops.length <= 2) return;
    onChange({ ...gradient, stops: stops.filter((_, i) => i !== index) });
    setActive(a => (a >= index && a > 0 ? a - 1 : a));
  };

  const posFromClientX = (clientX: number): number => {
    const r = barRef.current?.getBoundingClientRect();
    if (!r) return 0;
    return clamp(Math.round(((clientX - r.left) / r.width) * 100), 0, 100);
  };

  // Global listeners while dragging a stop handle or the angle wheel, so the
  // drag keeps tracking even if the pointer leaves the small target.
  useEffect(() => {
    if (dragStop === null && !dragAngle) return;
    const move = (e: PointerEvent) => {
      if (dragStop !== null) {
        patchStop(dragStop, { position: posFromClientX(e.clientX) });
      } else if (dragAngle && wheelRef.current) {
        const r = wheelRef.current.getBoundingClientRect();
        onChange({
          ...gradient,
          angle: angleFromPointer(
            r.left + r.width / 2,
            r.top + r.height / 2,
            e.clientX,
            e.clientY
          ),
        });
      }
    };
    const up = () => {
      setDragStop(null);
      setDragAngle(false);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [dragStop, dragAngle, gradient]); // eslint-disable-line react-hooks/exhaustive-deps

  const angleRad = ((gradient.angle - 90) * Math.PI) / 180;

  return (
    <div className='flex w-72 flex-col gap-5 sm:w-[420px] sm:flex-row sm:gap-6'>
      {/* LEFT: gradient bar + colour picker */}
      <div className='flex flex-col gap-3 sm:min-w-0 sm:flex-1'>
        {/* Gradient bar with draggable stops; click empty space to add one */}
        <div className='pt-1'>
          <div
            ref={barRef}
            className='relative h-6 cursor-copy touch-none rounded-md ring-1 ring-border'
            onPointerDown={e => {
              if (e.target === e.currentTarget)
                addStop(posFromClientX(e.clientX));
            }}
          >
            <div
              className='pointer-events-none absolute inset-0 rounded-md'
              style={{ backgroundImage: barCss(stops) }}
            />
            {stops.map((stop, i) => (
              <button
                key={i}
                type='button'
                aria-label={`${tTheme('gradientStop')} ${i + 1}`}
                onPointerDown={e => {
                  e.stopPropagation();
                  setActive(i);
                  setDragStop(i);
                }}
                className={cn(
                  'absolute top-1/2 z-10 h-8 w-3.5 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full border-2 shadow-sm',
                  active === i ? 'border-foreground' : 'border-white'
                )}
                style={{
                  left: `${stop.position}%`,
                  backgroundColor: stop.color,
                }}
              />
            ))}
          </div>
        </div>

        {/* Picker for the active stop */}
        <HexColorPicker
          color={activeStop.color}
          onChange={hex => {
            const c = normalizeHex(hex);
            if (c) patchStop(active, { color: c });
          }}
        />
      </div>

      {/* RIGHT: angle + stops */}
      <div className='flex flex-col gap-4 sm:min-w-0 sm:flex-1'>
        {/* Angle wheel + numeric input */}
        <div className='flex items-center gap-3'>
          <button
            ref={wheelRef}
            type='button'
            aria-label={tTheme('gradientAngle')}
            onPointerDown={() => setDragAngle(true)}
            className='relative size-8 shrink-0 cursor-grab rounded-full border-2 border-border touch-none'
          >
            <span
              className='absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground'
              style={{
                transform: `translate(calc(-50% + ${Math.cos(angleRad) * 10}px), calc(-50% + ${Math.sin(angleRad) * 10}px))`,
              }}
            />
          </button>
          <label className='flex items-center gap-1.5 text-xs text-muted-foreground'>
            {tTheme('gradientAngle')}
            <input
              type='number'
              min={0}
              max={360}
              value={gradient.angle}
              onChange={e =>
                onChange({
                  ...gradient,
                  angle: clamp(Math.round(Number(e.target.value) || 0), 0, 360),
                })
              }
              className='h-8 w-16 rounded-md border border-border bg-background px-2 text-right text-xs text-foreground'
            />
            °
          </label>
        </div>

        {/* Stops list */}
        <div className='flex flex-col gap-1'>
          <div className='flex items-center justify-between'>
            <span className='text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
              {tTheme('gradientStops')}
            </span>
            <button
              type='button'
              onClick={addStopInGap}
              disabled={stops.length >= MAX_STOPS}
              className='inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[11px] font-semibold hover:border-foreground/40 disabled:opacity-40'
            >
              <Plus className='h-3 w-3' />
              {tTheme('gradientAddStop')}
            </button>
          </div>
          {stops.map((stop, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-1.5 rounded-md p-1',
                active === i && 'bg-muted/50'
              )}
            >
              <button
                type='button'
                onClick={() => setActive(i)}
                aria-label={`${tTheme('gradientStop')} ${i + 1}`}
                className={cn(
                  'h-7 w-7 shrink-0 rounded-sm border',
                  active === i ? 'border-foreground' : 'border-border'
                )}
                style={{ backgroundColor: stop.color }}
              />
              <HexColorInput
                color={stop.color}
                onChange={hex => {
                  const c = normalizeHex(hex);
                  if (c) patchStop(i, { color: c });
                }}
                prefixed
                className='h-7 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-xs uppercase'
              />
              <input
                type='number'
                min={0}
                max={100}
                value={stop.position}
                onChange={e =>
                  patchStop(i, {
                    position: clamp(
                      Math.round(Number(e.target.value) || 0),
                      0,
                      100
                    ),
                  })
                }
                className='h-7 w-11 rounded-md border border-border bg-background px-1.5 text-right text-xs'
              />
              <span className='text-xs text-muted-foreground'>%</span>
              <button
                type='button'
                onClick={() => removeStop(i)}
                disabled={stops.length <= 2}
                aria-label={tTheme('gradientRemoveStop')}
                className='shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground disabled:opacity-30'
              >
                <X className='h-3.5 w-3.5' />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
