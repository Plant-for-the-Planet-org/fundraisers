import type { ReactNode } from 'react';

export default function StageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh w-screen bg-[#05080f]">
      {children}
    </div>
  );
}
