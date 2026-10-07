import type { ShareAssetLoader } from './theme-background';

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { buildTheme } from '@/lib/theme/build-theme';
import {
  loadShareBackgroundAssets,
  paintShareBackground,
  parseTailwindBackground,
  resolveShareBackground,
} from './theme-background';

describe('parseTailwindBackground', () => {
  it('reads a preset gradient, with alpha, and keeps the last via like CSS does', () => {
    expect(
      parseTailwindBackground(
        'bg-gradient-to-br from-emerald-300/25 via-pink-200/20 via-sky-200/15 to-lime-300/20'
      )
    ).toEqual({
      kind: 'gradient',
      direction: { corner: 'br' },
      opacity: 1,
      stops: [
        { color: '#5ee9b5', alpha: 0.25, position: 0 },
        {
          color: expect.stringMatching(/^#[0-9a-f]{6}$/),
          alpha: 0.15,
          position: 0.5,
        },
        {
          color: expect.stringMatching(/^#[0-9a-f]{6}$/),
          alpha: 0.2,
          position: 1,
        },
      ],
    });
  });

  it('reads the app’s own colours and a solid background', () => {
    const wash = parseTailwindBackground(
      'bg-gradient-to-b from-soft-blue via-soft-gold to-planet-50'
    );
    expect(
      wash?.kind === 'gradient' && wash.stops.map(stop => stop.color)
    ).toEqual(['#eff6ff', '#fff8e4', '#f0faf4']);
    expect(parseTailwindBackground('bg-gray-900')).toMatchObject({
      kind: 'solid',
      alpha: 1,
    });
  });

  it('ignores classes it does not know', () => {
    expect(parseTailwindBackground('bg-something-custom')).toBeNull();
  });
});

describe('resolveShareBackground', () => {
  it('follows the built-in themes', () => {
    const explore = resolveShareBackground(buildTheme({ base_id: 'explore' }));
    expect(explore.base).toBe('#ffffff');
    expect(explore.decoration).toMatchObject({
      kind: 'pattern',
      src: '/theme-backgrounds/pattern-trees.svg',
      masked: true,
    });

    const midnight = resolveShareBackground(
      buildTheme({ base_id: 'midnight' })
    );
    expect(midnight.base).toBe('#000000');
    expect(midnight.wash?.kind).toBe('gradient');
  });

  it('uses a custom gradient at the wash opacity, and tints decorations with its dominant colour', () => {
    const spec = resolveShareBackground(
      buildTheme({
        base_id: 'minimal',
        bg: {
          gradient: '',
          custom_gradient: {
            angle: 90,
            stops: [
              { color: '#ff0000', position: 0 },
              { color: '#00ff00', position: 50 },
              { color: '#0000ff', position: 100 },
            ],
          },
          background_opacity: 0.3,
          decoration: 'pattern',
          pattern_id: 'bg-dots',
          pattern_tint: 'background',
        },
      })
    );
    expect(spec.wash).toMatchObject({
      kind: 'gradient',
      direction: { angle: 90 },
      opacity: 0.3,
    });
    expect(spec.decoration).toMatchObject({
      kind: 'pattern',
      color: '#00ff00',
    });
  });

  it('turns a partner logo white on dark themes', () => {
    const spec = resolveShareBackground(
      buildTheme({
        base_id: 'dark',
        bg: { decoration: 'logo', logo_id: 'slack' },
      })
    );
    expect(spec.decoration).toMatchObject({
      kind: 'logo',
      src: '/theme-logos/slack.svg',
      invert: true,
    });
  });
});

describe('loading and painting', () => {
  const publicDir = path.join(process.cwd(), 'public');
  const loader: ShareAssetLoader = {
    loadImage: async src =>
      loadImage(await readFile(path.join(publicDir, src))),
    createCanvas: (w, h) => createCanvas(w, h),
  };

  it('paints a stencil pattern in its colour, and a logo tile, on the server canvas', async () => {
    for (const bg of [
      { decoration: 'pattern', pattern_id: 'bg-grid-lines' },
      { decoration: 'logo', logo_id: 'slack' },
    ]) {
      const spec = resolveShareBackground(
        buildTheme({ base_id: 'minimal', bg: { ...bg, opacity: 0.8 } })
      );
      const assets = await loadShareBackgroundAssets(spec, loader);
      expect(assets.pattern ?? assets.logo).toBeTruthy();

      const canvas = createCanvas(400, 400);
      const g = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
      paintShareBackground(g, 400, 400, { spec, assets });
      const pixels = g.getImageData(0, 0, 400, 400).data;
      let marked = 0;
      for (let i = 0; i < pixels.length; i += 4)
        if (pixels[i] + pixels[i + 1] + pixels[i + 2] < 700) marked++;
      // Something other than the white base was drawn.
      expect(marked).toBeGreaterThan(100);
    }
  });
});
