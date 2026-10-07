import type { Fundraiser } from '@/lib/types/fundraiser';
import type { LeaderboardApiResponse } from '@/lib/types/leaderboard';

import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCachedFundraiser } from '@/lib/api/fundraiser-service';
import { getLeaderboard } from '@/lib/api/leaderboard-service';
import { shareImagePath } from '@/lib/share/preview';
import { mockFetch } from '@/lib/share/server/mock-fetch';
import { shareImageVersion } from '@/lib/share/server/preview-version';
import { renderFundraiserShareImage } from '@/lib/share/server/render-share-image';
import { SHARE_LEADERBOARD_LIMIT } from '@/lib/share/share-data';
import { routing } from '@/i18n/routing';
import { GET } from './route';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/share/server/render-share-image', () => ({
  renderFundraiserShareImage: vi.fn(),
}));
vi.mock('@/lib/api/fundraiser-service', () => ({
  getCachedFundraiser: vi.fn(),
}));
vi.mock('@/lib/api/leaderboard-service', () => ({ getLeaderboard: vi.fn() }));

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 1, 2, 3]);
const COMPLETE = { bytes: JPEG, complete: true };
const LONG_CACHE = 'public, max-age=31536000, s-maxage=86400, immutable';

const donation = (id: string, donorName: string) => ({
  id,
  donorName,
  avatarUrl: null,
  isAnonymous: false,
});
const LEADERBOARD = {
  top: [donation('d-1', 'Anna Weber'), donation('d-2', 'Ben Müller')],
  recent: [donation('d-3', 'Chloé Martin')],
  donorCount: 3,
} as unknown as LeaderboardApiResponse;

// Settings that put a donor row on the image, so the route loads the leaderboard.
const SHOWS_DONORS = {
  modules: {
    leaderboard: {
      enabled: true,
      show_recent_list: true,
      show_top_list: true,
      anonymize: false,
    },
  },
} as unknown as Fundraiser['settings'];

const APP_ORIGIN = 'https://www.example.org';

const fundraiser = (
  slug: string,
  changes: Partial<Fundraiser> = {}
): Fundraiser =>
  ({
    slug,
    title: 'Forests for Our Future',
    image: 'cover.jpg',
    goalAmount: 5000,
    totalRaised: { EUR: 3400 },
    donationCount: 12,
    currency: 'EUR',
    hosts: [],
    status: 'active',
    canDonate: true,
    endDate: '2026-12-31',
    settings: null,
    ...changes,
  }) as unknown as Fundraiser;

/** The URL the page puts in og:image, as a path with its query. */
const currentPath = (
  slug: string,
  locale = 'en',
  origin = APP_ORIGIN,
  data = fundraiser(slug),
  board: LeaderboardApiResponse | null = null
) => shareImagePath(slug, locale, shareImageVersion(data, origin, board));

// The route keeps rendered images in a module-level cache, so each test uses its own slug.
function get(
  slug: string,
  path = currentPath(slug),
  headers: Record<string, string> = {}
) {
  return GET(new NextRequest(`http://internal:3000${path}`, { headers }), {
    params: Promise.resolve({ slug }),
  });
}

