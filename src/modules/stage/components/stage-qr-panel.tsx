'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';
import {
  QR_CODE_BASE_URL,
  STAGE_SHORT_URL_DOMAIN,
} from '@/lib/constants/app-config';
import { GlassPanel } from './glass-panel';

interface StageQRPanelProps {
  slug: string;
  className?: string;
}

export function StageQRPanel({ slug, className }: StageQRPanelProps) {
  const t = useTranslations('Stage');
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const donateUrl = `${STAGE_SHORT_URL_DOMAIN}/${slug}`;

  useEffect(() => {
    // Slug, not the GUID: Umami keys pageviews by URL, so targeting the same path
    // the rest of the app links to keeps scans and organic visits on one page
    // instead of splitting the fundraiser across two.
    //
    // No utm_campaign here. It would only repeat the source, and it leaves the
    // field free for a real event name later.
    const params = new URLSearchParams({
      utm_source: 'stage',
      utm_medium: 'qr',
    });
    const target = `${window.location.origin}/raise/${encodeURIComponent(slug)}?${params.toString()}`;
    // ponytail: window.location.origin is unavailable during SSR, so this
    // value can only be computed client-side after mount — the effect is
    // intentional here, not an oversight the lint rule assumes.
    // QR_CODE_BASE_URL encodes whatever follows `?` verbatim, e.g.
    // https://qr.pp.eco/?https://example.com — no named param, no encoding.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQrSrc(`${QR_CODE_BASE_URL}/?${target}`);
  }, [slug]);

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
