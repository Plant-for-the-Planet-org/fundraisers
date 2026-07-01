'use client';

import type { StageSlide } from '../settings';

import { useEffect, useMemo, useState } from 'react';

interface StageSlidePanelProps {
  slides: StageSlide[];
}

export function StageSlidePanel({ slides }: StageSlidePanelProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const sorted = useMemo(
    () => slides.slice().sort((a, b) => a.position - b.position),
    [slides]
  );

  useEffect(() => {
    if (sorted.length <= 1) return;
    const duration = (sorted[activeIndex]?.duration ?? 8) * 1000;
    const timer = setTimeout(() => {
      setActiveIndex(i => (i + 1) % sorted.length);
    }, duration);
    return () => clearTimeout(timer);
  }, [activeIndex, sorted]);

  if (sorted.length === 0) {
    return <div className='absolute inset-0 z-0 bg-[#0b1220]' />;
  }

  const active = sorted[activeIndex];

  return (
    <>
      <style>{`
        @keyframes kenburns {
          from { transform: scale(1.02) translate(0, 0); }
          to   { transform: scale(1.12) translate(-1.2%, -0.8%); }
        }
      `}</style>

      {/* Background images */}
      <div className='absolute inset-0 z-0'>
        {sorted.map((slide, i) => (
          <div
            key={slide.position}
            className='absolute inset-0 transition-opacity duration-[1200ms] ease-in-out'
            style={{ opacity: i === activeIndex ? 1 : 0 }}
          >
            {slide.image && (
              <div
                key={`${slide.position}-${i === activeIndex}`}
                className='absolute inset-0 bg-cover bg-center'
                style={{
                  backgroundImage: `url(${slide.image})`,
                  animation:
                    i === activeIndex
                      ? `kenburns ${slide.duration ?? 8}s ease-out forwards`
                      : 'none',
                }}
              />
            )}

            {/* Base dim */}
            <div
              className='absolute inset-0 pointer-events-none'
              style={{ background: 'rgba(4,10,25,.35)' }}
            />

            {/* Top + bottom darkening for legibility */}
            <div
              className='absolute inset-0 pointer-events-none'
              style={{
                background: [
                  'linear-gradient(180deg, rgba(4,10,25,.55) 0%, rgba(4,10,25,0) 28%, rgba(4,10,25,0) 55%, rgba(4,10,25,.72) 100%)',
                  'radial-gradient(120% 80% at 75% 30%, rgba(4,10,25,0) 40%, rgba(4,10,25,.35) 100%)',
                ].join(', '),
              }}
            />
          </div>
        ))}
      </div>

      {/* Slide content — bottom left, above ticker */}
      <div
        className='absolute z-[18] transition-all duration-[600ms] ease-in-out'
        style={{ left: 380, bottom: 200, maxWidth: 720 }}
      >
        {active?.title && (
          <h1
            className='font-bold text-white'
            style={{
              fontSize: 58,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              margin: '0 0 24px',
              textShadow: '0 6px 30px rgba(0,0,0,.45), 0 1px 0 rgba(0,0,0,.2)',
            }}
          >
            {active.title}
          </h1>
        )}

        {active?.description && (
          <p
            className='text-white/90'
            style={{
              fontSize: 20,
              lineHeight: 1.45,
              margin: 0,
              textShadow: '0 2px 16px rgba(0,0,0,.5)',
            }}
          >
            {active.description}
          </p>
        )}
      </div>

      {/* Pager */}
      {sorted.length > 1 && (
        <div
          className='absolute z-[17] flex gap-2.5 rounded-full border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm'
          style={{ left: '50%', transform: 'translateX(-50%)', bottom: 150 }}
        >
          {sorted.map((_, i) => (
            <span
              key={i}
              className='block h-1 rounded-full transition-all duration-300'
              style={{
                width: i === activeIndex ? 48 : 36,
                background:
                  i === activeIndex ? '#fff' : 'rgba(255,255,255,.35)',
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
