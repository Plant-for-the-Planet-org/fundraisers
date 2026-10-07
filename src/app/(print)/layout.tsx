import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: 'noindex, nofollow',
};

// Print pages have no site header, footer or dashboard menu: only the sheet that gets printed.
export default function PrintLayout({ children }: { children: ReactNode }) {
  return children;
}
