'use client';

import type { SeasonId } from '@/lib/share/render/seasons';
import type { ShareBackground } from '@/lib/share/render/theme-background';
import type {
  ShareCardId,
  ShareImage,
  ShareRenderData,
  ShareRenderTheme,
} from '@/lib/share/render/types';
import type {
  ShareDonorProgress,
  ShareDonors,
  ShareGift,
} from '@/lib/share/share-data';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { ProjectPurpose } from '@/lib/types/project-selection';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getLeaderboard } from '@/lib/api/leaderboard-service';
import { impersonationHeaders } from '@/lib/api/platform-fetch';
import { projectsService } from '@/lib/api/projects-service';
import {
  resolveBrowserFontFamily,
  SHARE_FONT_WEIGHTS,
} from '@/lib/share/fonts';
import { displayUrl } from '@/lib/share/links';
import { loadShareAvatars } from '@/lib/share/render/avatars';
import { SEASONS } from '@/lib/share/render/seasons';
import {
  loadShareBackgroundAssets,
  resolveShareBackground,
} from '@/lib/share/render/theme-background';
import {
  buildShareRenderData,
  getShareDonorProgress,
  getShareProjectList,
  IMPACT_NAMES,
  pickShareDonors,
  previewDonorProgress,
  previewLeaderboard,
  SHARE_LEADERBOARD_LIMIT,
} from '@/lib/share/share-data';
import { getAccentColor } from '@/lib/theme/accent-utils';
import { buildTheme } from '@/lib/theme/build-theme';
import { useAuthStore } from '@/stores/auth-store';
import { useImpersonationStore } from '@/stores/impersonation-store';
import {
  browserAssetLoader,
  browserMakePath,
  browserRouteLoader,
  fetchImage,
} from './browser-assets';
import { useOrigin } from './use-origin';

/**
 * The fundraiser's cover photo, loaded through our own route so the canvas stays exportable.
 * Drafts are only visible to their hosts, so the token and any impersonation go along.
 * Undefined while loading, null when there is none.
 */
function useSharePhoto(
  slug: string,
  headers: Record<string, string>
): ShareImage | null | undefined {
  const [photo, setPhoto] = useState<{
    slug: string;
    image: ShareImage | null;
  } | null>(null);

  useEffect(() => {
    let ignore = false;
    // No photo leaves the ring's circle plain.
    fetchImage(`/api/share/photo/${encodeURIComponent(slug)}`, headers)
      .catch(() => null)
      .then(image => {
        if (!ignore) setPhoto({ slug, image });
      });
    return () => {
      ignore = true;
    };
  }, [slug, headers]);

  return photo?.slug === slug ? photo.image : undefined;
}

/** Public donors for the avatar row, by the public page's rules. */
function useShareDonors(fundraiser: Fundraiser): {
  /** Undefined while loading, null when no donor may be named. */
  donors: ShareDonors | null | undefined;
  /** Undefined while loading. */
  progress: ShareDonorProgress | undefined;
} {
  const [loaded, setLoaded] = useState<{
    slug: string;
    value: ShareDonors | null;
    progress: ShareDonorProgress;
  } | null>(null);
  useEffect(() => {
    let ignore = false;
    // A development server can stand in made-up donors (`?donors=4`), to see a story with donors before anyone has given.
    const previewBoard = previewLeaderboard(window.location.search);
    (previewBoard
      ? Promise.resolve(previewBoard)
      : getLeaderboard(fundraiser.slug, SHARE_LEADERBOARD_LIMIT)
    )
      .then(board => {
        if (!ignore)
          setLoaded({
            slug: fundraiser.slug,
            value: pickShareDonors(fundraiser, board),
            progress:
              previewDonorProgress(window.location.search) ??
              getShareDonorProgress(fundraiser, board),
          });
      })
      .catch(() => {
        if (!ignore)
          setLoaded({
            slug: fundraiser.slug,
            value: null,
            progress: getShareDonorProgress(fundraiser, null),
          });
      });
    return () => {
      ignore = true;
    };
  }, [fundraiser]);
  const current = loaded?.slug === fundraiser.slug ? loaded : null;
  return { donors: current?.value, progress: current?.progress };
}

