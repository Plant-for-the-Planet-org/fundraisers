import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// Stage screens are live event displays, not pages to find in search. noindex rather than a robots.txt block, so crawlers can still read this tag.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function StageLayout({ children }: { children: ReactNode }) {
  return <div className='min-h-dvh w-screen bg-[#05080f]'>{children}</div>;
}
