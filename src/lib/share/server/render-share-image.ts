import type { Fundraiser } from '@/lib/types/fundraiser';
import type { LeaderboardApiResponse } from '@/lib/types/leaderboard';
import type { ShareImage } from '../render/types';

import { getTranslations } from 'next-intl/server';
import { createCanvas } from '@napi-rs/canvas';
import { getAccentColor } from '@/lib/theme/accent-utils';
import { buildTheme } from '@/lib/theme/build-theme';
import { hasFundraiserConcluded } from '@/lib/utils/fundraiser';
import { getImageUrl, resolveFundraiserImageSource } from '@/lib/utils/images';
import { SHARE_FONTS } from '../fonts';
import { SHARE_FORMATS, SHARE_VIDEO_SECONDS } from '../formats';
import { displayUrl } from '../links';
import { loadShareAvatars } from '../render/avatars';
import { drawShareFrame } from '../render/draw-share-frame';
import {
  loadShareBackgroundAssets,
  resolveShareBackground,
} from '../render/theme-background';
import { buildShareRenderData, pickShareDonors } from '../share-data';
import { serverAssetLoader, serverMakePath } from './assets';
import { registerShareFonts } from './register-fonts';

import 'server-only';

async function loadPhoto(image: string | null): Promise<ShareImage | null> {
  const src = resolveFundraiserImageSource(image, 'large');
  if (!src) return null;
  // A missing photo leaves a plain circle rather than failing the preview.
  return serverAssetLoader.loadImage(src).catch(() => null);
}

/**
 * The fundraiser's link preview: the 1.91:1 banner, on its page's background, with live progress.
 * Drawn by the same code as the share files, so the preview and the shared images match.
 */
export async function renderFundraiserShareImage(
  fundraiser: Fundraiser,
  {
    locale,
    origin,
    leaderboard,
  }: {
    locale: string;
    origin: string;
    leaderboard: LeaderboardApiResponse | null;
  }
): Promise<Buffer> {
  const theme = buildTheme(fundraiser.settings?.theme);
  const dark = theme.mode === 'dark';
  const spec = resolveShareBackground(theme);
  const donors = pickShareDonors(fundraiser, leaderboard);
  const [t, photo, backgroundAssets, avatars] = await Promise.all([
    getTranslations({ locale, namespace: 'Share' }),
    loadPhoto(fundraiser.image),
    loadShareBackgroundAssets(spec, serverAssetLoader),
    donors
      ? loadShareAvatars(
          donors.people.map(person => ({
            seed: person.seed,
            photo: person.avatarFile
              ? getImageUrl('profile', 'thumb', person.avatarFile)
              : null,
          })),
          { loader: serverAssetLoader, makePath: serverMakePath, dark }
        )
      : Promise.resolve([]),
    registerShareFonts([theme.titleFont, theme.bodyFont]),
  ]);

  const concluded = hasFundraiserConcluded(fundraiser);

  const data = buildShareRenderData({
    fundraiser,
    locale,
    donors,
    cta: t(concluded ? 'cta.thankYou' : 'cta.joinMe'),
    url: displayUrl(origin, fundraiser.slug),
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
  });

  const { w, h } = SHARE_FORMATS.banner;
  const canvas = createCanvas(w, h);
  drawShareFrame(
    canvas.getContext('2d') as unknown as CanvasRenderingContext2D,
    SHARE_VIDEO_SECONDS,
    {
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
    }
  );
  return canvas.encode('png');
}
