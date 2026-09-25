import type { Fundraiser } from '@/lib/types/fundraiser';
import type { LeaderboardApiResponse } from '@/lib/types/leaderboard';
import type { ShareImage } from '../render/types';

import { getTranslations } from 'next-intl/server';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { getAccentColor } from '@/lib/theme/accent-utils';
import { buildTheme } from '@/lib/theme/build-theme';
import { resolveFundraiserImageSource } from '@/lib/utils/images';
import { SHARE_FONTS } from '../fonts';
import { SHARE_FORMATS, SHARE_VIDEO_SECONDS } from '../formats';
import { displayUrl } from '../links';
import { drawShareFrame } from '../render/draw-share-frame';
import { buildShareRenderData, pickShareDonors } from '../share-data';
import { registerShareFonts } from './register-fonts';

import 'server-only';

async function loadPhoto(image: string | null): Promise<ShareImage | null> {
  const src = resolveFundraiserImageSource(image, 'large');
  if (!src) return null;
  try {
    const response = await fetch(src, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    return await loadImage(Buffer.from(await response.arrayBuffer()));
  } catch {
    // A missing photo leaves a plain circle rather than failing the preview.
    return null;
  }
}

/**
 * The fundraiser's link preview: the 1.91:1 banner, in its theme, with live progress.
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
  const [t, photo] = await Promise.all([
    getTranslations({ locale, namespace: 'Share' }),
    loadPhoto(fundraiser.image),
    registerShareFonts([theme.titleFont, theme.bodyFont]),
  ]);

  const data = buildShareRenderData({
    fundraiser,
    locale,
    donors: pickShareDonors(fundraiser, leaderboard),
    cta: t('cta.joinMe'),
    url: displayUrl(origin, fundraiser.slug),
    labels: {
      byLine: name => t('image.byLine', { name }),
      raisedOf: (raised, goal) => t('image.raisedOf', { raised, goal }),
      raised: raised => t('image.raised', { raised }),
      joined: (first, second, others) =>
        t('image.joined', { first, second, others }),
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
    }
  );
  return canvas.encode('png');
}
