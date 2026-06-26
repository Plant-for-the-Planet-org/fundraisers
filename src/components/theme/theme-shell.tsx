'use client';

import type { ReactNode } from 'react';
import type { BgSettings, Theme } from '@/lib/theme/types';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { getAccentColor } from '@/lib/theme/accent-utils';
import { shouldBlurForPathname } from '@/lib/theme/backdrop-blur-routes';
import {
  DEFAULT_PATTERN_TILE,
  LOGO_LIBRARY,
  resolveBgAsset,
} from '@/lib/theme/backgrounds';
import { getFontStack } from '@/lib/theme/font-utils';
import { getThemeForPath } from '@/lib/theme/route-themes';
import { useThemeStore } from '@/stores/theme-store';

const AnimationOverlay = dynamic(() => import('./animation-overlay'), {
  ssr: false,
});

// SSR / first-paint fallback clip for the blur layer, before useLayoutEffect measures the real element.
// Approximates the main-content surface: 6.5rem top clears the header plus the surface's my-8 margin, the left/right max() centers a 60rem column to match MainContent's max-w-[960px], 0 bottom extends to the viewport, round 1rem matches rounded-2xl.
// Keep in sync with the header height and MainContent's max-width.
const INITIAL_MAIN_CONTENT_CLIP_PATH =
  'inset(6.5rem max(0px, calc((100vw - 60rem) / 2)) 0 round 1rem)';

/**
 * Guard against CSS injection via url("...") interpolation.
 * A URL containing `"` or `)` could break out of the CSS literal.
 * Library assets are data URIs (safe); this primarily protects external https URLs.
 */
function safeCssUrl(src: string): string | null {
  if (src.includes('"') || src.includes(')') || /[\r\n]/.test(src)) return null;
  return src;
}

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

  const bg = activeTheme.bg;
  // Empty string = no gradient.
  const gradientClass = bg.gradient;
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
      {/* Layer stack, back → front: image · gradient · pattern · logo · content */}
      {bg.decoration === 'image' && bg.image_url && (
        <ImageLayer
          imageUrl={bg.image_url}
          mode={bg.image_mode}
          opacity={bg.opacity}
        />
      )}
      {gradientClass && (
        <div
          className={`fixed inset-0 ${gradientClass} transition-colors duration-300`}
        />
      )}
      {bg.decoration === 'pattern' && bg.pattern_id && (
        <PatternLayer patternId={bg.pattern_id} opacity={bg.opacity} />
      )}
      {bg.decoration === 'logo' && bg.logo_id && (
        <LogoLayer
          logoId={bg.logo_id}
          opacity={bg.opacity}
          mode={activeTheme.mode}
        />
      )}
      {bg.animation !== 'none' && (
        <AnimationOverlay animation={bg.animation} mode={activeTheme.mode} />
      )}
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
        blurLayer.style.clipPath = 'inset(100% 0 0 0)';
        return;
      }

      const top = Math.max(0, Math.min(viewportHeight, rect.top));
      const right = Math.max(
        0,
        viewportWidth - Math.min(viewportWidth, rect.right)
      );
      const bottom = Math.max(
        0,
        viewportHeight - Math.min(viewportHeight, rect.bottom)
      );
      const left = Math.max(0, Math.min(viewportWidth, rect.left));

      blurLayer.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px round 1rem)`;
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
      className='fixed inset-0 z-[6] pointer-events-none backdrop-blur-[10px]'
      style={{ clipPath: INITIAL_MAIN_CONTENT_CLIP_PATH }}
      aria-hidden
    />
  );
}

function ImageLayer({
  imageUrl,
  mode,
  opacity,
}: {
  imageUrl: string;
  mode: BgSettings['image_mode'];
  opacity: number;
}) {
  const resolved = resolveBgAsset(imageUrl);
  if (!resolved) return null;
  const rawSrc =
    resolved.kind === 'library' ? resolved.asset.src : resolved.src;
  const src = safeCssUrl(rawSrc);
  if (!src) return null;
  const tileSize =
    resolved.kind === 'library'
      ? (resolved.asset.tileSize ?? DEFAULT_PATTERN_TILE)
      : DEFAULT_PATTERN_TILE;
  return (
    <div
      className='fixed inset-0 pointer-events-none transition-opacity duration-300'
      style={{
        backgroundImage: `url("${src}")`,
        backgroundRepeat: mode === 'repeat' ? 'repeat' : 'no-repeat',
        backgroundSize: mode === 'repeat' ? tileSize : 'cover',
        backgroundPosition: 'center',
        opacity,
      }}
      aria-hidden
    />
  );
}

function PatternLayer({
  patternId,
  opacity,
}: {
  patternId: string;
  opacity: number;
}) {
  const resolved = resolveBgAsset(patternId);
  if (!resolved) return null;
  const src = resolved.kind === 'library' ? resolved.asset.src : resolved.src;
  const tileSize =
    resolved.kind === 'library'
      ? (resolved.asset.tileSize ?? DEFAULT_PATTERN_TILE)
      : DEFAULT_PATTERN_TILE;
  return (
    <div
      className='fixed inset-0 bg-repeat bg-top-left pointer-events-none transition-opacity duration-300'
      style={{
        backgroundImage: `url("${src}")`,
        backgroundSize: tileSize,
        opacity,
      }}
      aria-hidden
    />
  );
}

// Build a 100×100 SVG tile that contains the source logo at 40px max-height,
// centered (width auto-scales). Cached per logo so each is fetched only once.
const logoTileCache = new Map<string, Promise<string>>();

async function buildLogoTile(src: string): Promise<string> {
  const resp = await fetch(src);
  if (!resp.ok) throw new Error(`Failed to fetch logo: ${resp.status}`);
  const text = await resp.text();
  const viewBox =
    text.match(/viewBox\s*=\s*['"]([^'"]+)['"]/)?.[1] ?? '0 0 24 24';
  const inner = text
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
  const wrapper = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><svg x='0' y='30' width='100' height='40' preserveAspectRatio='xMidYMid meet' viewBox='${viewBox}'>${inner}</svg></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(wrapper)}`;
}

function useLogoTile(src: string | null): string | null {
  const [tile, setTile] = useState<string | null>(null);
  useEffect(() => {
    // Skip empty src — avoids fetching the current page URL when logo is unknown.
    if (!src) return;
    let cancelled = false;
    let promise = logoTileCache.get(src);
    if (!promise) {
      promise = buildLogoTile(src);
      logoTileCache.set(src, promise);
    }
    promise
      .then(t => {
        if (!cancelled) setTile(t);
      })
      .catch(() => {
        // On failure evict the cache entry so a later mount can retry.
        logoTileCache.delete(src);
      });
    return () => {
      cancelled = true;
    };
  }, [src]);
  return tile;
}

function LogoLayer({
  logoId,
  opacity,
  mode,
}: {
  logoId: string;
  opacity: number;
  mode: 'light' | 'dark';
}) {
  const logo = LOGO_LIBRARY.find(l => l.id === logoId);
  // Pass null when logo is unknown to skip the fetch entirely.
  const tile = useLogoTile(logo?.src ?? null);
  if (!logo || !tile) return null;
  return (
    <div
      className='fixed inset-0 bg-repeat bg-top-left pointer-events-none transition-opacity duration-300'
      style={{
        backgroundImage: `url("${tile}")`,
        backgroundSize: '100px 100px',
        opacity,
        filter: mode === 'dark' ? 'invert(1)' : undefined,
      }}
      aria-hidden
    />
  );
}
