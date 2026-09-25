import type * as ImageUrlModule from '@/lib/utils/image-url';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { isAllowedImageUrl } from '@/lib/utils/image-url';
import { fetchAllowedImage } from './fetch-image';
import { mockFetch } from './mock-fetch';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/utils/image-url', async importOriginal => {
  const actual = await importOriginal<typeof ImageUrlModule>();
  return { ...actual, isAllowedImageUrl: vi.fn(actual.isAllowedImageUrl) };
});

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

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

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

  it.each([
    [
      'https://bucket.s3.amazonaws.com/a.png',
      'https://internal-app-1.eu-central-1.elb.amazonaws.com/a.jpg',
    ],
    [
      'https://images.unsplash.com/a.png',
      'https://app.plant-for-the-planet.org/a.jpg',
    ],
    ['https://images.unsplash.com/a.png', 'http://cdn.test.example/b.png'],
  ])(
    'checks a redirect hop against the server list, not only the form: %s to %s',
    async (from, to) => {
      // The target answers with an image, so following the hop would show up as a result.
      const calls = mockFetch({
        [from]: () => redirect(to),
        [to]: () => png(),
      });
      expect(await fetchAllowedImage(from)).toBeNull();
      expect(calls).toEqual([from]);
    }
  );

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

  it('asks fetch not to follow redirects itself, with a timeout, on every hop', async () => {
    // Were fetch to follow a redirect, it would reach the next host before the list is checked.
    const inits: Array<RequestInit | undefined> = [];
    const calls = mockFetch(
      {
        'https://images.unsplash.com/a.png': () =>
          redirect('https://images.unsplash.com/b.png'),
        'https://images.unsplash.com/b.png': () =>
          redirect('https://cdn.plant-for-the-planet.org/c.png'),
        'https://cdn.plant-for-the-planet.org/c.png': () => png(),
      },
      inits
    );

    expect(
      await fetchAllowedImage('https://images.unsplash.com/a.png')
    ).not.toBeNull();
    expect(calls).toHaveLength(3);
    expect(inits).toHaveLength(3);
    for (const init of inits) {
      expect(init?.redirect).toBe('manual');
      expect(init?.signal).toBeInstanceOf(AbortSignal);
    }
  });

  it('gives up after three redirects', async () => {
    const hop = (n: number) => `https://images.unsplash.com/${n}.png`;
    const calls = mockFetch({
      [hop(0)]: () => redirect(hop(1)),
      [hop(1)]: () => redirect(hop(2)),
      [hop(2)]: () => redirect(hop(3)),
      [hop(3)]: () => redirect(hop(4)),
      [hop(4)]: () => png(),
    });
    expect(await fetchAllowedImage(hop(0))).toBeNull();
    expect(calls).toEqual([hop(0), hop(1), hop(2), hop(3)]);
  });

  it('refuses an error response, even with an image type', async () => {
    mockFetch({
      'https://images.unsplash.com/a.png': () =>
        new Response(new Uint8Array([1]), {
          status: 500,
          headers: { 'content-type': 'image/png' },
        }),
    });
    expect(
      await fetchAllowedImage('https://images.unsplash.com/a.png')
    ).toBeNull();
  });

  it('refuses SVG', async () => {
    mockFetch({
      'https://images.unsplash.com/a.svg': () =>
        new Response('<svg/>', {
          headers: { 'content-type': 'image/svg+xml' },
        }),
    });
    expect(
      await fetchAllowedImage('https://images.unsplash.com/a.svg')
    ).toBeNull();
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

  it.each([
    'https://images.unsplash.com/photo-1.jpg',
    'https://plus.unsplash.com/premium-1.jpg',
    'https://cdn.plant-for-the-planet.org/media/a.jpg',
    'https://www-cdn.plant-for-the-planet.org/wp-content/a.jpg',
    'https://res.cloudinary.com/demo/image/upload/a.jpg',
    'https://planet.imgix.net/a.jpg',
    'https://lh3.googleusercontent.com/a/abc',
    'https://bucket.s3.amazonaws.com/a.jpg',
    'https://s3.amazonaws.com/bucket/a.jpg',
    'https://bucket.s3.eu-central-1.amazonaws.com/a.jpg',
    'https://s3.eu-central-1.amazonaws.com/bucket/a.jpg',
    'https://my.bucket.s3-eu-west-1.amazonaws.com/a.jpg',
    'https://bucket.s3.dualstack.eu-central-1.amazonaws.com/a.jpg',
    'https://IMAGES.Unsplash.com:443/a.jpg',
  ])('fetches from the image host %s', async url => {
    const calls = mockFetch({ [url]: () => png() });
    expect(await fetchAllowedImage(url)).not.toBeNull();
    expect(calls).toHaveLength(1);
  });

  it.each([
    // Hosts the form accepts, but that are not on the server list.
    'https://internal-app-123.eu-central-1.elb.amazonaws.com/a.jpg',
    'https://ec2-1-2-3-4.eu-central-1.compute.amazonaws.com/a.jpg',
    'https://abc123.execute-api.eu-central-1.amazonaws.com/a.jpg',
    'https://app.plant-for-the-planet.org/a.jpg',
    'https://staging.plant-for-the-planet.org/a.jpg',
    'https://api.unsplash.com/photos/a',
    'https://unsplash.com/a.jpg',
    'https://api.cloudinary.com/a.jpg',
    'https://sites.googleusercontent.com/a.jpg',
    'https://a.b.imgix.net/a.jpg',
    // AWS names that look like S3 but are not.
    'https://s3-foo-123.eu-central-1.elb.amazonaws.com/a.jpg',
    'https://bucket.s3-website-eu-west-1.amazonaws.com/a.jpg',
    'https://bucket.s3-accesspoint.eu-central-1.amazonaws.com/a.jpg',
    'https://x.s3.eu-central-1.vpce.amazonaws.com/a.jpg',
    // Look-alikes and tricks.
    'https://evils3.amazonaws.com/a.jpg',
    'https://s3.amazonaws.com.evil.com/a.jpg',
    'https://images.unsplash.com.evil.com/a.jpg',
    'https://evilimages.unsplash.com/a.jpg',
    'https://images.unsplash.com./a.jpg',
    'https://images.unsplash.com:8443/a.jpg',
    'https://user:pass@images.unsplash.com/a.jpg',
    'http://images.unsplash.com/a.jpg',
    'https://169.254.169.254/latest/meta-data',
    'https://[::1]/a.jpg',
    // The platform CDN: https, its exact host and port only.
    'http://cdn.test.example/a.jpg',
    'https://cdn.test.example:8443/a.jpg',
    'https://cdn.test.example./a.jpg',
    'https://evilcdn.test.example/a.jpg',
    'https://x.cdn.test.example/a.jpg',
    'https://cdn.test.example.evil.com/a.jpg',
  ])('never contacts %s', async url => {
    const calls = mockFetch({});
    expect(await fetchAllowedImage(url)).toBeNull();
    expect(calls).toEqual([]);
  });

  // Look-alikes the form accepts, so only the server list can refuse them.
  it.each([
    'https://images.unsplash.com.plant-for-the-planet.org/a.jpg',
    'https://bucket.s3.amazonaws.com.imgix.net/a.jpg',
    'https://res.cloudinary.com.amazonaws.com/a.jpg',
    'https://lh3.googleusercontent.com.cloudinary.com/a.jpg',
    'https://cdn.plant-for-the-planet.org.unsplash.com/a.jpg',
    'https://planet.imgix.net.amazonaws.com/a.jpg',
  ])('never contacts the look-alike %s', async url => {
    expect(isAllowedImageUrl(url)).toBe(true);
    const calls = mockFetch({});
    expect(await fetchAllowedImage(url)).toBeNull();
    expect(calls).toEqual([]);
  });

  it('needs the form list too, not only the server list', async () => {
    vi.mocked(isAllowedImageUrl).mockReturnValueOnce(false);
    const calls = mockFetch({});
    expect(
      await fetchAllowedImage('https://images.unsplash.com/a.jpg')
    ).toBeNull();
    expect(calls).toEqual([]);
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

  it.each<[string, () => Response]>([
    [
      'a network error',
      () => {
        throw new Error('offline');
      },
    ],
    ['a server error', () => new Response(null, { status: 503 })],
    ['too many requests', () => new Response(null, { status: 429 })],
  ])('reports %s as a failure that may pass later', async (_, respond) => {
    const url = 'https://images.unsplash.com/a.png';
    mockFetch({ [url]: respond });
    const onTransientFailure = vi.fn();

    expect(await fetchAllowedImage(url, { onTransientFailure })).toBeNull();
    expect(onTransientFailure).toHaveBeenCalledTimes(1);
  });

  it.each<[string, string, () => Response]>([
    [
      'a missing image',
      'https://images.unsplash.com/a.png',
      () => new Response(null, { status: 404 }),
    ],
    [
      'a type it never takes',
      'https://images.unsplash.com/a.svg',
      () =>
        new Response('<svg/>', {
          status: 200,
          headers: { 'content-type': 'image/svg+xml' },
        }),
    ],
    ['a host off the allowlist', 'https://evil.example/a.png', () => png()],
  ])(
    'does not report %s, which fails the same way next time',
    async (_, url, respond) => {
      mockFetch({ [url]: respond });
      const onTransientFailure = vi.fn();

      expect(await fetchAllowedImage(url, { onTransientFailure })).toBeNull();
      expect(onTransientFailure).not.toHaveBeenCalled();
    }
  );

  it('trusts a platform CDN on its own port, and only on that port', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_CDN_URL', 'https://cdn.local:8443/media/cache');
    const fresh = await import('./fetch-image');
    const onPort = 'https://cdn.local:8443/media/cache/a.jpg';
    const calls = mockFetch({ [onPort]: () => png() });

    expect(await fresh.fetchAllowedImage(onPort)).not.toBeNull();
    expect(
      await fresh.fetchAllowedImage('https://cdn.local/media/cache/a.jpg')
    ).toBeNull();
    expect(calls).toEqual([onPort]);
  });
});
