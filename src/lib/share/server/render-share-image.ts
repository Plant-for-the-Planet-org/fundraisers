import type { Fundraiser } from '@/lib/types/fundraiser';
import type { LeaderboardApiResponse } from '@/lib/types/leaderboard';

import { getTranslations } from 'next-intl/server';
import { createCanvas } from '@napi-rs/canvas';
import { buildTheme } from '@/lib/theme/build-theme';
import { SHARE_FORMATS } from '../formats';
import { createServerAssetLoader, serverMakePath } from './assets';
import { registerShareFonts } from './register-fonts';
import { drawShareBanner, prepareShareBanner } from './share-banner';

import 'server-only';

export interface RenderedShareImage {
  /** A JPEG, several times smaller than the same banner as a PNG, so apps that limit the size of a preview image (such as WhatsApp) still show it. */
  bytes: Buffer;
  /** False when a font or an image failed in a way that may pass on a later try, so the next render may look different. */
  complete: boolean;
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
): Promise<RenderedShareImage> {
  const theme = buildTheme(fundraiser.settings?.theme);
  let imageFailed = false;
  const loader = createServerAssetLoader(() => {
    imageFailed = true;
  });
  const [options, fontsLoaded] = await Promise.all([
    getTranslations({ locale, namespace: 'Share' }).then(t =>
      prepareShareBanner(fundraiser, {
        locale,
        origin,
        leaderboard,
        t,
        loader,
        makePath: serverMakePath,
      })
    ),
    registerShareFonts([theme.titleFont, theme.bodyFont]),
  ]);

  const { w, h } = SHARE_FORMATS.banner;
  const canvas = createCanvas(w, h);
  drawShareBanner(
    canvas.getContext('2d') as unknown as CanvasRenderingContext2D,
    options
  );
  return {
    bytes: await canvas.encode('jpeg', 85),
    complete: fontsLoaded && !imageFailed,
  };
}
