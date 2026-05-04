'use client';

import type { DonationEntry } from './hooks/use-leaderboard';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { formatTimeAgo } from '@/lib/utils/time';

const POLL_SECONDS = 15;

function getRemaining() {
  return POLL_SECONDS - (Math.floor(Date.now() / 1000) % POLL_SECONDS);
}

function useCountdown() {
  const [remaining, setRemaining] = useState(POLL_SECONDS);

  useEffect(() => {
    setRemaining(getRemaining());
    const id = setInterval(() => setRemaining(getRemaining()), 1000);
    return () => clearInterval(id);
  }, []);

  return remaining;
}

function CountdownRing({ remaining }: { remaining: number }) {
  const size = 36;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = remaining / POLL_SECONDS;
  const dashoffset = circumference * (1 - progress);

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill='none'
        stroke='rgba(11,18,32,.10)'
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill='none'
        stroke='rgba(11,18,32,.35)'
        strokeWidth={stroke}
        strokeLinecap='round'
        strokeDasharray={circumference}
        strokeDashoffset={dashoffset}
        style={{ transition: 'stroke-dashoffset 0.9s linear' }}
      />
    </svg>
  );
}


interface StageTickerProps {
  recent: DonationEntry[];
  offline: boolean;
  locale: string;
}

export function StageTicker({ recent, offline, locale }: StageTickerProps) {
  const t = useTranslations('Stage');
  const remaining = useCountdown();
  const items = recent.length > 0 ? [...recent, ...recent] : [];

  return (
    <div
      className='absolute bottom-12 left-12 right-12 z-[19] grid h-[88px] overflow-hidden rounded-[18px] border'
      style={{
        gridTemplateColumns: 'auto 1fr auto',
        background: 'rgba(255,255,255,0.92)',
        borderColor: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(22px) saturate(140%)',
        boxShadow:
          '0 30px 60px -20px rgba(8,15,35,.45), 0 10px 24px -10px rgba(8,15,35,.35), inset 0 1px 0 rgba(255,255,255,.7)',
        color: '#0B1220',
        alignItems: 'stretch',
      }}
    >
      {/* Head */}
      <div
        className='flex items-center gap-3 px-5'
        style={{
          borderRight: '1px solid rgba(11,18,32,.08)',
          background:
            'linear-gradient(90deg, rgba(46,123,255,.10), rgba(46,123,255,0))',
        }}
      >
        <div className='flex flex-col items-start gap-2'>
          <span
            className='inline-flex items-center gap-1.5 rounded-[4px] px-2 py-1 text-[11px] font-extrabold uppercase tracking-[.14em] text-white'
            style={{
              background: offline
                ? 'rgba(11,18,32,.25)'
                : 'rgba(220,38,38,.92)',
              lineHeight: 1,
              transition: 'background 0.4s',
            }}
          >
            <span
              className={`block h-[7px] w-[7px] rounded-full bg-white ${offline ? '' : 'animate-pulse'}`}
            />
            {offline ? t('offline') : t('live')}
          </span>
          <span
            className='text-[16px] font-bold leading-none'
            style={{ color: '#0B1220' }}
          >
            {t('recentGifts')}
          </span>
        </div>
      </div>

      {/* Scrolling track */}
      <div
        className='relative overflow-hidden'
        style={{
          maskImage:
            'linear-gradient(90deg, transparent 0, #000 40px, #000 calc(100% - 40px), transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(90deg, transparent 0, #000 40px, #000 calc(100% - 40px), transparent 100%)',
        }}
      >
        {items.length > 0 ? (
          <div
            className='flex h-full items-center gap-12 whitespace-nowrap px-6'
            style={{ animation: 'stage-tickscroll 60s linear infinite' }}
          >
            {items.map((d, i) => (
              <span
                key={`${d.id}-${i}`}
                className='inline-flex items-center gap-3 text-[17px]'
                style={{ color: '#0B1220' }}
              >
                <span className='font-bold'>
                  {d.isAnonymous ? 'Anonymous' : d.donorName}
                </span>
                <span
                  className='h-1 w-1 rounded-full'
                  style={{ background: 'rgba(11,18,32,.20)' }}
                />
                <span
                  className='font-bold'
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    color: 'var(--accent-color)',
                  }}
                >
                  {formatCurrencyFromDecimal(d.amount, d.currency, locale)}
                </span>
                <span className='text-[14px] opacity-50'>
                  {formatTimeAgo(d.created)}
                </span>
              </span>
            ))}
          </div>
        ) : (
          <div className='flex h-full items-center px-6 text-[15px] opacity-40'>
            {t('waitingForDonations')}
          </div>
        )}
      </div>

      {/* Refresh indicator */}
      <div
        className='flex items-center gap-2.5 px-5'
        style={{
          borderLeft: '1px solid rgba(11,18,32,.08)',
          background:
            'linear-gradient(270deg, rgba(52,211,153,.12), rgba(52,211,153,0))',
        }}
      >
        <div className='relative flex items-center justify-center'>
          <CountdownRing remaining={remaining} />
          <span
            className='absolute text-[11px] font-bold tabular-nums'
            style={{ color: 'rgba(11,18,32,.5)' }}
          >
            {remaining}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes stage-tickscroll {
          from { transform: translateX(0) }
          to   { transform: translateX(-50%) }
        }
      `}</style>
    </div>
  );
}
