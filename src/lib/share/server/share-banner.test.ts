import type { FundraiserThemeSettings } from '@/lib/theme/types';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { LeaderboardApiResponse } from '@/lib/types/leaderboard';
import type { CanvasLike } from '../render/theme-background';
import type { Ctx, ShareImage } from '../render/types';
import type { ShareTranslator } from './share-banner';

import { createTranslator } from 'next-intl';
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import de from '../../../../locales/de/share.json';
import en from '../../../../locales/en/share.json';
import { SHARE_FORMATS } from '../formats';
import fingerprints from '../render/design-fingerprints.json';
import { SHARE_IMAGE_DESIGN_VERSION } from '../render/design-version';
import {
  drawShareBanner,
  prepareShareBanner,
  shareBannerLabels,
} from './share-banner';

vi.mock('server-only', () => ({}));

// Calls that put pixels on the canvas. Each is written down with the whole drawing state, since setting a property alone draws nothing.
const PAINTS = new Set([
  'fill',
  'stroke',
  'fillRect',
  'strokeRect',
  'clearRect',
  'fillText',
  'strokeText',
  'drawImage',
]);

const DEFAULT_STATE: Record<string, unknown> = {
  fillStyle: '#000000',
  strokeStyle: '#000000',
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  font: '10px sans-serif',
  textAlign: 'start',
  textBaseline: 'alphabetic',
  lineWidth: 1,
  lineCap: 'butt',
  lineJoin: 'miter',
  lineDash: [],
  lineDashOffset: 0,
  miterLimit: 10,
  shadowColor: 'rgba(0, 0, 0, 0)',
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  filter: 'none',
  imageSmoothingEnabled: true,
};

function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 16);
}

/**
 * Canvases that draw nothing and write down every call instead, with images and paths standing in for real ones.
 * Text is as wide as its length times its font size, so neither the installed fonts nor the machine can change what is written.
 */
class Recording {
  private logs: string[][] = [];
  private names = new Map<object, string>();
  private gradients = 0;

  format(value: unknown): string {
    // Two decimals, so a last-digit difference in floating point cannot change the hash.
    if (typeof value === 'number') return String(Math.round(value * 100) / 100);
    if (typeof value === 'string') return JSON.stringify(value);
    if (Array.isArray(value))
      return `[${value.map(item => this.format(item)).join(',')}]`;
    if (value && typeof value === 'object')
      return this.names.get(value) ?? JSON.stringify(value);
    return String(value);
  }

  image(src: string): ShareImage {
    const image = { width: 800, height: 600 };
    // The path only, so the test's CDN host is not part of the design.
    this.names.set(image, `image(${new URL(src, 'https://local').pathname})`);
    return image;
  }

  path(d: string): Path2D {
    const path = {} as Path2D;
    this.names.set(path, `path(${d})`);
    return path;
  }

  canvas(width: number, height: number): CanvasLike {
    const log: string[] = [];
    this.logs.push(log);
    const canvas: CanvasLike = {
      width,
      height,
      getContext: () => context,
    };
    this.names.set(canvas, `canvas#${this.logs.length}`);
    const context = this.context(canvas, log);
    return canvas;
  }

  /** One text per canvas, in the order they were made. */
  text(): string {
    return this.logs
      .map((log, i) => [`canvas#${i + 1}`, ...log].join('\n'))
      .join('\n\n');
  }

  hash(): string {
    return hashText(this.text());
  }

  private context(canvas: CanvasLike, log: string[]): Ctx {
    let state = new Map(Object.entries(DEFAULT_STATE));
    const saved: Array<typeof state> = [];
    const call = (name: string, args: unknown[]) =>
      `${name}(${args.map(arg => this.format(arg)).join(', ')})`;
    const gradient = (kind: string, args: unknown[]) => {
      const name = `gradient#${++this.gradients}`;
      const value = {
        addColorStop: (...stop: unknown[]) =>
          log.push(`${name}.${call('addColorStop', stop)}`),
      };
      this.names.set(value, name);
      log.push(`${name} = ${call(kind, args)}`);
      return value;
    };
    const methods: Record<string, (...args: never[]) => unknown> = {
      save: () => {
        saved.push(new Map(state));
        log.push('save()');
      },
      restore: () => {
        state = saved.pop() ?? state;
        log.push('restore()');
      },
      setLineDash: (segments: number[]) => state.set('lineDash', [...segments]),
      getLineDash: () => [...(state.get('lineDash') as number[])],
      measureText: (text: string) => {
        const size = Number(/([\d.]+)px/.exec(String(state.get('font')))?.[1]);
        return {
          width: Array.from(text).length * (size || 10) * 0.6,
          actualBoundingBoxAscent: (size || 10) * 0.75,
          actualBoundingBoxDescent: (size || 10) * 0.25,
        };
      },
      createLinearGradient: (...args) => gradient('createLinearGradient', args),
      createRadialGradient: (...args) => gradient('createRadialGradient', args),
      createConicGradient: (...args) => gradient('createConicGradient', args),
      createPattern: (...args) => gradient('createPattern', args),
    };
    const snapshot = () =>
      [...state]
        .map(([key, value]) => `${key}=${this.format(value)}`)
        .join(' ');
    return new Proxy({} as Ctx, {
      get: (_, key) => {
        if (typeof key !== 'string') return undefined;
        if (key === 'canvas') return canvas;
        if (key in methods) return methods[key];
        if (state.has(key)) return state.get(key);
        return (...args: unknown[]) =>
          log.push(
            PAINTS.has(key)
              ? `${call(key, args)} {${snapshot()}}`
              : call(key, args)
          );
      },
      set: (_, key, value) => {
        state.set(String(key), value);
        return true;
      },
    });
  }
}

