'use client';

import type { ReactNode } from 'react';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

function shouldBlurForPathname(pathname: string): boolean {
  return (
    pathname === '/fundraisers/create' ||
    pathname.startsWith('/dashboard/fundraisers/edit/')
  );
}

export function MainContent({
  children,
  blurred = false,
}: {
  children: ReactNode;
  blurred?: boolean;
}) {
  const pathname = usePathname();
  const shouldBlur = blurred || shouldBlurForPathname(pathname);

  return (
    <main className='main-content flex-1'>
      <div
        className={cn(
          'max-w-[960px] rounded-2xl w-full mx-auto my-8 px-4 py-4',
          shouldBlur && 'backdrop-blur-[10px]'
        )}
      >
        {children}
      </div>
    </main>
  );
}
