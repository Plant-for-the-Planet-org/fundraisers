import type { ReactNode } from 'react';

export function FundraiserLayout({ children }: { children: ReactNode }) {
  return (
    <div className='fundraiser-layout flex-1'>
      <div className='flex flex-col md:flex-row gap-6 min-w-0'>{children}</div>
    </div>
  );
}
