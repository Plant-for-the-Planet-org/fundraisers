/** Where the content may sit, in canvas pixels. Everything outside it can be covered by the app's own buttons or cropped. */
export interface ShareZone {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Base sizes for one format. Tight zones shrink them; see the stack layout. */
export interface ShareSizes {
  gauge: number;
  title: number;
  by: number;
  raised: number;
  avatar: number;
  avatarText: number;
  cta: number;
  ctaFont: number;
  url: number;
}

export interface ShareFormat {
  w: number;
  h: number;
  /** `stack`: one centred column. `split`: the ring on the left, the text on the right. */
  layout: 'stack' | 'split';
  zone: ShareZone;
  size: ShareSizes;
}

const TALL_SIZES: ShareSizes = {
  gauge: 640,
  title: 72,
  by: 40,
  raised: 38,
  avatar: 84,
  avatarText: 32,
  cta: 104,
  ctaFont: 44,
  url: 30,
};

export const SHARE_FORMATS = {
  // Instagram, Facebook and WhatsApp cover about 250px at the top (profile, progress bars) and the bottom (reply bar).
  story: {
    w: 1080,
    h: 1920,
    layout: 'stack',
    zone: { x: 65, y: 250, w: 950, h: 1420 },
    size: TALL_SIZES,
  },
  // TikTok covers the bottom with the caption and the right with its buttons. The zone narrows on both sides so the column stays centred.
  tiktok: {
    w: 1080,
    h: 1920,
    layout: 'stack',
    zone: { x: 150, y: 140, w: 780, h: 1380 },
    size: TALL_SIZES,
  },
  // YouTube Shorts has the tightest overlay: search at the top, channel and description at the bottom, buttons on the right.
  shorts: {
    w: 1080,
    h: 1920,
    layout: 'stack',
    zone: { x: 120, y: 380, w: 840, h: 1160 },
    size: TALL_SIZES,
  },
  // 4:5 feed post. The Instagram grid crops it to 3:4, trimming about 34px on each side.
  post: {
    w: 1080,
    h: 1350,
    layout: 'stack',
    zone: { x: 60, y: 70, w: 960, h: 1210 },
    size: {
      gauge: 484,
      title: 60,
      by: 32,
      raised: 32,
      avatar: 66,
      avatarText: 27,
      cta: 88,
      ctaFont: 36,
      url: 25,
    },
  },
  // 1.91:1, the link preview size for WhatsApp, LinkedIn, Facebook and email.
  banner: {
    w: 1200,
    h: 630,
    layout: 'split',
    zone: { x: 60, y: 40, w: 1080, h: 550 },
    size: {
      gauge: 480,
      title: 46,
      by: 26,
      raised: 28,
      avatar: 48,
      avatarText: 21,
      cta: 72,
      ctaFont: 28,
      url: 21,
    },
  },
  // 16:9 image in the X feed.
  wide: {
    w: 1200,
    h: 675,
    layout: 'split',
    zone: { x: 60, y: 50, w: 1080, h: 575 },
    size: {
      gauge: 500,
      title: 44,
      by: 26,
      raised: 28,
      avatar: 50,
      avatarText: 22,
      cta: 74,
      ctaFont: 29,
      url: 22,
    },
  },
} as const satisfies Record<string, ShareFormat>;

export type ShareFormatId = keyof typeof SHARE_FORMATS;

/** Length of every share video, in seconds. The animation lands by about 3.4 s; the rest holds so the story is read before it moves on. */
export const SHARE_VIDEO_SECONDS = 8;
export const SHARE_VIDEO_FPS = 30;
