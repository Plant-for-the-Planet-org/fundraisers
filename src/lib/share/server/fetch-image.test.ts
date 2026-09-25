import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAllowedImage } from './fetch-image';

vi.mock('server-only', () => ({}));

const png = (
  body = new Uint8Array([1, 2, 3]),
  extra: Record<string, string> = {}
) =>
  new Response(body, {
    status: 200,
    headers: { 'content-type': 'image/png', ...extra },
  });
const redirect = (location: string) =>
  new Response(null, { status: 302, headers: { location } });

function mockFetch(responses: Record<string, () => Response>) {
  const calls: string[] = [];
  vi.stubGlobal('fetch', async (url: string) => {
    calls.push(url);
    const make = responses[url];
    if (!make) throw new Error(`unexpected fetch ${url}`);
    return make();
  });
  return calls;
}

afterEach(() => vi.unstubAllGlobals());

describe('fetchAllowedImage', () => {
  it('fetches an image from an allowlisted host', async () => {
    mockFetch({ 'https://images.unsplash.com/a.png': () => png() });
    expect(
      (await fetchAllowedImage('https://images.unsplash.com/a.png'))?.type
    ).toBe('image/png');
  });

  it('never contacts a host off the allowlist', async () => {
    const calls = mockFetch({});
    expect(await fetchAllowedImage('https://evil.example/a.png')).toBeNull();
    expect(calls).toEqual([]);
  });

  it('checks every redirect hop against the allowlist', async () => {
    const calls = mockFetch({
      'https://images.unsplash.com/a.png': () =>
        redirect('http://169.254.169.254/latest/meta-data'),
    });
    expect(
      await fetchAllowedImage('https://images.unsplash.com/a.png')
    ).toBeNull();
    expect(calls).toEqual(['https://images.unsplash.com/a.png']);
  });

  it('follows a redirect that stays on allowlisted hosts', async () => {
    mockFetch({
      'https://images.unsplash.com/a.png': () =>
        redirect('https://cdn.plant-for-the-planet.org/b.png'),
      'https://cdn.plant-for-the-planet.org/b.png': () => png(),
    });
    expect(
      await fetchAllowedImage('https://images.unsplash.com/a.png')
    ).not.toBeNull();
  });

  it('refuses SVG unless it is for the server canvas', async () => {
    const svg = () =>
      new Response('<svg/>', { headers: { 'content-type': 'image/svg+xml' } });
    mockFetch({ 'https://images.unsplash.com/a.svg': svg });
    expect(
      await fetchAllowedImage('https://images.unsplash.com/a.svg')
    ).toBeNull();
    mockFetch({ 'https://images.unsplash.com/a.svg': svg });
    expect(
      await fetchAllowedImage('https://images.unsplash.com/a.svg', {
        allowSvg: true,
      })
    ).not.toBeNull();
  });

  it('stops at the size cap, declared or not', async () => {
    mockFetch({
      'https://images.unsplash.com/big.png': () =>
        png(new Uint8Array(20), { 'content-length': '20' }),
    });
    expect(
      await fetchAllowedImage('https://images.unsplash.com/big.png', {
        maxBytes: 10,
      })
    ).toBeNull();
    mockFetch({
      'https://images.unsplash.com/big.png': () => png(new Uint8Array(20)),
    });
    expect(
      await fetchAllowedImage('https://images.unsplash.com/big.png', {
        maxBytes: 10,
      })
    ).toBeNull();
  });

  it('trusts the platform CDN, and fetches nothing for an empty URL', async () => {
    mockFetch({
      'https://cdn.test.example/fundraiser/large/a.jpg': () => png(),
    });
    expect(
      await fetchAllowedImage('https://cdn.test.example/fundraiser/large/a.jpg')
    ).not.toBeNull();
    const calls = mockFetch({});
    expect(await fetchAllowedImage('')).toBeNull();
    expect(calls).toEqual([]);
  });
});
