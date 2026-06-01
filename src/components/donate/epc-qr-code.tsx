'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface EpcQrCodeProps {
  payload: string;
  alt: string;
  fallback: string;
}

export function EpcQrCode({ payload, alt, fallback }: EpcQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 240,
      color: { dark: '#111827', light: '#ffffff' },
    })
      .then(url => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  if (!dataUrl) {
    return (
      <div className='flex aspect-square w-full max-w-[160px] items-center justify-center rounded-md border border-border bg-muted/50 px-3'>
        <p className='text-center text-xs text-muted-foreground'>{fallback}</p>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt={alt}
      className='aspect-square w-full max-w-[160px] rounded-md'
    />
  );
}
