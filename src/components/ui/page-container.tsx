import type { ReactNode } from 'react';

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className='page-container min-h-screen flex flex-col bg-sky-100/50 backdrop-blur-[10px]'>
      {children}
    </div>
  );
}
