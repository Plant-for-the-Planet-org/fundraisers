import type * as CanvasModule from '@napi-rs/canvas';
import type { ShareAssetLoader } from '../render/theme-background';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { buildTheme } from '@/lib/theme/build-theme';
import {
  loadShareBackgroundAssets,
  resolveShareBackground,
} from '../render/theme-background';
import { createServerAssetLoader } from './assets';
import { mockFetch } from './mock-fetch';

vi.mock('server-only', () => ({}));
vi.mock('@napi-rs/canvas', async importOriginal => {
  const actual = await importOriginal<typeof CanvasModule>();
  return { ...actual, loadImage: vi.fn(actual.loadImage) };
});

// A host the fundraiser form accepts (amazonaws.com), but that the server must never download from.
const ELB = 'https://internal-app-1.eu-central-1.elb.amazonaws.com/a.png';
const UNSPLASH = 'https://images.unsplash.com/a.png';

const response = (type: string, body: BodyInit) =>
  new Response(body, { status: 200, headers: { 'content-type': type } });

async function smallPng() {
  const canvas = createCanvas(37, 23);
  canvas.getContext('2d').fillRect(0, 0, 37, 23);
  return new Uint8Array(await canvas.encode('png'));
}

/** Only a PNG header, claiming 30000 × 30000: a few bytes that would decode to 3.6 GB. */
function hugePngHeader() {
  const b = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0);
  b.writeUInt32BE(13, 8);
  b.write('IHDR', 12, 'latin1');
  b.writeUInt32BE(30_000, 16);
  b.writeUInt32BE(30_000, 20);
  return new Uint8Array(b);
}

const imageBackground = (url: string) =>
  resolveShareBackground(
    buildTheme({ bg: { decoration: 'image', image_url: url } })
  );

const loader = createServerAssetLoader();

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('createServerAssetLoader', () => {
  it('draws an image from a server image host', async () => {
    const png = await smallPng();
    const calls = mockFetch({ [UNSPLASH]: () => response('image/png', png) });
    const image = await loader.loadImage(UNSPLASH);

    expect(image?.width).toBe(37);
    expect(calls).toEqual([UNSPLASH]);
  });

  it('never downloads from a host off the server list', async () => {
    const calls = mockFetch({});

    expect(await loader.loadImage(ELB)).toBeNull();
    expect(calls).toEqual([]);
  });

  it('loads a library file from public/ without the network', async () => {
    const calls = mockFetch({});
    const image = await loader.loadImage('/theme-logos/slack.svg');

    expect(image?.width).toBeGreaterThan(0);
    expect(calls).toEqual([]);
  });

  it('never reads a file outside public/', async () => {
    // package.json exists one folder up from public/.
    expect(await loader.loadImage('/../../package.json')).toBeNull();
  });

  it.each([
    [
      'an SVG claiming 40000 × 40000',
      'image/svg+xml',
      '<svg xmlns="http://www.w3.org/2000/svg" width="40000" height="40000"/>',
    ],
    ['a PNG header claiming 30000 × 30000', 'image/png', hugePngHeader()],
  ])('never decodes %s', async (_, type, body) => {
    const calls = mockFetch({ [UNSPLASH]: () => response(type, body) });

    expect(await loader.loadImage(UNSPLASH)).toBeNull();
    expect(calls).toEqual([UNSPLASH]);
    expect(loadImage).not.toHaveBeenCalled();
  });
});

describe('link preview background', () => {
  it('draws without a theme image on a host off the server list', async () => {
    const calls = mockFetch({});

    expect(
      await loadShareBackgroundAssets(imageBackground(ELB), loader)
    ).toEqual({});
    expect(calls).toEqual([]);
  });

  it('draws without a decoration whose loader fails', async () => {
    const failing: ShareAssetLoader = {
      ...loader,
      loadImage: () => Promise.reject(new Error('down')),
    };

    expect(
      await loadShareBackgroundAssets(imageBackground(UNSPLASH), failing)
    ).toEqual({});
  });
});
