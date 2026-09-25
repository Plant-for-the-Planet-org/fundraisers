import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

export function FundraiserLayout({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className='fundraiser-layout flex-1'>
      <div className={cn('flex flex-col md:flex-row gap-6 min-w-0', className)}>
        {children}
      </div>
    </div>
  );
}
