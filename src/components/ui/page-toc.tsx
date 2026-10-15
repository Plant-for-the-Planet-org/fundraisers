'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';

export interface TocItem {
  id: string;
  label: string;
}

// Distance below the (sticky) header at which a section counts as "current".
const ACTIVE_OFFSET = 120;

/**
 * Sticky "on this page" menu for long text pages. Desktop only (the page
 * stacks to a single readable column on smaller screens). Highlights the last
 * section whose heading has scrolled past the top of the reading area.
 */
export function PageToc({ items, label }: { items: TocItem[]; label: string }) {
  const [activeId, setActiveId] = useState(items[0]?.id);
  // On a short page a jump can land at the page bottom, where the scroll rule
  // below would mark the last item. So a clicked item stays marked until the
  // reader scrolls on their own.
  const clickedRef = useRef(false);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      if (clickedRef.current) return;

      // At (or near) the bottom the trailing sections can't scroll high enough
      // to pass the offset, so pin the last item once the page bottom is shown.
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4;
      if (atBottom) {
        const last = items[items.length - 1]?.id;
        if (last) setActiveId(last);
        return;
      }

      let current = items[0]?.id;
      for (const { id } of items) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= ACTIVE_OFFSET) current = id;
      }
      if (current) setActiveId(current);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const releaseClick = () => {
      clickedRef.current = false;
    };
    const userScrollEvents = ['wheel', 'touchstart', 'keydown'] as const;

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    for (const type of userScrollEvents) {
      window.addEventListener(type, releaseClick, { passive: true });
    }
    return () => {
      window.removeEventListener('scroll', onScroll);
      for (const type of userScrollEvents) {
        window.removeEventListener(type, releaseClick);
      }
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items]);

  return (
    <nav aria-label={label} className='sticky top-24'>
      <p className='mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
        {label}
      </p>
      <ul className='space-y-1 border-l border-border'>
        {items.map(({ id, label: itemLabel }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              onClick={() => {
                clickedRef.current = true;
                setActiveId(id);
              }}
              className={cn(
                '-ml-px block border-l-2 py-1 pl-4 text-sm transition-colors',
                activeId === id
                  ? 'border-foreground font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {itemLabel}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
