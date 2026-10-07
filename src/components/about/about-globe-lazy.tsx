'use client';

import dynamic from 'next/dynamic';

// Loads cobe only on the client and only for this page, after the rest has rendered. The placeholder keeps the space so nothing jumps.
export const AboutGlobeLazy = dynamic(
  () => import('./about-globe').then(m => m.AboutGlobe),
  {
    ssr: false,
    loading: () => <div className='aspect-square w-full' />,
  }
);
