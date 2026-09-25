'use client';

import type { SeasonId } from '@/lib/share/render/seasons';
import type { ShareBackground } from '@/lib/share/render/theme-background';
import type {
  ShareImage,
  ShareRenderData,
  ShareRenderTheme,
} from '@/lib/share/render/types';
import type { ShareDonors } from '@/lib/share/share-data';
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
import {
  loadShareBackgroundAssets,
  resolveShareBackground,
} from '@/lib/share/render/theme-background';
import { buildShareRenderData, pickShareDonors } from '@/lib/share/share-data';
import { getAccentColor } from '@/lib/theme/accent-utils';
import { buildTheme } from '@/lib/theme/build-theme';
import { useAuthStore } from '@/stores/auth-store';
import { useImpersonationStore } from '@/stores/impersonation-store';
import {
  browserAssetLoader,
  browserMakePath,
  fetchImage,
} from './browser-assets';

/**
 * The fundraiser's cover photo, loaded through our own route so the canvas stays exportable.
 * Drafts are only visible to their hosts, so the token and any impersonation go along.
 */
function useSharePhoto(
  slug: string,
  headers: Record<string, string>
): ShareImage | null {
  const [photo, setPhoto] = useState<{
    slug: string;
    image: ShareImage;
  } | null>(null);

  useEffect(() => {
    let ignore = false;
    // No photo leaves the ring's circle plain.
    fetchImage(`/api/share/photo/${encodeURIComponent(slug)}`, headers).then(
      image => {
        if (image && !ignore) setPhoto({ slug, image });
      }
    );
    return () => {
      ignore = true;
    };
  }, [slug, headers]);

  return photo?.slug === slug ? photo.image : null;
}

/** Public donors for the avatar row, by the public page's rules. */
function useShareDonors(
  fundraiser: Fundraiser
): ShareDonors | null | undefined {
  const [donors, setDonors] = useState<{
    slug: string;
    value: ShareDonors | null;
  } | null>(null);
  useEffect(() => {
    let ignore = false;
    getLeaderboard(fundraiser.slug, 20)
      .then(board => {
        if (!ignore)
          setDonors({
            slug: fundraiser.slug,
            value: pickShareDonors(fundraiser, board),
          });
      })
      .catch(() => {
        if (!ignore) setDonors({ slug: fundraiser.slug, value: null });
      });
    return () => {
      ignore = true;
    };
  }, [fundraiser]);
  // Undefined while loading, null when no donor may be named.
  return donors?.slug === fundraiser.slug ? donors.value : undefined;
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

/** Each named donor's photo, or the app's generated avatar, in the order of `donors.names`. */
function useShareAvatars(
  slug: string,
  donors: ShareDonors | null | undefined,
  dark: boolean,
  headers: Record<string, string>
): ShareImage[] | null {
  const [avatars, setAvatars] = useState<{
    donors: ShareDonors;
    dark: boolean;
    images: ShareImage[];
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
        loader: browserAssetLoader(slug, headers),
        makePath: browserMakePath,
        dark,
      }
    )
      .then(images => {
        if (!ignore) setAvatars({ donors, dark, images });
      })
      // The row keeps its initials when the avatars cannot be made.
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, [slug, donors, dark, headers]);
  return avatars && avatars.donors === donors && avatars.dark === dark
    ? avatars.images
    : null;
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

/** The site origin, known only in the browser. Until then links are relative. */
export function useOrigin(): string {
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);
  return origin;
}

/** Everything the share renderer needs for this fundraiser, updated as the choices change. */
export function useShareRender({
  fundraiser,
  season,
  cta,
  showDonors,
}: {
  fundraiser: Fundraiser;
  season: SeasonId;
  cta: string;
  showDonors: boolean;
}): {
  data: ShareRenderData;
  theme: ShareRenderTheme;
  photo: ShareImage | null;
  background: ShareBackground | null;
  avatars: ShareImage[] | null;
  ready: boolean;
  /** False once it is known that no donor may be named; see pickShareDonors. */
  donorsAvailable: boolean;
} {
  const locale = useLocale();
  const t = useTranslations('Share');
  const origin = useOrigin();
  const headers = useShareHeaders();
  const photo = useSharePhoto(fundraiser.slug, headers);
  const donors = useShareDonors(fundraiser);
  const background = useShareBackground(fundraiser, headers);

  const built = buildTheme(fundraiser.settings?.theme);
  const avatars = useShareAvatars(
    fundraiser.slug,
    donors,
    built.mode === 'dark',
    headers
  );
  const [titleFont, bodyFont] = useMemo(
    () =>
      typeof document === 'undefined'
        ? ['sans-serif', 'sans-serif']
        : [
            resolveBrowserFontFamily(built.titleFont),
            resolveBrowserFontFamily(built.bodyFont),
          ],
    [built.titleFont, built.bodyFont]
  );
  const fontsReady = useFontsReady([titleFont, bodyFont]);

  const theme: ShareRenderTheme = useMemo(
    () => ({
      accent: getAccentColor(built.accent),
      mode: built.mode,
      titleFont,
      bodyFont,
      season,
    }),
    [built.accent, built.mode, titleFont, bodyFont, season]
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
        },
      }),
    [fundraiser, locale, donors, showDonors, cta, t, origin]
  );

  return {
    data,
    theme,
    photo,
    background,
    avatars,
    // The background is part of the look; wait for it like the fonts. Avatars fill in when they load.
    ready: fontsReady && background !== null,
    donorsAvailable: donors !== null,
  };
}
