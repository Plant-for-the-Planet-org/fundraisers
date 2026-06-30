'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export function StickyFormBar({ children }: { children: React.ReactNode }) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(true);

  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { rootMargin: '0px 0px -68px 0px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={anchorRef}>
      <div
        className={cn(
          'flex justify-end py-4',
          isStuck &&
            'fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/50 backdrop-blur-sm'
        )}
      >
        <div
          className={cn(
            isStuck && 'max-w-[960px] w-full mx-auto px-4 flex justify-end'
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
