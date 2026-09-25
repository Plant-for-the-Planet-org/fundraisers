import type { Fundraiser } from '@/lib/types/fundraiser';
import type {
  LeaderboardApiResponse,
  LeaderboardDonation,
} from '@/lib/types/leaderboard';

import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCachedFundraiser } from '@/lib/api/fundraiser-service';
import { getFundraisers } from '@/lib/api/fundraisers-service';
import { getLeaderboard } from '@/lib/api/leaderboard-service';
import { PlatformAPIError } from '@/lib/api/platform-fetch';
import { mockFetch } from '@/lib/share/server/mock-fetch';
import {
  MIN_DONORS_FOR_AVATARS,
  SHARE_LEADERBOARD_LIMIT,
} from '@/lib/share/share-data';
import { isAllowedImageUrl } from '@/lib/utils/image-url';
import { GET } from './route';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/api/fundraiser-service', () => ({
  getCachedFundraiser: vi.fn(),
}));
vi.mock('@/lib/api/fundraisers-service', () => ({ getFundraisers: vi.fn() }));
vi.mock('@/lib/api/leaderboard-service', () => ({ getLeaderboard: vi.fn() }));

const SLUG = 'forest';
const CDN = 'https://cdn.test.example';
const COVER = `${CDN}/fundraiser/large/cover.jpg`;
// A host the fundraiser form accepts (amazonaws.com), but that the server must never download from.
const ELB = 'https://internal-app-1.eu-central-1.elb.amazonaws.com/a.jpg';

const shownBoard = {
  enabled: true,
  show_recent_list: true,
  show_top_list: false,
  anonymize: false,
};

function fundraiser({
  slug = SLUG,
  image = 'cover.jpg',
  leaderboard = shownBoard,
  theme,
}: {
  slug?: string;
  image?: string | null;
  leaderboard?: Record<string, unknown>;
  theme?: Record<string, unknown>;
} = {}): Fundraiser {
  return {
    slug,
    image,
    settings: { modules: { leaderboard }, theme },
  } as unknown as Fundraiser;
}

const donation = (
  id: string,
  donorName: string,
  extra: Partial<LeaderboardDonation> = {}
): LeaderboardDonation => ({
  id,
  amount: 10,
  currency: 'EUR',
  donorName,
  created: '2026-09-01T10:00:00',
  avatarUrl: `${id}.png`,
  ...extra,
});

function board(recent: LeaderboardDonation[]): LeaderboardApiResponse {
  return {
    recent,
    top: [],
    recentTotal: recent.length,
    topTotal: 0,
    donorCount: recent.length,
    donationCount: recent.length,
    settings: shownBoard as LeaderboardApiResponse['settings'],
  };
}

// pickShareDonors takes Anna (d1), Ben (d2), Chloé (d5), Dev (d6) and Eva (d7).
const DONORS = board([
  donation('d1', 'Anna Weber'),
  donation('d2', 'Ben Ohm'),
  donation('d3', 'Hidden Person', { isAnonymous: true }),
  donation('d4', 'Anna Klein'),
  donation('d5', 'Chloé Martin'),
  donation('d6', 'Dev Rao', { avatarUrl: null }),
  donation('d7', 'Eva Lind'),
  donation('d8', 'Finn Holt'),
]);

const image = (
  type = 'image/webp',
  body: BodyInit = new Uint8Array([7, 8, 9])
) => new Response(body, { status: 200, headers: { 'content-type': type } });

function get(query = '', headers: Record<string, string> = {}) {
  return GET(
    new NextRequest(
      `https://fundraisers.test/api/share/photo/${SLUG}${query}`,
      {
        headers,
      }
    ),
    { params: Promise.resolve({ slug: SLUG }) }
  );
}

