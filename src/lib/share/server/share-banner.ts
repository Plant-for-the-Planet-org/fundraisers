import type { getTranslations } from 'next-intl/server';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { LeaderboardApiResponse } from '@/lib/types/leaderboard';
import type { ShareAssetLoader } from '../render/theme-background';
import type { Ctx, ShareImage, ShareRenderOptions } from '../render/types';
import type { ShareLabels } from '../share-data';

import { getAccentColor } from '@/lib/theme/accent-utils';
import { buildTheme } from '@/lib/theme/build-theme';
import { hasFundraiserConcluded } from '@/lib/utils/fundraiser';
import { getImageUrl, resolveFundraiserImageSource } from '@/lib/utils/images';
import { SHARE_FONTS } from '../fonts';
import { SHARE_VIDEO_SECONDS } from '../formats';
import { displayUrl } from '../links';
import { loadShareAvatars } from '../render/avatars';
import { drawShareFrame } from '../render/draw-share-frame';
import {
  loadShareBackgroundAssets,
  resolveShareBackground,
} from '../render/theme-background';
import { buildShareRenderData, pickShareDonors } from '../share-data';

import 'server-only';

export type ShareTranslator = Awaited<
  ReturnType<typeof getTranslations<'Share'>>
>;

async function loadPhoto(
  image: string | null,
  loader: ShareAssetLoader
): Promise<ShareImage | null> {
  const src = resolveFundraiserImageSource(image, 'large');
  if (!src) return null;
  // A missing photo leaves a plain circle rather than failing the preview.
  return loader.loadImage(src).catch(() => null);
}

/** Every text the banner can print, in the translator's locale. The design guard prints each one, so wording in a branch its samples never draw still counts. */
export function shareBannerLabels(
  t: ShareTranslator
): ShareLabels & { cta: (concluded: boolean) => string } {
  return {
    byLine: name => t('image.byLine', { name }),
    raisedOf: (raised, goal) => t('image.raisedOf', { raised, goal }),
    raised: raised => t('image.raised', { raised }),
    given: (first, second, others) =>
      t('image.given', { first, second, others }),
    goal: goal => t('image.goal', { goal }),
    started: () => t('image.started'),
    first: () => t('image.first'),
    newBadge: () => t('image.newBadge'),
    cta: concluded => t(concluded ? 'cta.thankYou' : 'cta.joinMe'),
  };
}

/**
 * Everything the link preview banner draws: the text in the fundraiser's locale, its theme, photo, background and donors.
 * The server render and the design guard (`share-banner.test.ts`) both build it here, so the guard checks what crawlers get.
 */
export async function prepareShareBanner(
  fundraiser: Fundraiser,
  {
    locale,
    origin,
    leaderboard,
    t,
    loader,
    makePath,
  }: {
    locale: string;
    origin: string;
    leaderboard: LeaderboardApiResponse | null;
    t: ShareTranslator;
    loader: ShareAssetLoader;
    makePath: (d: string) => Path2D;
  }
): Promise<ShareRenderOptions> {
  const theme = buildTheme(fundraiser.settings?.theme);
  const dark = theme.mode === 'dark';
  const spec = resolveShareBackground(theme);
  const donors = pickShareDonors(fundraiser, leaderboard);
  const [photo, backgroundAssets, avatars] = await Promise.all([
    loadPhoto(fundraiser.image, loader),
    loadShareBackgroundAssets(spec, loader),
    donors
      ? loadShareAvatars(
          donors.people.map(person => ({
            seed: person.seed,
            photo: person.avatarFile
              ? getImageUrl('profile', 'thumb', person.avatarFile)
              : null,
          })),
          { loader, makePath, dark }
        )
      : Promise.resolve([]),
  ]);

  const { cta, ...labels } = shareBannerLabels(t);
  const data = buildShareRenderData({
    fundraiser,
    locale,
    donors,
    cta: cta(hasFundraiserConcluded(fundraiser)),
    url: displayUrl(origin, fundraiser.slug),
    labels,
  });

  return {
    format: 'banner',
    data,
    theme: {
      accent: getAccentColor(theme.accent),
      mode: theme.mode,
      titleFont: SHARE_FONTS[theme.titleFont].family,
      bodyFont: SHARE_FONTS[theme.bodyFont].family,
      season: 'none',
    },
    photo,
    background: { spec, assets: backgroundAssets },
    avatars,
  };
}

/** The banner is a still: the video's last frame, after everything has landed. */
export function drawShareBanner(g: Ctx, options: ShareRenderOptions) {
  drawShareFrame(g, SHARE_VIDEO_SECONDS, options);
}
