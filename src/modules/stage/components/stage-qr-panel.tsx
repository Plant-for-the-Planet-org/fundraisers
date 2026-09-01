'use client';

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
  const donateUrl = `${STAGE_SHORT_URL_DOMAIN}/${encodeURIComponent(slug)}`;

  // The QR encodes the same short URL printed below it, which halves the payload
  // against the full domain and gives a denser, easier-to-scan code from a distance.
  // `stage.pp.eco/X` is a 301 to `/raise/X` that carries the query through, so the
  // campaign params survive the hop. If it ever appends them itself, drop them here.
  //
  // Slug, not the GUID: Umami keys pageviews by URL, so pointing at the path the rest
  // of the app links to keeps scans and organic visits counted as one page.
  //
  // No utm_campaign. It would only repeat the source, and it leaves the field free
  // for a real event name later.
  const params = new URLSearchParams({
    utm_source: 'stage',
    utm_medium: 'qr',
  });
  // QR_CODE_BASE_URL encodes whatever follows `?` verbatim, e.g.
  // https://qr.pp.eco/?https://example.com — no named param, no encoding.
  const qrSrc = `${QR_CODE_BASE_URL}/?https://${donateUrl}?${params.toString()}`;

  return (
    <GlassPanel className={`p-[18px] ${className ?? ''}`}>
      <div className='flex aspect-square items-center justify-center rounded-2xl bg-white p-2.5'>
        <img src={qrSrc} alt={t('scanToDonate')} className='h-full w-full' />
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