beforeEach(() => {
  vi.mocked(getCachedFundraiser).mockResolvedValue(fundraiser());
  vi.mocked(getFundraisers).mockResolvedValue([]);
  vi.mocked(getLeaderboard).mockResolvedValue(DONORS);
});

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('GET /api/share/photo/[slug]: cover photo', () => {
  it('serves the cover as the upstream type, locked down and privately cached', async () => {
    const calls = mockFetch({ [COVER]: () => image() });
    const response = await get();

    expect(response.status).toBe(200);
    expect(calls).toEqual([COVER]);
    expect(response.headers.get('content-type')).toBe('image/webp');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('content-security-policy')).toBe(
      "default-src 'none'; sandbox"
    );
    expect(response.headers.get('cache-control')).toMatch(/^private\b/);
    expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([
      7, 8, 9,
    ]);
    expect(getLeaderboard).not.toHaveBeenCalled();
  });

  it('serves a full-URL cover on a server image host', async () => {
    const url = 'https://images.unsplash.com/photo-1.jpg';
    vi.mocked(getCachedFundraiser).mockResolvedValue(
      fundraiser({ image: url })
    );
    const calls = mockFetch({ [url]: () => image('image/jpeg') });
    const response = await get();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/jpeg');
    expect(calls).toEqual([url]);
  });

  it.each([
    ELB,
    'https://ec2-1-2-3-4.eu-central-1.compute.amazonaws.com/a.jpg',
    'https://app.plant-for-the-planet.org/a.jpg',
  ])(
    'never downloads a cover the form accepts but the server list does not: %s',
    async url => {
      expect(isAllowedImageUrl(url)).toBe(true);
      vi.mocked(getCachedFundraiser).mockResolvedValue(
        fundraiser({ image: url })
      );
      const calls = mockFetch({});
      const response = await get();

      expect(response.status).toBe(502);
      expect(calls).toEqual([]);
    }
  );

  it('answers 404 when the fundraiser has no cover', async () => {
    vi.mocked(getCachedFundraiser).mockResolvedValue(
      fundraiser({ image: null })
    );
    const calls = mockFetch({});

    expect((await get()).status).toBe(404);
    expect(calls).toEqual([]);
  });

  it('never passes on an SVG, which would run as a page on our origin', async () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="#2f8f4e"/></svg>';
    mockFetch({ [COVER]: () => image('image/svg+xml', svg) });
    const response = await get();

    expect(response.status).toBe(502);
    expect(response.headers.get('content-type')).not.toContain('svg');
    expect(await response.text()).not.toContain('<svg');
  });
});

describe('GET /api/share/photo/[slug]: drafts', () => {
  it('answers 404 when there is no token and the public lookup fails', async () => {
    vi.mocked(getCachedFundraiser).mockRejectedValue(new Error('404'));
    const calls = mockFetch({});

    expect((await get()).status).toBe(404);
    expect(getFundraisers).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  });

  it("finds a draft among the host's own fundraisers, as the impersonated host", async () => {
    vi.mocked(getCachedFundraiser).mockRejectedValue(new Error('404'));
    vi.mocked(getFundraisers).mockResolvedValue([
      fundraiser({ slug: 'other', image: 'other.jpg' }),
      fundraiser(),
    ]);
    mockFetch({ [COVER]: () => image() });
    const response = await get('', {
      authorization: 'Bearer host-token',
      'x-switch-user': 'host@example.org',
      'x-user-support-pin': '1234',
    });

    expect(response.status).toBe(200);
    expect(getFundraisers).toHaveBeenCalledWith('host-token', {
      email: 'host@example.org',
      pin: '1234',
    });
  });

  it('looks up a public fundraiser without the token', async () => {
    mockFetch({ [COVER]: () => image() });
    const response = await get('', { authorization: 'Bearer host-token' });

    expect(response.status).toBe(200);
    expect(getFundraisers).not.toHaveBeenCalled();
  });

  it.each([
    ['the cover', '', COVER],
    ['a donor photo', '?donor=d2', `${CDN}/profile/thumb/d2.png`],
  ])(
    'serves %s of a public fundraiser to a viewer with a rejected token',
    async (_, query, url) => {
      vi.mocked(getFundraisers).mockRejectedValue(
        new PlatformAPIError('http', 401, null)
      );
      mockFetch({ [url]: () => image('image/png') });

      expect((await get(query, { authorization: 'Bearer stale' })).status).toBe(
        200
      );
    }
  );

  it('answers 404, not 502, for a draft seen with a rejected token', async () => {
    vi.mocked(getCachedFundraiser).mockRejectedValue(new Error('404'));
    vi.mocked(getFundraisers).mockRejectedValue(
      new PlatformAPIError('http', 401, null)
    );
    const calls = mockFetch({});

    expect((await get('', { authorization: 'Bearer stale' })).status).toBe(404);
    expect(calls).toEqual([]);
  });

  it("never serves another of the host's fundraisers for a slug they do not host", async () => {
    vi.mocked(getCachedFundraiser).mockRejectedValue(new Error('404'));
    vi.mocked(getFundraisers).mockResolvedValue([
      fundraiser({ slug: 'other', image: 'other.jpg' }),
    ]);
    const calls = mockFetch({});
    const response = await get('', { authorization: 'Bearer host-token' });

    expect(response.status).toBe(404);
    expect(calls).toEqual([]);
  });
});

