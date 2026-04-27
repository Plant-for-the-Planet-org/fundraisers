'use client';

import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';

interface StageQRPanelProps {
  fundraiserId: string;
}

export function StageQRPanel({ fundraiserId }: StageQRPanelProps) {
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [donateUrl, setDonateUrl] = useState('');

  useEffect(() => {
    const base = window.location.origin;
    const params = new URLSearchParams({
      utm_source: 'stage',
      utm_medium: 'qr',
      utm_campaign: 'stage-mode',
    });
    const url = `${base}/raise/${fundraiserId}?${params.toString()}`;
    setDonateUrl(`stage.pp.eco/${fundraiserId}`);
    setQrSrc(`https://qr.pp.eco/?${url}`);
  }, [fundraiserId]);

  return (
    <div
      className="absolute bottom-[170px] left-12 z-[18] w-[300px] rounded-3xl border p-[18px]"
      style={{
        background: 'rgba(255,255,255,0.78)',
        borderColor: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(22px) saturate(140%)',
        boxShadow:
          '0 30px 60px -20px rgba(8,15,35,.45), 0 10px 24px -10px rgba(8,15,35,.35), inset 0 1px 0 rgba(255,255,255,.7)',
        color: '#0B1220',
      }}
    >
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-white p-2.5">
        {qrSrc ? (
          <img src={qrSrc} alt="Scan to donate" className="h-full w-full" />
        ) : (
          <div className="h-full w-full rounded-xl bg-[#0B1220]/5" />
        )}
      </div>

      <div className="mt-3 flex flex-col items-center gap-0.5 text-center">
        <div className="text-[11px] font-bold uppercase tracking-[.18em]" style={{ color: 'var(--accent-color)' }}>
          Scan to donate
        </div>
        <div className="flex items-center gap-1.5 text-[13px] font-bold tracking-tight opacity-70" style={{ color: '#0B1220' }}>
          <Globe size={13} />
          {donateUrl}
        </div>
      </div>
    </div>
  );
}
