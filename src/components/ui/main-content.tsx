import type { ReactNode } from 'react';

export function MainContent({ children }: { children: ReactNode }) {
  return (
    <main className='main-content flex-1'>
      {/* data-main-content-surface is queried by ThemeShell's blur layer to measure its clip bounds. Don't remove or rename it without updating MainContentBackdropBlur in theme-shell.tsx. */}
      <div
        data-main-content-surface
        className='max-w-[960px] rounded-2xl w-full mx-auto my-8 px-4 py-4'
      >
        {children}
      </div>
    </main>
  );
}
