'use client';

import type { DonationEntry } from './hooks/use-leaderboard';

import { useTranslations } from 'next-intl';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';

interface StageLeaderboardProps {
  top: DonationEntry[];
  locale: string;
}

const RANK_STYLE: Record<number, string> = {
  1: 'bg-gradient-to-br from-[#FFD97A] to-[#E0A93A] text-[#3A2A07] shadow-[0_6px_14px_-6px_rgba(224,169,58,.6)]',
  2: 'bg-gradient-to-br from-[#E2E8F0] to-[#94A3B8] text-[#1F2937]',
  3: 'bg-gradient-to-br from-[#F6C89C] to-[#B76E41] text-[#3C1F0A]',
};

export function StageLeaderboard({ top, locale }: StageLeaderboardProps) {
  const t = useTranslations('Stage');

  if (top.length === 0) return null;

  return (
    <div
      className='absolute right-12 top-[380px] z-[17] w-[440px] rounded-3xl border px-[22px] pb-3.5 pt-5'
      style={{
        background: 'rgba(255,255,255,0.78)',
        borderColor: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(22px) saturate(140%)',
        boxShadow:
          '0 30px 60px -20px rgba(8,15,35,.45), 0 10px 24px -10px rgba(8,15,35,.35), inset 0 1px 0 rgba(255,255,255,.7)',
        color: '#0B1220',
      }}
    >
      {/* Header */}
      <div className='mb-2 flex items-baseline justify-between'>
        <span className='text-[18px] font-bold'>{t('topDonors')}</span>
        <span className='text-[11px] font-bold uppercase tracking-[.14em] opacity-60'>
          {t('contribution')}
        </span>
      </div>

      {/* Rows */}
      <div className='flex flex-col'>
        {top.map((entry, i) => {
          const rank = i + 1;
          const name = entry.isAnonymous ? t('anonymous') : entry.donorName;
          return (
            <div
              key={entry.id}
              className='grid items-center gap-3 border-b py-2.5 last:border-0'
              style={{
                gridTemplateColumns: '30px 1fr auto',
                borderColor: 'rgba(11,18,32,.08)',
              }}
            >
              <div
                className={`grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full text-[13px] font-bold ${
                  RANK_STYLE[rank] ?? 'bg-[rgba(11,18,32,.06)] text-[#0B1220]'
                }`}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {rank}
              </div>

              <div
                className='truncate text-[16px] font-semibold'
                style={{ color: '#0B1220' }}
              >
                {name}
              </div>

              <div
                className='text-[17px] font-bold'
                style={{
                  color: 'var(--accent-color)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatCurrencyFromDecimal(
                  entry.amount,
                  entry.currency,
                  locale
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