const translator = (locale: 'en' | 'de') =>
  createTranslator({
    locale,
    messages: { en, de }[locale],
    namespace: 'Share',
  }) as unknown as ShareTranslator;

const fundraiser = {
  id: 'f-1',
  hid: 'abc123',
  slug: 'forests-for-our-future',
  title: 'Forests for Our Future',
  description: null,
  image: 'cover.jpg',
  goalAmount: 5000,
  totalRaised: { EUR: 3600 },
  donationCount: 52,
  currency: 'EUR',
  workspace: null,
  hosts: [
    {
      id: 'h-1',
      user: { id: 'u-1', name: 'Maya Schneider', avatar: null },
      hostType: 'user',
      role: 'owner',
      isPublic: true,
      displayName: null,
      displayOrder: 0,
      status: 'active',
      invitedEmail: null,
    },
  ],
  visibility: 'public',
  status: 'active',
  canDonate: true,
  projectAllocations: [],
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  content: null,
  metadata: null,
  settings: {
    theme: {
      accent: 'emerald',
      mode: 'light',
      title_font: 'poppins',
      body_font: 'inter',
      bg: { decoration: 'pattern', pattern_id: 'bg-trees', opacity: 0.3 },
    },
    modules: {
      leaderboard: {
        enabled: true,
        show_recent_list: true,
        show_top_list: true,
        anonymize: false,
      },
      donor_score: { enabled: true, show_goal: true, show_days_left: true },
    },
  },
} as unknown as Fundraiser;

const donation = (id: string, donorName: string, avatarUrl?: string) => ({
  id,
  amount: 50,
  currency: 'EUR',
  donorName,
  created: '2026-09-01T10:00:00',
  avatarUrl: avatarUrl ?? null,
  isAnonymous: donorName === 'Anonymous',
});

const leaderboard = {
  top: [
    donation('d-1', 'Anna Weber', 'anna.png'),
    donation('d-2', 'Ben Müller'),
  ],
  recent: [
    donation('d-3', 'Chloé Martin'),
    donation('d-4', 'Anonymous'),
    donation('d-5', 'David Kim'),
    donation('d-6', 'Emre Yılmaz', 'emre.png'),
  ],
  donorCount: 48,
} as unknown as LeaderboardApiResponse;

// Exactly three public donors, so the donor line says "one other".
const threeDonors = {
  top: leaderboard.top,
  recent: [donation('d-3', 'Chloé Martin')],
  donorCount: 3,
} as unknown as LeaderboardApiResponse;

const noDonors = {
  ...leaderboard,
  top: [],
  recent: [],
  donorCount: 0,
} as unknown as LeaderboardApiResponse;

const fresh: Fundraiser = { ...fundraiser, totalRaised: {}, donationCount: 0 };

const withTheme = (
  data: Fundraiser,
  theme: FundraiserThemeSettings
): Fundraiser => ({ ...data, settings: { ...data.settings!, theme } });

const ended = withTheme(
  {
    ...fundraiser,
    status: 'completed',
    canDonate: false,
    totalRaised: { EUR: 6200 },
  },
  { accent: '#7c3aed', mode: 'dark', title_font: 'playfair' }
);

const hideGoal = (data: Fundraiser): Fundraiser => ({
  ...data,
  settings: {
    ...data.settings!,
    modules: {
      ...data.settings!.modules,
      donor_score: { enabled: true, show_goal: false, show_days_left: true },
    },
  },
});

// Each is a banner a crawler can get: live, before the first gift, ended and without a goal, in both locales, and on each kind of background and animation.
type Case = [Fundraiser, 'en' | 'de', LeaderboardApiResponse | null];