/** The host's token and any impersonation, for our routes that serve a draft's images. */
function useShareHeaders(): Record<string, string> {
  const token = useAuthStore(state => state.accessToken);
  // Subscribed, so starting or stopping impersonation refreshes the headers too.
  const email = useImpersonationStore(state =>
    state.isActive ? state.email : null
  );
  const pin = useImpersonationStore(state =>
    state.isActive ? state.pin : null
  );
  return useMemo(
    () => ({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...impersonationHeaders(email && pin ? { email, pin } : null),
    }),
    [token, email, pin]
  );
}

/** The fundraiser page's background, with its decoration loaded. Null until it is ready. */
function useShareBackground(
  fundraiser: Fundraiser,
  headers: Record<string, string>
): ShareBackground | null {
  const spec = useMemo(
    () => resolveShareBackground(buildTheme(fundraiser.settings?.theme)),
    [fundraiser.settings?.theme]
  );
  const [loaded, setLoaded] = useState<ShareBackground | null>(null);
  useEffect(() => {
    let ignore = false;
    loadShareBackgroundAssets(
      spec,
      browserAssetLoader(fundraiser.slug, headers)
    )
      // A decoration that cannot load leaves the plain wash, rather than a studio stuck on "Preparing".
      .catch(() => ({}))
      .then(assets => {
        if (!ignore) setLoaded({ spec, assets });
      });
    return () => {
      ignore = true;
    };
  }, [spec, fundraiser.slug, headers]);
  return loaded?.spec === spec ? loaded : null;
}

/**
 * Each named donor's photo, or the app's generated avatar, in the order of `donors.names`.
 * Undefined while they load. Null while the donors themselves load, when no donor may be shown, or when the avatars cannot be made.
 */
function useShareAvatars(
  slug: string,
  donors: ShareDonors | null | undefined,
  dark: boolean,
  headers: Record<string, string>
): ShareImage[] | null | undefined {
  const [avatars, setAvatars] = useState<{
    donors: ShareDonors;
    dark: boolean;
    images: ShareImage[] | null;
  } | null>(null);
  useEffect(() => {
    if (!donors) return;
    let ignore = false;
    loadShareAvatars(
      donors.people.map(person => ({
        seed: person.seed,
        photo: person.avatarFile
          ? `/api/share/photo/${encodeURIComponent(slug)}?donor=${encodeURIComponent(person.seed)}`
          : null,
      })),
      {
        loader: browserRouteLoader(headers),
        makePath: browserMakePath,
        dark,
      }
    )
      // The row keeps its initials when the avatars cannot be made.
      .catch(() => null)
      .then(images => {
        if (!ignore) setAvatars({ donors, dark, images });
      });
    return () => {
      ignore = true;
    };
  }, [slug, donors, dark, headers]);
  if (!donors) return null;
  return avatars && avatars.donors === donors && avatars.dark === dark
    ? avatars.images
    : undefined;
}

/**
 * The picture of each project the Impact card names, in the order of `getShareProjectList`.
 * Undefined while they load; null when the card does not need them or no project has one.
 * A project with no picture, or whose picture fails to load, is null in its place and shows a plain mark.
 */
