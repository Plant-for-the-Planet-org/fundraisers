'use client';

import type { BgSettings, Theme } from '@/lib/theme/types';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  DEFAULT_PATTERN_TILE,
  LOGO_LIBRARY,
  resolveBgAsset,
} from '@/lib/theme/backgrounds';

const AnimationOverlay = dynamic(() => import('./animation-overlay'), {
  ssr: false,
});

/**
 * Theme background layer stack, back → front: gradient · image · pattern · logo
 * · animation. Shared by `ThemeShell` (public page) and the create/edit preview
 * dialog so both render identical decorations with the same z-index semantics.
 * Purely presentational — no theme-store or route side effects.
 *
 * Animations layer via their own z-index (z-5 behind content, z-20 above); the
 * caller must place page content at `z-10` for that split to work.
 */
export function ThemeBackdrop({ theme }: { theme: Theme }) {
  const bg = theme.bg;
  return (
    <>
      {bg.gradient && (
        <div
          className={`fixed inset-0 ${bg.gradient} transition-colors duration-300`}
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
        <LogoLayer logoId={bg.logo_id} opacity={bg.opacity} mode={theme.mode} />
      )}
      {bg.animation !== 'none' && (
        <AnimationOverlay animation={bg.animation} mode={theme.mode} />
      )}
    </>
  );
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
