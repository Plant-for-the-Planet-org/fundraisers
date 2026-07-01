'use client';

import type { ReactNode } from 'react';
import type { Theme } from '@/lib/theme/types';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getAccentColor } from '@/lib/theme/accent-utils';
import { shouldBlurForPathname } from '@/lib/theme/backdrop-blur-routes';
import { getFontStack } from '@/lib/theme/font-utils';
import { getThemeForPath } from '@/lib/theme/route-themes';
import { useThemeStore } from '@/stores/theme-store';
import { ThemeBackdrop } from './theme-backdrop';

// SSR / first-paint approximation for the blur layer, before useLayoutEffect measures the real element.
// Matches MainContent: 6.5rem top clears header + my-8, max() centers the 60rem column, bottom:0 extends to viewport.
// Keep in sync with header height and MainContent's max-width.
// Note: uses top/left/right/bottom positioning instead of clip-path — clip-path with backdrop-filter causes a
// visible compositing layer border in Chromium (Chrome/Edge) but not in Firefox or Safari.
const INITIAL_BLUR_STYLE = {
  top: '6.5rem',
  bottom: '0',
  left: 'max(0px, calc((100vw - 60rem) / 2))',
  right: 'max(0px, calc((100vw - 60rem) / 2))',
} as React.CSSProperties;

export function ThemeShell({
  children,
  initialTheme,
  blurMainContentBackdrop = false,
}: {
  children: ReactNode;
  initialTheme?: Theme;
  blurMainContentBackdrop?: boolean;
}) {
  const pathname = usePathname();
  const { selectedTheme, setSelectedTheme } = useThemeStore();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setSelectedTheme(null);
    }
  }, [pathname, setSelectedTheme]);

  // Clear on unmount so selectedTheme doesn't bleed into a new ThemeShell instance when navigating between route groups (each group has its own ThemeShell).
  useEffect(() => {
    return () => {
      setSelectedTheme(null);
    };
  }, [setSelectedTheme]);

  const activeTheme =
    selectedTheme ?? initialTheme ?? getThemeForPath(pathname);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('light', 'dark');
    html.classList.add(activeTheme.mode);
  }, [activeTheme.mode]);

  const shouldBlurMainContentBackdrop =
    blurMainContentBackdrop || shouldBlurForPathname(pathname);

  return (
    <div
      className={`theme-${activeTheme.id} ${activeTheme.mode} relative min-h-screen flex flex-col`}
      data-theme={activeTheme.id}
      style={
        {
          fontFamily: getFontStack(activeTheme.bodyFont),
          '--theme-title-font': getFontStack(activeTheme.titleFont),
          '--accent-color': getAccentColor(activeTheme.accent),
        } as React.CSSProperties
      }
    >
      <ThemeBackdrop theme={activeTheme} />
      {shouldBlurMainContentBackdrop && <MainContentBackdropBlur />}
      <div className='relative z-10 flex flex-col min-h-screen'>{children}</div>
    </div>
  );
}

function MainContentBackdropBlur() {
  const layerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const target = document.querySelector<HTMLElement>(
      '[data-main-content-surface]'
    );
    const layer = layerRef.current;
    if (!target || !layer) return;

    const targetElement: HTMLElement = target;
    const blurLayer: HTMLDivElement = layer;
    let frameId = 0;

    function updateClipPath() {
      frameId = 0;

      const rect = targetElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const isVisible =
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < viewportHeight &&
        rect.left < viewportWidth;

      if (!isVisible) {
        blurLayer.style.width = '0';
        blurLayer.style.height = '0';
        return;
      }

      const top = Math.max(0, Math.min(viewportHeight, rect.top));
      const left = Math.max(0, Math.min(viewportWidth, rect.left));
      const width = Math.min(viewportWidth, rect.right) - left;
      const height = Math.min(viewportHeight, rect.bottom) - top;

      blurLayer.style.top = `${top}px`;
      blurLayer.style.left = `${left}px`;
      blurLayer.style.width = `${width}px`;
      blurLayer.style.height = `${height}px`;
      blurLayer.style.right = 'auto';
      blurLayer.style.bottom = 'auto';
    }

    function scheduleUpdate() {
      if (frameId === 0) {
        frameId = requestAnimationFrame(updateClipPath);
      }
    }

    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(targetElement);
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    updateClipPath();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate);
    };
  }, []);

  return (
    <div
      ref={layerRef}
      className='fixed z-[6] pointer-events-none backdrop-blur-[10px] rounded-2xl'
      style={INITIAL_BLUR_STYLE}
      aria-hidden
    />
  );
}