describe('GET /api/share/photo/[slug]: donor photos', () => {
  const thumb = (file: string) => `${CDN}/profile/thumb/${file}`;

  it('serves the profile thumb of a donor the share image names', async () => {
    const calls = mockFetch({ [thumb('d2.png')]: () => image('image/png') });
    const response = await get('?donor=d2');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
    expect(calls).toEqual([thumb('d2.png')]);
    expect(getLeaderboard).toHaveBeenCalledWith(SLUG, SHARE_LEADERBOARD_LIMIT);
  });

  it('serves a donor of a draft to its host', async () => {
    vi.mocked(getCachedFundraiser).mockRejectedValue(new Error('404'));
    vi.mocked(getFundraisers).mockResolvedValue([fundraiser()]);
    mockFetch({ [thumb('d1.png')]: () => image('image/png') });
    const response = await get('?donor=d1', {
      authorization: 'Bearer host-token',
    });

    expect(response.status).toBe(200);
    expect(getFundraisers).toHaveBeenCalledWith('host-token', null);
  });

  it.each([
    ['the leaderboard module is off', { ...shownBoard, enabled: false }],
    [
      'neither list is shown',
      { ...shownBoard, show_recent_list: false, show_top_list: false },
    ],
    ['the leaderboard is anonymised', { ...shownBoard, anonymize: true }],
  ])('answers 404 when %s', async (_, leaderboard) => {
    vi.mocked(getCachedFundraiser).mockResolvedValue(
      fundraiser({ leaderboard })
    );
    const calls = mockFetch({});

    expect((await get('?donor=d2')).status).toBe(404);
    expect(calls).toEqual([]);
  });

  it.each([
    ['an anonymous donor', 'd3'],
    ['a second donor with a first name already shown', 'd4'],
    ['a picked donor without a photo', 'd6'],
    ['a donor past the first five names', 'd8'],
    ['an id that is not on the leaderboard', 'nobody'],
    ['a URL instead of an id', 'https://images.unsplash.com/a.jpg'],
  ])('answers 404 for %s', async (_, donor) => {
    const calls = mockFetch({});

    expect((await get(`?donor=${encodeURIComponent(donor)}`)).status).toBe(404);
    expect(calls).toEqual([]);
  });

  it('answers 404 with fewer donors than the image needs to show any', async () => {
    vi.mocked(getLeaderboard).mockResolvedValue(
      board(DONORS.recent.slice(0, MIN_DONORS_FOR_AVATARS - 1))
    );
    const calls = mockFetch({});

    expect((await get('?donor=d1')).status).toBe(404);
    expect(calls).toEqual([]);
  });

  it('answers 404 when the leaderboard cannot be loaded', async () => {
    vi.mocked(getLeaderboard).mockRejectedValue(new Error('down'));
    const calls = mockFetch({});

    expect((await get('?donor=d1')).status).toBe(404);
    expect(calls).toEqual([]);
  });
});

describe('GET /api/share/photo/[slug]: theme background', () => {
  const withBackground = (bg: Record<string, unknown>) =>
    vi
      .mocked(getCachedFundraiser)
      .mockResolvedValue(fundraiser({ theme: { bg } }));

  it('serves an external https theme image', async () => {
    const url = 'https://images.unsplash.com/bg.jpg';
    withBackground({ decoration: 'image', image_url: url });
    const calls = mockFetch({ [url]: () => image('image/jpeg') });
    const response = await get('?asset=background');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/jpeg');
    expect(calls).toEqual([url]);
  });

  it('never downloads a theme image on a host off the server list', async () => {
    withBackground({ decoration: 'image', image_url: ELB });
    const calls = mockFetch({});

    expect((await get('?asset=background')).status).toBe(502);
    expect(calls).toEqual([]);
  });

  it('answers 502 for an SVG theme image, whatever size it claims', async () => {
    const url = 'https://images.unsplash.com/bg.svg';
    withBackground({ decoration: 'image', image_url: url });
    mockFetch({
      [url]: () =>
        image(
          'image/svg+xml',
          '<svg xmlns="http://www.w3.org/2000/svg" width="40000" height="40000"/>'
        ),
    });
    const response = await get('?asset=background');

    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain('<svg');
  });

  it.each([
    ['a library image', { decoration: 'image', image_url: 'bg-forest' }],
    ['a library pattern', { decoration: 'pattern', pattern_id: 'bg-dots' }],
    ['no decoration', { decoration: 'none' }],
  ])('answers 404 for %s', async (_, bg) => {
    withBackground(bg);
    const calls = mockFetch({});

    expect((await get('?asset=background')).status).toBe(404);
    expect(calls).toEqual([]);
  });
});