beforeEach(() => {
  // The render is mocked, so nothing here should reach the network.
  mockFetch({});
  vi.stubEnv('NEXT_PUBLIC_APP_HOST', 'www.example.org');
  vi.mocked(getCachedFundraiser).mockImplementation(async slug =>
    fundraiser(slug)
  );
  vi.mocked(getLeaderboard).mockResolvedValue(LEADERBOARD);
  vi.mocked(renderFundraiserShareImage).mockResolvedValue(COMPLETE);
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('GET /api/share-image/[slug]', () => {
  it('renders the current version as a JPEG that browsers may keep for a year and the CDN for a day', async () => {
    const response = await get('ok');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/jpeg');
    expect(response.headers.get('cache-control')).toBe(LONG_CACHE);
    expect(Buffer.from(await response.arrayBuffer())).toEqual(JPEG);
  });

  it('redirects a request without a version to the current one, briefly cached and without rendering', async () => {
    const response = await get(
      'no-version',
      '/api/share-image/no-version?l=en'
    );

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(
      `${APP_ORIGIN}${currentPath('no-version')}`
    );
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=300, s-maxage=300'
    );
    expect(renderFundraiserShareImage).not.toHaveBeenCalled();
  });

  it('never renders for an old or made-up version', async () => {
    for (const v of ['481234', 'aaaaaaaaaaaa', '', 'x'.repeat(500)]) {
      const response = await get(
        'made-up',
        `/api/share-image/made-up?l=en&v=${v}`
      );
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe(
        `${APP_ORIGIN}${currentPath('made-up')}`
      );
    }
    expect(renderFundraiserShareImage).not.toHaveBeenCalled();
  });

  it('renders in the requested locale', async () => {
    const response = await get('german', currentPath('german', 'de'));

    expect(response.status).toBe(200);
    expect(getCachedFundraiser).toHaveBeenCalledWith('german', 'de');
    expect(renderFundraiserShareImage).toHaveBeenCalledWith(
      fundraiser('german'),
      expect.objectContaining({ locale: 'de' })
    );
  });

  it('redirects a locale we do not have to the default one', async () => {
    const version = shareImageVersion(
      fundraiser('unknown-locale'),
      APP_ORIGIN,
      null
    );
    const response = await get(
      'unknown-locale',
      `/api/share-image/unknown-locale?l=xx&v=${version}`
    );

    expect(getCachedFundraiser).toHaveBeenCalledWith(
      'unknown-locale',
      routing.defaultLocale
    );
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(
      `${APP_ORIGIN}${currentPath('unknown-locale', routing.defaultLocale)}`
    );
    expect(renderFundraiserShareImage).not.toHaveBeenCalled();
  });

  it('redirects the GUID form to the slug', async () => {
    vi.mocked(getCachedFundraiser).mockResolvedValue(fundraiser('by-slug'));
    const response = await get(
      'a1b2c3d4-guid',
      currentPath('by-slug').replace('by-slug', 'a1b2c3d4-guid')
    );

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(
      `${APP_ORIGIN}${currentPath('by-slug')}`
    );
  });

  describe('with a donor row', () => {
    const withDonors = (slug: string) =>
      fundraiser(slug, { settings: SHOWS_DONORS });
    const donorPath = (slug: string, board = LEADERBOARD) =>
      currentPath(slug, 'en', APP_ORIGIN, withDonors(slug), board);

    beforeEach(() => {
      vi.mocked(getCachedFundraiser).mockImplementation(async slug =>
        withDonors(slug)
      );
    });

    it('loads the leaderboard with the limit the studio and the photo route use', async () => {
      const response = await get('board', donorPath('board'));

      expect(response.status).toBe(200);
      expect(getLeaderboard).toHaveBeenCalledWith(
        'board',
        SHARE_LEADERBOARD_LIMIT
      );
      expect(renderFundraiserShareImage).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ leaderboard: LEADERBOARD })
      );
    });

    it('moves to a new version when a donor on the image changes', async () => {
      const before = donorPath('renamed');
      const renamed = {
        ...LEADERBOARD,
        top: [donation('d-1', 'Annika Weber'), LEADERBOARD.top[1]],
      } as LeaderboardApiResponse;
      vi.mocked(getLeaderboard).mockResolvedValue(renamed);
      const response = await get('renamed', before);

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe(
        `${APP_ORIGIN}${donorPath('renamed', renamed)}`
      );
      expect(renderFundraiserShareImage).not.toHaveBeenCalled();
    });

    it('tries the leaderboard a second time', async () => {
      vi.mocked(getLeaderboard)
        .mockRejectedValueOnce(new Error('blip'))
        .mockResolvedValueOnce(LEADERBOARD);
      const response = await get('blip', donorPath('blip'));

      expect(response.status).toBe(200);
      expect(getLeaderboard).toHaveBeenCalledTimes(2);
    });

    it('falls back without caching when the leaderboard cannot be loaded, since the current version is unknown', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(getLeaderboard).mockRejectedValue(new Error('down'));
      const response = await get('no-board', donorPath('no-board'));

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe(
        'https://cdn.test.example/fundraiser/large/cover.jpg'
      );
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(renderFundraiserShareImage).not.toHaveBeenCalled();
    });
  });

  it('does not load the leaderboard when the image shows no donor row', async () => {
    await get('no-row');

    expect(getLeaderboard).not.toHaveBeenCalled();
    expect(renderFundraiserShareImage).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ leaderboard: null })
    );
  });

  it('keeps a render that missed a font or an image for a minute only, then renders again', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.mocked(renderFundraiserShareImage).mockResolvedValue({
      bytes: JPEG,
      complete: false,
    });
    const first = await get('partial');
    await get('partial');

    expect(first.status).toBe(200);
    expect(first.headers.get('cache-control')).toBe(
      'public, max-age=60, s-maxage=60'
    );
    expect(renderFundraiserShareImage).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(61_000);
    vi.mocked(renderFundraiserShareImage).mockResolvedValue(COMPLETE);
    const later = await get('partial');

    expect(renderFundraiserShareImage).toHaveBeenCalledTimes(2);
    expect(later.headers.get('cache-control')).toBe(LONG_CACHE);
  });

  it('prints the app host and renders once, whatever Host header a request sends', async () => {
    const first = await get('spoofed', currentPath('spoofed'), {
      host: 'evil.example',
      'x-forwarded-host': 'evil.example',
    });
    const second = await get('spoofed', currentPath('spoofed'), {
      host: 'other.example',
    });

    expect(first.status).toBe(200);
    expect(Buffer.from(await second.arrayBuffer())).toEqual(JPEG);
    expect(renderFundraiserShareImage).toHaveBeenCalledTimes(1);
    expect(renderFundraiserShareImage).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ origin: APP_ORIGIN })
    );
  });

  it('redirects to the app host, whatever Host header a request sends', async () => {
    const response = await get(
      'spoofed-redirect',
      '/api/share-image/spoofed-redirect',
      {
        host: 'evil.example',
        'x-forwarded-host': 'evil.example',
      }
    );

    expect(response.headers.get('location')).toBe(
      `${APP_ORIGIN}${currentPath('spoofed-redirect')}`
    );
  });

  it('renders each locale on its own', async () => {
    await get('two-locales', currentPath('two-locales', 'en'));
    await get('two-locales', currentPath('two-locales', 'de'));

    expect(renderFundraiserShareImage).toHaveBeenCalledTimes(2);
  });

  it('follows the forwarded host when no app host is set', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_HOST', '');
    const origin = 'https://preview.example';
    await get('preview', currentPath('preview', 'en', origin), {
      host: 'internal:3000',
      'x-forwarded-host': 'preview.example',
      'x-forwarded-proto': 'https',
    });

    expect(renderFundraiserShareImage).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ origin })
    );
  });

  it('keeps a render per forwarded host when no app host is set', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_HOST', '');
    const from = (host: string) => ({
      'x-forwarded-host': host,
      'x-forwarded-proto': 'https',
    });
    await get(
      'two-hosts',
      currentPath('two-hosts', 'en', 'https://a.example'),
      from('a.example')
    );
    await get(
      'two-hosts',
      currentPath('two-hosts', 'en', 'https://b.example'),
      from('b.example')
    );

    expect(renderFundraiserShareImage).toHaveBeenCalledTimes(2);
    expect(renderFundraiserShareImage).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({ origin: 'https://a.example' })
    );
    expect(renderFundraiserShareImage).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({ origin: 'https://b.example' })
    );
  });

  it('renders once per version, and moves on when the fundraiser changes', async () => {
    const before = currentPath('donation');
    await get('donation', before);
    await get('donation', before);
    expect(renderFundraiserShareImage).toHaveBeenCalledTimes(1);

    // A new donation: the old URL now points at the new version.
    const after = fundraiser('donation', {
      totalRaised: { EUR: 3450 },
      donationCount: 13,
    });
    vi.mocked(getCachedFundraiser).mockResolvedValue(after);
    const moved = await get('donation', before);
    const next = shareImagePath(
      'donation',
      'en',
      shareImageVersion(after, APP_ORIGIN, null)
    );
    expect(moved.status).toBe(302);
    expect(moved.headers.get('location')).toBe(`${APP_ORIGIN}${next}`);

    await get('donation', next);
    expect(renderFundraiserShareImage).toHaveBeenCalledTimes(2);
  });

  it('forgets the oldest render once the cache is full', async () => {
    // One more than the cache holds, so the first one is evicted whatever earlier tests left behind.
    for (let i = 0; i <= 200; i++) await get(`evict-${i}`);
    expect(renderFundraiserShareImage).toHaveBeenCalledTimes(201);

    await get('evict-200');
    expect(renderFundraiserShareImage).toHaveBeenCalledTimes(201);
    await get('evict-0');
    expect(renderFundraiserShareImage).toHaveBeenCalledTimes(202);
  });

  it('redirects to the cover photo when the render fails, without caching it, and tries again next time', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(renderFundraiserShareImage).mockRejectedValue(new Error('boom'));
    const response = await get('render-fails');

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(
      'https://cdn.test.example/fundraiser/large/cover.jpg'
    );
    expect(response.headers.get('cache-control')).toBe('no-store');
    await get('render-fails');
    expect(renderFundraiserShareImage).toHaveBeenCalledTimes(2);
  });

  it.each([
    'https://evil.example/phish.jpg',
    'http://cdn.test.example/fundraiser/large/cover.jpg',
    'https://cdn.test.example.evil.com/cover.jpg',
  ])(
    'redirects to the default image, not to a cover at %s the server does not trust',
    async image => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(getCachedFundraiser).mockResolvedValue(
        fundraiser('untrusted-cover', { image })
      );
      vi.mocked(renderFundraiserShareImage).mockRejectedValue(
        new Error('boom')
      );
      const response = await get(
        'untrusted-cover',
        currentPath(
          'untrusted-cover',
          'en',
          APP_ORIGIN,
          fundraiser('untrusted-cover', { image })
        )
      );

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe(
        `${APP_ORIGIN}/FUNDRAISER-Meta-Cover.jpg`
      );
      expect(response.headers.get('cache-control')).toBe('no-store');
    }
  );

  it('redirects to a cover on an image host the server trusts', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const image = 'https://images.unsplash.com/photo-1.jpg';
    vi.mocked(getCachedFundraiser).mockResolvedValue(
      fundraiser('trusted-cover', { image })
    );
    vi.mocked(renderFundraiserShareImage).mockRejectedValue(new Error('boom'));
    const response = await get(
      'trusted-cover',
      currentPath(
        'trusted-cover',
        'en',
        APP_ORIGIN,
        fundraiser('trusted-cover', { image })
      )
    );

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(image);
  });

  it('redirects to the default image on the share origin when the fundraiser cannot be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(getCachedFundraiser).mockRejectedValue(new Error('404'));
    const response = await get('missing', currentPath('missing'), {
      host: 'evil.example',
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(
      `${APP_ORIGIN}/FUNDRAISER-Meta-Cover.jpg`
    );
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(renderFundraiserShareImage).not.toHaveBeenCalled();
  });
});
