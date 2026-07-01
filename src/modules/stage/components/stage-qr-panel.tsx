'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';
import { GlassPanel } from './glass-panel';

interface StageQRPanelProps {
  fundraiserId: string;
  slug: string;
  className?: string;
}

export function StageQRPanel({
  fundraiserId,
  slug,
  className,
}: StageQRPanelProps) {
  const t = useTranslations('Stage');
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const donateUrl = `stage.pp.eco/${slug}`;

  useEffect(() => {
    const params = new URLSearchParams({
      utm_source: 'stage',
      utm_medium: 'qr',
      utm_campaign: 'stage-mode',
    });
    const target = `${window.location.origin}/raise/${encodeURIComponent(fundraiserId)}?${params.toString()}`;
    // ponytail: window.location.origin is unavailable during SSR, so this
    // value can only be computed client-side after mount — the effect is
    // intentional here, not an oversight the lint rule assumes.
    // qr.pp.eco encodes whatever follows `?` verbatim, e.g.
    // https://qr.pp.eco/?https://example.com — no named param, no encoding.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQrSrc(`https://qr.pp.eco/?${target}`);
  }, [fundraiserId, slug]);

  return (
    <GlassPanel className={`p-[18px] ${className ?? ''}`}>
      <div className='flex aspect-square items-center justify-center rounded-2xl bg-white p-2.5'>
        {qrSrc ? (
          <img src={qrSrc} alt={t('scanToDonate')} className='h-full w-full' />
        ) : (
          <div className='h-full w-full rounded-xl bg-[#0B1220]/5' />
        )}
      </div>

      <div className='mt-3 flex flex-col items-center gap-0.5 text-center'>
        <div
          className='text-[11px] font-bold uppercase tracking-[.18em]'
          style={{ color: 'var(--accent-color)' }}
        >
          {t('scanToDonate')}
        </div>
        <div
          className='text-[13px] font-bold tracking-tight opacity-70'
          style={{ color: '#0B1220' }}
        >
          <Globe size={13} className='mr-1 inline align-[-2px]' />
          <span>{donateUrl}</span>
        </div>
      </div>
    </GlassPanel>
  );
}
