'use client';

import type { ReactNode } from 'react';
import type { BgSettings, Theme, ThemeMode } from '@/lib/theme/types';

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
import {
  customGradientCss,
  getDominantStopColor,
  getReadableMode,
  isValidHexColor,
} from '@/lib/theme/color-utils';
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

// Opacity of the user colour selection (solid or custom gradient) painted as a
// tint over the mode base layer. Preset gradient classes keep their authored alpha.
const TINT_OPACITY = 0.14;

const CTA_TEXT_ON_LIGHT = '#111111';
const CTA_TEXT_ON_DARK = '#ffffff';

// 'light' means the CTA surface is light, so it needs dark text; 'dark' needs white text.
function ctaTextFor(mode: ThemeMode): string {
  return mode === 'light' ? CTA_TEXT_ON_LIGHT : CTA_TEXT_ON_DARK;
}

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
      ? customGradientCss(cg)
      : null;
  const solidColor =
    !gradientClass && !customGradient && isValidHexColor(bg.background_color)
      ? bg.background_color
      : null;
  // Wash opacity of the solid/custom-gradient background over the mode base.
  // Falls back to the legacy constant for rows saved before it was adjustable.
  const washOpacity = bg.background_opacity ?? TINT_OPACITY;
  const shouldBlurMainContentBackdrop =
    blurMainContentBackdrop || shouldBlurForPathname(pathname);

  // The accent colour drives the CTA (solid), progress fill, and the nav logo;
  // the CTA text colour is picked for contrast against it.
  const accentColor = getAccentColor(activeTheme.accent);

  // A single colour representing the chosen background, at full strength (not
  // the 14% wash). Used to tint image/pattern decorations. Falls back to the
  // accent when the wash is a preset gradient class with no extractable hex.
  const bgTintColor =
    solidColor ??
    (customGradient && cg ? getDominantStopColor(cg.stops) : null) ??
    accentColor;

  return (
    <div
      className={`theme-${activeTheme.id} ${activeTheme.mode} relative min-h-screen flex flex-col`}
      data-theme={activeTheme.id}
      style={
        {
          fontFamily: getFontStack(activeTheme.bodyFont),
          '--theme-title-font': getFontStack(activeTheme.titleFont),
          '--accent-color': accentColor,
          '--theme-bg-color': bgTintColor,
          '--cta-foreground': ctaTextFor(getReadableMode(accentColor)),
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
          style={{ backgroundImage: customGradient, opacity: washOpacity }}
        />
      )}
      {solidColor && (
        <div
          className='fixed inset-0 transition-opacity duration-300'
          style={{ backgroundColor: solidColor, opacity: washOpacity }}
        />
      )}
      {bg.decoration === 'image' && bg.image_url && (
        <ImageLayer
          imageUrl={bg.image_url}
          mode={bg.image_mode}
          opacity={bg.opacity}
          tint={bg.image_tint}
          imageColor={bg.image_color}
        />
      )}
      {bg.decoration === 'pattern' && bg.pattern_id && (
        <PatternLayer
          patternId={bg.pattern_id}
          opacity={bg.opacity}
          tint={bg.pattern_tint}
          patternColor={bg.pattern_color}
        />
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
  tint = 'background',
  imageColor,
}: {
  imageUrl: string;
  mode: BgSettings['image_mode'];
  opacity: number;
  tint?: BgSettings['image_tint'];
  imageColor?: string | null;
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
  // The overlay colour: the background colour tints the image (default), the
  // accent, or nothing (the image shows at its opacity and the base + tint
  // wash shows through). Capped so the image stays visible at high opacity.
  const overlayColor =
    tint === 'custom' && isValidHexColor(imageColor)
      ? imageColor
      : tint === 'accent'
        ? 'var(--accent-color)'
        : tint === 'background'
          ? 'var(--theme-bg-color)'
          : null;
  return (
    <>
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
      {overlayColor && (
        <div
          className='fixed inset-0 pointer-events-none transition-opacity duration-300'
          style={{
            backgroundColor: overlayColor,
            mixBlendMode: 'multiply',
            opacity: Math.min(opacity, 0.55),
          }}
          aria-hidden
        />
      )}
    </>
  );
}

function PatternLayer({
  patternId,
  opacity,
  tint = 'accent',
  patternColor,
}: {
  patternId: string;
  opacity: number;
  tint?: BgSettings['pattern_tint'];
  patternColor?: string | null;
}) {
  const resolved = resolveBgAsset(patternId);
  if (!resolved) return null;
  const asset = resolved.kind === 'library' ? resolved.asset : null;
  const tileSize = asset?.tileSize ?? DEFAULT_PATTERN_TILE;
  const fullBleed = asset?.fullBleed ?? false;
  const masked = asset?.masked ?? false;
  const rawSrc =
    resolved.kind === 'library' ? resolved.asset.src : resolved.src;
  const src = safeCssUrl(rawSrc);
  if (!src) return null;

  // Monochrome mask: the theme colour is painted underneath and revealed only
  // where the stencil shapes are, so the colour appears to tint the pattern.
  // The paint colour is the accent (default), the background colour, or a
  // custom hex. Full-bleed designs cover the viewport once; the rest tile.
  if (masked) {
    const maskUrl = `url("${src}")`;
    const paintColor =
      tint === 'custom' && isValidHexColor(patternColor)
        ? patternColor
        : tint === 'background'
          ? 'var(--theme-bg-color)'
          : 'var(--accent-color)';
    return (
      <div
        className='fixed inset-0 pointer-events-none transition-opacity duration-300'
        style={{
          backgroundColor: paintColor,
          WebkitMaskImage: maskUrl,
          maskImage: maskUrl,
          WebkitMaskRepeat: fullBleed ? 'no-repeat' : 'repeat',
          maskRepeat: fullBleed ? 'no-repeat' : 'repeat',
          WebkitMaskSize: fullBleed ? 'cover' : tileSize,
          maskSize: fullBleed ? 'cover' : tileSize,
          WebkitMaskPosition: fullBleed ? 'center' : 'top left',
          maskPosition: fullBleed ? 'center' : 'top left',
          opacity,
        }}
        aria-hidden
      />
    );
  }

  return (
    <div
      className='fixed inset-0 pointer-events-none transition-opacity duration-300'
      style={{
        backgroundImage: `url("${src}")`,
        backgroundRepeat: fullBleed ? 'no-repeat' : 'repeat',
        backgroundSize: fullBleed ? 'cover' : tileSize,
        backgroundPosition: fullBleed ? 'center' : 'top left',
        opacity,
      }}
      aria-hidden
    />
  );
}

// Watermark tile width in px. Single knob for spacing/density: the repeating
// unit is LOGO_TILE_PX wide and 2×LOGO_TILE_PX tall (two logo rows, the lower
// one offset by half a tile for a staggered / half-drop pattern instead of an
// aligned grid).
const LOGO_TILE_PX = 100;

// Build the repeating half-drop unit: the source logo inlined into a
// LOGO_TILE_PX × (2·LOGO_TILE_PX) SVG. The upper row is centered; the lower row
// is shifted by half a tile (drawn as two edge copies so it wraps seamlessly
// when the unit repeats horizontally). Cached per logo so each is fetched only
// once.
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
  const logoH = LOGO_TILE_PX * 0.4;
  const half = LOGO_TILE_PX / 2;
  const topY = (LOGO_TILE_PX - logoH) / 2;
  const bottomY = LOGO_TILE_PX + topY;
  const cell = (x: number, y: number) =>
    `<svg x='${x}' y='${y}' width='${LOGO_TILE_PX}' height='${logoH}' preserveAspectRatio='xMidYMid meet' viewBox='${viewBox}'>${inner}</svg>`;
  const wrapper =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${LOGO_TILE_PX} ${LOGO_TILE_PX * 2}'>` +
    `${cell(0, topY)}${cell(-half, bottomY)}${cell(half, bottomY)}</svg>`;
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
        backgroundSize: `${LOGO_TILE_PX}px ${LOGO_TILE_PX * 2}px`,
        opacity,
        filter: mode === 'dark' ? 'invert(1)' : undefined,
      }}
      aria-hidden
    />
  );
}
