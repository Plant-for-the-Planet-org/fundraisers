'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';
import { GlassPanel } from './glass-panel';

interface StageQRPanelProps {
  fundraiserId: string;
}

export function StageQRPanel({ fundraiserId }: StageQRPanelProps) {
  const t = useTranslations('Stage');
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [donateUrl, setDonateUrl] = useState('');

  useEffect(() => {
    const params = new URLSearchParams({
      utm_source: 'stage',
      utm_medium: 'qr',
      utm_campaign: 'stage-mode',
    });
    const target = `${window.location.origin}/raise/${fundraiserId}?${params.toString()}`;
    setDonateUrl(`${window.location.host}/raise/${fundraiserId}`);
    setQrSrc(`https://qr.pp.eco/?data=${encodeURIComponent(target)}`);
  }, [fundraiserId]);

  return (
    <GlassPanel className='absolute bottom-[170px] left-12 z-[18] w-[300px] p-[18px]'>
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
          className='flex items-center gap-1.5 text-[13px] font-bold tracking-tight opacity-70'
          style={{ color: '#0B1220' }}
        >
          <Globe size={13} />
          {donateUrl}
        </div>
      </div>
    </GlassPanel>
  );
}
