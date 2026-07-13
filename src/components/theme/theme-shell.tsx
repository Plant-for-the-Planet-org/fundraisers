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
import { isValidHexColor } from '@/lib/theme/color-utils';
import { getFontStack } from '@/lib/theme/font-utils';
import { getThemeForPath } from '@/lib/theme/route-themes';
import { useThemeStore } from '@/stores/theme-store';

const AnimationOverlay = dynamic(() => import('./animation-overlay'), {
  ssr: false,
});

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

// Opacity of the user colour selection (solid or custom gradient) painted as a
// tint over the mode base layer. Preset gradient classes keep their authored alpha.
const TINT_OPACITY = 0.14;

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
  // Base wash priority: preset class > custom gradient > solid colour. They are
  // kept mutually exclusive at write-time; this order is the safety net.
  // Values are validated (hex stops, numeric angle/positions) before inline
  // styling, matching the safeCssUrl guard below.
  const cg = bg.custom_gradient;
  const customGradient =
    !gradientClass &&
    cg &&
    cg.stops.length >= 2 &&
    cg.stops.every(s => isValidHexColor(s.color))
      ? `linear-gradient(${cg.angle}deg, ${cg.stops.map(s => `${s.color} ${s.position}%`).join(', ')})`
      : null;
  const solidColor =
    !gradientClass && !customGradient && isValidHexColor(bg.background_color)
      ? bg.background_color
      : null;
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
      {/* Layer stack, back → front: base · colour tint · image · pattern · logo · content.
          The mode base layer (black in dark, white in light) is always painted at
          100%. The user colour selection sits over it at TINT_OPACITY, so the page
          reads as a subtle tint of the base. Preset gradient classes keep their own
          authored alpha. Decorations (image/pattern/logo) sit on top and show the
          tinted base through their gaps. */}
      <div
        className='fixed inset-0 transition-colors duration-300'
        style={{ backgroundColor: 'rgb(var(--base-rgb))' }}
      />
      {gradientClass && (
        <div
          className={`fixed inset-0 ${gradientClass} transition-colors duration-300`}
        />
      )}
      {customGradient && (
        <div
          className='fixed inset-0 transition-opacity duration-300'
          style={{ backgroundImage: customGradient, opacity: TINT_OPACITY }}
        />
      )}
      {solidColor && (
        <div
          className='fixed inset-0 transition-opacity duration-300'
          style={{ backgroundColor: solidColor, opacity: TINT_OPACITY }}
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
