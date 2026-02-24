'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { HeartHandshake } from 'lucide-react';

interface FundraiserCardImageProps {
  imageUrl: string | null;
  alt: string;
}

export function FundraiserCardImage({
  imageUrl,
  alt,
}: FundraiserCardImageProps) {
  const [imgStatus, setImgStatus] = useState<'loading' | 'loaded' | 'error'>(
    imageUrl ? 'loading' : 'error'
  );
  const imgRef = useRef<HTMLImageElement>(null);

  // Detect if the image already resolved (loaded or failed) before React hydrated since onLoad/onError won't fire again for a completed image element.
  useLayoutEffect(() => {
    const img = imgRef.current;
    if (!img?.complete) return;
    queueMicrotask(() =>
      setImgStatus(img.naturalWidth > 0 ? 'loaded' : 'error')
    );
  }, []);

  return (
    <div className='relative w-full h-full'>
      {imageUrl && imgStatus !== 'error' && (
        <img
          ref={imgRef}
          src={imageUrl}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-500 ease-in-out ${imgStatus === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImgStatus('loaded')}
          onError={() => setImgStatus('error')}
        />
      )}
      <div
        className={`absolute inset-0 bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center transition-opacity duration-500 ease-in-out ${imgStatus === 'loaded' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        aria-hidden='true'
      >
        <HeartHandshake className='w-6 h-6 text-muted-foreground' />
      </div>
    </div>
  );
}