function useProjectImages(
  fundraiser: Fundraiser,
  enabled: boolean,
  headers: Record<string, string>
): Array<ShareImage | null> | null | undefined {
  const slug = fundraiser.slug;
  const projects = useMemo(
    () => getShareProjectList(fundraiser).slice(0, IMPACT_NAMES),
    [fundraiser]
  );
  const wanted = enabled && projects.some(project => project.hasImage);
  const key = `${slug}|${projects.map(p => `${p.id}${p.hasImage ? '+' : '-'}`).join(',')}`;
  const [loaded, setLoaded] = useState<{
    key: string;
    images: Array<ShareImage | null>;
  } | null>(null);
  useEffect(() => {
    if (!wanted) return;
    let ignore = false;
    Promise.all(
      projects.map(project =>
        project.hasImage
          ? fetchImage(
              `/api/share/photo/${encodeURIComponent(slug)}?project=${encodeURIComponent(project.id)}`,
              headers
            ).catch(() => null)
          : null
      )
    ).then(images => {
      if (!ignore) setLoaded({ key, images });
    });
    return () => {
      ignore = true;
    };
    // `key` stands for `projects` and `slug`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted, key, headers]);
  if (!wanted) return null;
  return loaded?.key === key ? loaded.images : undefined;
}

/** How long a file waits for the photo and donors before it is made without the ones still loading. */
const SETTLE_TIMEOUT_MS = 2500;

/** True once `SETTLE_TIMEOUT_MS` has passed since the studio opened this fundraiser. */
function useSettleTimeout(slug: string): boolean {
  const [timedOut, setTimedOut] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(slug), SETTLE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [slug]);
  return timedOut === slug;
}

/**
 * What the fundraiser's projects do, for seasonal wording. Only looked up once a season needs it.
 * A project missing from the list (such as the default cause) counts as unknown, which gives the neutral wording.
 */
export function useProjectPurposes(
  fundraiser: Fundraiser,
  enabled: boolean
): ProjectPurpose[] {
  const locale = useLocale();
  const [purposes, setPurposes] = useState<ProjectPurpose[]>([]);
  const country = fundraiser.workspace?.country;
  const ids = useMemo(
    () =>
      fundraiser.projectAllocations.map(allocation => allocation.project.id),
    [fundraiser.projectAllocations]
  );

  useEffect(() => {
    if (!enabled || !country) return;
    let ignore = false;
    projectsService
      .getProjects(country, locale)
      .then(projects => {
        if (ignore) return;
        setPurposes(
          ids.flatMap(id => {
            const purpose = projects.find(
              project => project.id === id
            )?.purpose;
            return purpose ? [purpose] : [];
          })
        );
      })
      .catch(() => {
        if (!ignore) setPurposes([]);
      });
    return () => {
      ignore = true;
    };
  }, [enabled, country, ids, locale]);

  return enabled ? purposes : [];
}

/** Waits for the theme's fonts, so the first frame is not drawn in a fallback font. */
function useFontsReady(families: string[]): boolean {
  const [ready, setReady] = useState<string | null>(null);
  const key = families.join('|');
  useEffect(() => {
    let ignore = false;
    Promise.all(
      families.flatMap(family =>
        SHARE_FONT_WEIGHTS.map(weight =>
          document.fonts.load(`${weight} 40px "${family}"`)
        )
      )
    )
      .catch(() => undefined)
      .then(() => {
        if (!ignore) setReady(key);
      });
    return () => {
      ignore = true;
    };
    // `key` stands for `families`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return ready === key;
}

/** Everything the share renderer needs for this fundraiser, updated as the choices change. */
export function useShareRender({
  fundraiser,
  season,
  cta,
  showDonors,
  gift = null,
  showGift = true,
  note = null,
  showAmounts = true,
  showHost = true,
  card = 'progress',
  showProjects = false,
}: {
  fundraiser: Fundraiser;
  season: SeasonId;
  cta: string;
  showDonors: boolean;
  /** The donor's completed gift. It always counts in the total on the image. */
  gift?: ShareGift | null;
  /** Puts the gift on its own line under the amount. */
  showGift?: boolean;
  /** The host's own line on the image. */
  note?: string | null;
  showAmounts?: boolean;
  showHost?: boolean;
  card?: ShareCardId;
  /** Names the supported projects on the image. */
  showProjects?: boolean;
}): {
  data: ShareRenderData;
  theme: ShareRenderTheme;
  photo: ShareImage | null;
  background: ShareBackground | null;
  avatars: ShareImage[] | null;
  /** The pictures of the projects on the Impact card, in order; null when there are none to show. */
  projectImages: Array<ShareImage | null> | null;
  /** The fonts and the background are loaded, so the preview can draw. */
  ready: boolean;
  /** The photo, the donors and their avatars have loaded or failed, or waited long enough. Files wait for this, so a quick tap never shares a picture with a plain circle where the photo goes. */
  settled: boolean;
  /** False once it is known that no donor may be named; see pickShareDonors. */
  donorsAvailable: boolean;
  /** Why donors can or cannot be named, and how many are public so far. Undefined while loading. */
  donorProgress: ShareDonorProgress | undefined;
} {
  const locale = useLocale();
  const t = useTranslations('Share');
  const origin = useOrigin();
  const headers = useShareHeaders();
  const photo = useSharePhoto(fundraiser.slug, headers);
  const { donors, progress: donorProgress } = useShareDonors(fundraiser);
  const background = useShareBackground(fundraiser, headers);
  const projectImages = useProjectImages(
    fundraiser,
    showProjects && card === 'impact',
    headers
  );

  const built = buildTheme(fundraiser.settings?.theme);
  const avatars = useShareAvatars(
    fundraiser.slug,
    donors,
    built.mode === 'dark',
    headers
  );
  // A look brings its own typefaces; every other style keeps the fundraiser page's.
  const lookFonts = SEASONS[season].fonts;
  const titleFontId = lookFonts?.title ?? built.titleFont;
  const bodyFontId = lookFonts?.body ?? built.bodyFont;
  const [titleFont, bodyFont] = useMemo(
    () =>
      typeof document === 'undefined'
        ? ['sans-serif', 'sans-serif']
        : [
            resolveBrowserFontFamily(titleFontId),
            resolveBrowserFontFamily(bodyFontId),
          ],
    [titleFontId, bodyFontId]
  );
  const fontsReady = useFontsReady([titleFont, bodyFont]);

  const theme: ShareRenderTheme = useMemo(
    () => ({
      accent: getAccentColor(built.accent),
      mode: built.mode,
      titleFont,
      bodyFont,
      season,
      card,
    }),
    [built.accent, built.mode, titleFont, bodyFont, season, card]
  );

  const data = useMemo(
    () =>
      buildShareRenderData({
        fundraiser,
        locale,
        donors: showDonors ? (donors ?? null) : null,
        cta,
        url: origin
          ? displayUrl(origin, fundraiser.slug)
          : `/raise/${fundraiser.slug}`,
        labels: {
          byLine: name => t('image.byLine', { name }),
          raisedOf: (raised, goal) => t('image.raisedOf', { raised, goal }),
          raised: raised => t('image.raised', { raised }),
          given: (first, second, others) =>
            t('image.given', { first, second, others }),
          goal: goal => t('image.goal', { goal }),
          started: () => t('image.started'),
          first: () => t('image.first'),
          newBadge: () => t('image.newBadge'),
          supporting: count => t('image.supporting', { count }),
          gift: (amount, frequency) => t(`image.gift.${frequency}`, { amount }),
        },
        gift,
        showGift,
        note,
        showAmounts,
        showHost,
        card,
        showProjects,
      }),
    [
      fundraiser,
      locale,
      donors,
      showDonors,
      cta,
      t,
      origin,
      gift,
      showGift,
      note,
      showAmounts,
      showHost,
      card,
      showProjects,
    ]
  );

  const timedOut = useSettleTimeout(fundraiser.slug);
  const settled =
    timedOut ||
    (photo !== undefined &&
      donors !== undefined &&
      (!showDonors || donors === null || avatars !== undefined) &&
      projectImages !== undefined);

  return {
    data,
    theme,
    photo: photo ?? null,
    background,
    // Off, the avatars stay out of the options, so their late arrival does not make the file again.
    avatars: showDonors ? (avatars ?? null) : null,
    // Still loading counts as none, so a late arrival makes the file again rather than blocking the preview.
    projectImages: projectImages ?? null,
    // The background is part of the look; wait for it like the fonts. The photo and avatars fill in the preview when they load.
    ready: fontsReady && background !== null,
    settled,
    donorsAvailable: donors !== null,
    donorProgress,
  };
}
