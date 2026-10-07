import { afterEach, describe, expect, it, vi } from 'vitest';
import { GlobalFonts } from '@napi-rs/canvas';
import { mockFetch } from './mock-fetch';
import { registerShareFonts } from './register-fonts';

vi.mock('server-only', () => ({}));
vi.mock('@napi-rs/canvas', () => ({ GlobalFonts: { register: vi.fn() } }));

const cssUrl = (family: string) =>
  `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@500;600;700;800`;
const css = (file: string) =>
  new Response(`@font-face { src: url(${file}) format('truetype'); }`);
const ttf = () => new Response(new Uint8Array([0, 1, 0, 0]));

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// The loaded fonts stay for the whole process, so each test uses its own.
describe('registerShareFonts', () => {
  it('resolves true once every font is registered', async () => {
    const file = 'https://fonts.gstatic.com/s/inter/a.ttf';
    mockFetch({ [cssUrl('Inter')]: () => css(file), [file]: ttf });

    expect(await registerShareFonts(['inter'])).toBe(true);
    expect(GlobalFonts.register).toHaveBeenCalledWith(
      expect.any(Buffer),
      'Inter'
    );
  });

  it('resolves false when a font cannot be loaded, and tries it again on the next render', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const file = 'https://fonts.gstatic.com/s/roboto/a.ttf';
    mockFetch({
      [cssUrl('Roboto')]: () => new Response(null, { status: 503 }),
    });

    expect(await registerShareFonts(['roboto'])).toBe(false);
    expect(GlobalFonts.register).not.toHaveBeenCalled();

    mockFetch({ [cssUrl('Roboto')]: () => css(file), [file]: ttf });
    expect(await registerShareFonts(['roboto'])).toBe(true);
  });

  it('resolves false when only one of the fonts fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const file = 'https://fonts.gstatic.com/s/poppins/a.ttf';
    mockFetch({
      [cssUrl('Poppins')]: () => css(file),
      [file]: ttf,
      [cssUrl('Playfair Display')]: () => new Response('', { status: 500 }),
    });

    expect(await registerShareFonts(['poppins', 'playfair'])).toBe(false);
  });
});