const CASES: Record<string, Case> = {
  'banner-en': [fundraiser, 'en', leaderboard],
  'banner-de': [fundraiser, 'de', leaderboard],
  'banner-en-new': [fresh, 'en', noDonors],
  'banner-en-ended': [ended, 'en', leaderboard],
  'banner-de-new': [fresh, 'de', noDonors],
  'banner-de-ended': [ended, 'de', leaderboard],
  'banner-en-no-goal': [hideGoal(fundraiser), 'en', threeDonors],
  'banner-en-started': [hideGoal(fresh), 'en', noDonors],
  'banner-light-image': [
    withTheme(fundraiser, {
      accent: 'sky',
      mode: 'light',
      bg: {
        gradient: '',
        custom_gradient: {
          angle: 135,
          stops: [
            { color: '#fde68a', position: 0 },
            { color: '#a7f3d0', position: 100 },
          ],
        },
        background_opacity: 0.3,
        decoration: 'image',
        image_url: 'bg-forest',
        image_mode: 'repeat',
        image_tint: 'custom',
        image_color: '#123456',
        opacity: 0.4,
        animation: 'snow',
      },
    }),
    'en',
    leaderboard,
  ],
  'banner-dark-logo': [
    withTheme(fundraiser, {
      accent: 'rose',
      mode: 'dark',
      bg: {
        gradient: '',
        background_color: '#1e3a8a',
        decoration: 'logo',
        logo_id: 'slack',
        opacity: 0.2,
        animation: 'hearts',
      },
    }),
    'en',
    leaderboard,
  ],
  'banner-fireworks': [
    withTheme(fundraiser, {
      ...fundraiser.settings!.theme,
      bg: { ...fundraiser.settings!.theme!.bg, animation: 'fireworks' },
    }),
    'en',
    leaderboard,
  ],
};

// Every text the banner can print, with both plural forms. So a wording change still counts in a branch no case above draws.
function wording(locale: 'en' | 'de'): string {
  const label = shareBannerLabels(translator(locale));
  return [
    label.byLine('Maya Schneider'),
    label.raisedOf('€3,600', '€5,000'),
    label.raised('€3,600'),
    label.given('Anna', 'Ben', 1),
    label.given('Anna', 'Ben', 46),
    label.goal('€5,000'),
    label.started(),
    label.first(),
    label.newBadge(),
    label.cta(false),
    label.cta(true),
  ].join('\n');
}

async function record([data, locale, board]: Case) {
  const recording = new Recording();
  const options = await prepareShareBanner(data, {
    locale,
    origin: 'https://www.example.org',
    leaderboard: board,
    t: translator(locale),
    loader: {
      loadImage: async src => recording.image(src),
      createCanvas: (width, height) => recording.canvas(width, height),
    },
    makePath: d => recording.path(d),
  });
  const { w, h } = SHARE_FORMATS.banner;
  drawShareBanner(recording.canvas(w, h).getContext('2d') as Ctx, options);
  return recording;
}

async function currentFingerprints() {
  const entries = await Promise.all(
    Object.entries(CASES).map(async ([name, banner]) => [
      name,
      (await record(banner)).hash(),
    ])
  );
  return {
    ...(Object.fromEntries(entries) as Record<string, string>),
    'wording-en': hashText(wording('en')),
    'wording-de': hashText(wording('de')),
  };
}

describe('link preview design', () => {
  it('matches the fingerprint stored for SHARE_IMAGE_DESIGN_VERSION', async () => {
    const current = await currentFingerprints();
    const entry = JSON.stringify(
      { [SHARE_IMAGE_DESIGN_VERSION]: current },
      null,
      2
    );
    // To print them: PRINT_SHARE_FINGERPRINTS=1 npx vitest run src/lib/share/server/share-banner.test.ts --reporter=verbose. A failing run shows them too.
    if (process.env.PRINT_SHARE_FINGERPRINTS) console.warn(entry);
    const stored = (fingerprints as Record<string, Record<string, string>>)[
      String(SHARE_IMAGE_DESIGN_VERSION)
    ];

    expect(
      current,
      `The share image changed. Bump SHARE_IMAGE_DESIGN_VERSION in src/lib/share/render/design-version.ts and add its fingerprint to design-fingerprints.json next to it, keeping the older entries:\n${entry}`
    ).toEqual(stored);
  });

  it('records the same drawing on every run', async () => {
    const first = await record(CASES['banner-en']);
    const second = await record(CASES['banner-en']);

    expect(second.text()).toBe(first.text());
  });

  it('records the real text of each locale', async () => {
    const english = (await record(CASES['banner-en'])).text();
    const german = (await record(CASES['banner-de'])).text();

    expect(english).toContain('fillText("by Maya Schneider"');
    expect(english).toContain('fillText("€3,600 raised of €5,000"');
    expect(english).toContain('fillText("Join me"');
    expect(english).toContain(
      'fillText("www.example.org/raise/forests-for-our-future"'
    );
    expect(german).toContain('fillText("von Maya Schneider"');
    expect(german).toContain('fillText("Mach mit"');
  });

  it('prints every label of each locale, in both plural forms', () => {
    const german = wording('de');

    expect(german).toContain(
      'Anna, Ben und eine weitere Person haben gespendet'
    );
    expect(german).toContain('Anna, Ben und 46 weitere haben gespendet');
    expect(german).toContain('Gerade gestartet');
    expect(german).toContain('Danke!');
    expect(wording('en')).toContain('Anna, Ben and 1 other have given');
  });

  it('changes the fingerprint when the text changes', async () => {
    const before = (await record(CASES['banner-en'])).hash();
    const after = (
      await record([
        { ...fundraiser, title: 'Forests for Our Children' },
        'en',
        leaderboard,
      ])
    ).hash();

    expect(after).not.toBe(before);
  });
});
