import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: 'noindex, nofollow',
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
