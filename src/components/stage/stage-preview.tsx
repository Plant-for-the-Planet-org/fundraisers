'use client';

import type React from 'react';
import type { StageSlide } from '@/lib/types/fundraiser';

import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Globe, QrCode } from 'lucide-react';
import { GlassPanel } from './glass-panel';
import { StageSlidePanel } from './stage-slide-panel';
import { StageTopBar } from './stage-top-bar';

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

interface StagePreviewProps {
  slide: StageSlide;
  stageTitle: string;
  stageDescription?: string;
  logoUrl?: string;
  accentColor: string;
  titleFont: string;
  bodyFont: string;
}

/**
 * Static, single-slide preview of the live stage layout. Mirrors `StageView`'s
 * scaled 1920x1080 canvas, but scales to its own container width (not the
 * window) and stands in muted placeholder cards for the live-data panels
 * (Raised / QR / Ticker). Presentational only — no data hooks.
 */
export function StagePreview({
  slide,
  stageTitle,
  stageDescription,
  logoUrl,
  accentColor,
  titleFont,
  bodyFont,
}: StagePreviewProps) {
  const t = useTranslations('Fundraisers.form.options.stage');
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / CANVAS_WIDTH);
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      className='relative aspect-video w-full overflow-hidden rounded-2xl bg-[#0b1220]'
    >
      <div
        style={
          {
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            fontFamily: bodyFont,
            '--theme-title-font': titleFont,
            '--accent-color': accentColor,
          } as React.CSSProperties
        }
        className='absolute top-0 left-0 isolate overflow-hidden'
      >
        {/* Background slide (single → no pager) */}
        <StageSlidePanel slides={[slide]} />

        {/* Vignette overlay */}
        <div
          className='pointer-events-none absolute inset-0 z-10'
          style={{
            background:
              'radial-gradient(120% 100% at 50% 50%, transparent 60%, rgba(4,10,25,.55) 100%)',
          }}
        />

        {/* Branding + stage title/description */}
        <StageTopBar
          title={stageTitle}
          description={stageDescription}
          logoUrl={logoUrl}
        />

        {/* Placeholder: Raised counter — top right */}
        <GlassPanel className='absolute top-12 right-12 z-[18] w-[440px] p-6'>
          <div className='text-[11px] font-bold tracking-[.18em] uppercase opacity-60'>
            {t('previewRaisedLabel')}
          </div>
          <div className='mt-2 h-12 w-3/5 rounded-lg bg-black/10' />
          <div className='mt-4 h-2 w-full overflow-hidden rounded-full bg-black/10'>
            <div
              className='h-full w-2/5 rounded-full'
              style={{ background: 'var(--accent-color)', opacity: 0.5 }}
            />
          </div>
          <div className='mt-5 flex gap-5 border-t border-black/10 pt-3.5'>
            <div className='h-6 w-20 rounded bg-black/10' />
            <div className='h-6 w-20 rounded bg-black/10' />
          </div>
        </GlassPanel>

        {/* Placeholder: QR panel — bottom left */}
        <GlassPanel className='absolute bottom-[170px] left-12 z-[18] w-[300px] p-[18px]'>
          <div className='flex aspect-square items-center justify-center rounded-2xl bg-white'>
            <QrCode size={120} className='text-black/15' />
          </div>
          <div className='mt-3 flex flex-col items-center gap-1 text-center'>
            <div
              className='text-[11px] font-bold tracking-[.18em] uppercase'
              style={{ color: 'var(--accent-color)' }}
            >
              {t('previewQrLabel')}
            </div>
            <div className='flex items-center gap-1 text-[13px] font-bold opacity-40'>
              <Globe size={13} />
              <div className='h-3 w-28 rounded bg-black/10' />
            </div>
          </div>
        </GlassPanel>

        {/* Placeholder: donation ticker — bottom bar */}
        <div
          className='absolute right-12 bottom-12 left-12 z-[19] grid h-[88px] items-center overflow-hidden rounded-[18px] border px-5'
          style={{
            gridTemplateColumns: 'auto 1fr',
            background: 'rgba(255,255,255,0.92)',
            borderColor: 'rgba(255,255,255,0.55)',
            color: '#0B1220',
          }}
        >
          <div className='flex items-center gap-3 border-r border-black/10 pr-5'>
            <span className='h-6 w-14 rounded bg-black/15' />
            <span className='text-[16px] font-bold opacity-50'>
              {t('previewTickerLabel')}
            </span>
          </div>
          <div className='flex items-center gap-12 px-6'>
            <span className='h-4 w-40 rounded bg-black/10' />
            <span className='h-4 w-32 rounded bg-black/10' />
            <span className='h-4 w-36 rounded bg-black/10' />
          </div>
        </div>
      </div>
    </div>
  );
}
