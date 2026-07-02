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

// Which elements the backdrop blur tracks. Flip to compare variants while reviewing.
//  - 'surface': one layer over the whole content column (legacy; blurs empty space below the shorter panel).
//  - 'panels':  one layer per content column (sidebar + main), each sized to its real content height.
//  - 'block':   one layer per tagged card ([data-blur-block]); no-op until cards are tagged.
// Note: layers use top/left/width/height positioning, never clip-path — clip-path + backdrop-filter
// produces a visible gray compositing-layer edge in Chromium (Chrome/Edge) but not Firefox/Safari.
type BackdropBlurMode = 'surface' | 'panels' | 'block';
const BACKDROP_BLUR_MODE: BackdropBlurMode = 'panels';

const BLUR_SELECTORS: Record<BackdropBlurMode, string> = {
  surface: '[data-main-content-surface]',
  panels: '[data-blur-surface]',
  block: '[data-blur-block]',
};

// Expand each blur layer slightly beyond its content bounds for breathing room (matches the old px-4/py-4 inset).
const BLUR_PADDING = 8;

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
      {/* Layer stack, back → front: gradient · image · pattern · logo · content.
          The gradient is the base wash; image/pattern/logo are decorations that
          sit on top of it. A transparent-based image (e.g. foliage) shows the
          gradient through its gaps instead of being hidden behind it. */}
      {gradientClass && (
        <div
          className={`fixed inset-0 ${gradientClass} transition-colors duration-300`}
        />
      )}
      {bg.decoration === 'image' && bg.image_url && (
        <ImageLayer
          imageUrl={bg.image_url}
          mode={bg.image_mode}
          opacity={bg.opacity}
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
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const selector = BLUR_SELECTORS[BACKDROP_BLUR_MODE];
    // Target elements can appear after this component mounts (loading.tsx /
    // Suspense-streamed page content, client-side data fetches), so the tracked
    // set is re-synced on DOM changes rather than queried once at mount.
    const layerByTarget = new Map<Element, HTMLDivElement>();
    let frameId = 0;
    let syncFrameId = 0;

    function makeLayer(): HTMLDivElement {
      const el = document.createElement('div');
      el.className =
        'fixed z-[6] pointer-events-none backdrop-blur-[10px] rounded-2xl';
      el.setAttribute('aria-hidden', 'true');
      el.style.width = '0';
      el.style.height = '0';
      container!.appendChild(el);
      return el;
    }

    function update() {
      frameId = 0;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      for (const [target, layer] of layerByTarget) {
        const rect = target.getBoundingClientRect();
        const isVisible =
          rect.bottom > 0 &&
          rect.right > 0 &&
          rect.top < vh &&
          rect.left < vw &&
          rect.width > 0 &&
          rect.height > 0;

        if (!isVisible) {
          layer.style.width = '0';
          layer.style.height = '0';
          continue;
        }

        const top = Math.max(0, Math.min(vh, rect.top - BLUR_PADDING));
        const left = Math.max(0, Math.min(vw, rect.left - BLUR_PADDING));
        const width = Math.min(vw, rect.right + BLUR_PADDING) - left;
        const height = Math.min(vh, rect.bottom + BLUR_PADDING) - top;

        layer.style.top = `${top}px`;
        layer.style.left = `${left}px`;
        layer.style.width = `${width}px`;
        layer.style.height = `${height}px`;
      }
    }

    function scheduleUpdate() {
      if (frameId === 0) {
        frameId = requestAnimationFrame(update);
      }
    }

    const resizeObserver = new ResizeObserver(scheduleUpdate);

    function syncTargets() {
      syncFrameId = 0;
      const found = document.querySelectorAll<HTMLElement>(selector);
      const seen = new Set<Element>();

      found.forEach(target => {
        seen.add(target);
        if (!layerByTarget.has(target)) {
          layerByTarget.set(target, makeLayer());
          resizeObserver.observe(target);
        }
      });

      for (const [target, layer] of layerByTarget) {
        if (!seen.has(target)) {
          resizeObserver.unobserve(target);
          layer.remove();
          layerByTarget.delete(target);
        }
      }

      scheduleUpdate();
    }

    function scheduleSync() {
      if (syncFrameId === 0) {
        syncFrameId = requestAnimationFrame(syncTargets);
      }
    }

    const mutationObserver = new MutationObserver(scheduleSync);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    syncTargets();

    return () => {
      cancelAnimationFrame(frameId);
      cancelAnimationFrame(syncFrameId);
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate);
      layerByTarget.forEach(layer => layer.remove());
    };
  }, []);

  return <div ref={containerRef} aria-hidden />;
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
