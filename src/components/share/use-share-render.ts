'use client';

import type { SeasonId } from '@/lib/share/render/seasons';
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
import {
  getActiveImpersonation,
  impersonationHeaders,
} from '@/lib/api/platform-fetch';
import { projectsService } from '@/lib/api/projects-service';
import {
  resolveBrowserFontFamily,
  SHARE_FONT_WEIGHTS,
} from '@/lib/share/fonts';
import { displayUrl } from '@/lib/share/links';
import { buildShareRenderData, pickShareDonors } from '@/lib/share/share-data';
import { getAccentColor } from '@/lib/theme/accent-utils';
import { buildTheme } from '@/lib/theme/build-theme';
import { useAuthStore } from '@/stores/auth-store';

/**
 * The fundraiser's cover photo, loaded through our own route so the canvas stays exportable.
 * Drafts are only visible to their hosts, so the token and any impersonation go along.
 */
function useSharePhoto(slug: string): ShareImage | null {
  const token = useAuthStore(state => state.accessToken);
  const [photo, setPhoto] = useState<{
    slug: string;
    image: ShareImage;
  } | null>(null);

  useEffect(() => {
    let url: string | null = null;
    let ignore = false;
    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...impersonationHeaders(getActiveImpersonation()),
    };
    fetch(`/api/share/photo/${encodeURIComponent(slug)}`, { headers })
      .then(response => (response.ok ? response.blob() : null))
      .then(blob => {
        if (!blob || ignore) return;
        url = URL.createObjectURL(blob);
        const image = new Image();
        image.onload = () => {
          if (!ignore) setPhoto({ slug, image });
        };
        image.src = url;
      })
      .catch(() => {
        // No photo: the ring shows a plain circle.
      });
    return () => {
      ignore = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [slug, token]);

  return photo?.slug === slug ? photo.image : null;
}

/** Public donors for the avatar row, by the public page's rules. */
function useShareDonors(fundraiser: Fundraiser): ShareDonors | null {
  const [donors, setDonors] = useState<{
    slug: string;
    value: ShareDonors | null;
  } | null>(null);
  useEffect(() => {
    let ignore = false;
    getLeaderboard(fundraiser.slug, 10)
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
  return donors?.slug === fundraiser.slug ? donors.value : null;
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
  ready: boolean;
} {
  const locale = useLocale();
  const t = useTranslations('Share');
  const origin = useOrigin();
  const photo = useSharePhoto(fundraiser.slug);
  const donors = useShareDonors(fundraiser);

  const built = buildTheme(fundraiser.settings?.theme);
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
        donors: showDonors ? donors : null,
        cta,
        url: origin
          ? displayUrl(origin, fundraiser.slug)
          : `/raise/${fundraiser.slug}`,
        labels: {
          byLine: name => t('image.byLine', { name }),
          raisedOf: (raised, goal) => t('image.raisedOf', { raised, goal }),
          raised: raised => t('image.raised', { raised }),
          joined: (first, second, others) =>
            t('image.joined', { first, second, others }),
        },
      }),
    [fundraiser, locale, donors, showDonors, cta, t, origin]
  );

  return { data, theme, photo, ready: fontsReady };
}
