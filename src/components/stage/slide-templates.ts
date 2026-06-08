// Ready-made single-slide templates for Stage Mode. A user picks one to seed a
// slide, then edits the copy and swaps the image. Content lives here (en/de
// inline) rather than in the i18n json, mirroring the thank-you note presets in
// `thank-you-note/constants.ts`.
//
// Images are Unsplash placeholders (images.unsplash.com is whitelisted in
// `fundraiser-form-schema.ts`). They are meant to be replaced by the user.
//
// Keep `title` <= STAGE_LIMITS.slideTitle (60) and `description` <=
// STAGE_LIMITS.slideDescription (160).

export interface StageSlideTemplate {
  id: string;
  title: string;
  description: string;
  /** Unsplash placeholder URL — https, satisfies the slide image schema. */
  image: string;
  /** Display duration in seconds (1-60). */
  duration: number;
}

const UNSPLASH = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1600&q=80`;

export const STAGE_SLIDE_TEMPLATES: Record<'en' | 'de', StageSlideTemplate[]> =
  {
    en: [
      {
        id: 'welcome',
        title: 'Welcome',
        description:
          'Thanks for being here tonight. Together we can make a real difference for our planet.',
        image: UNSPLASH('photo-1540575467063-178a50c2df87'),
        duration: 8,
      },
      {
        id: 'why-it-matters',
        title: 'Why it matters',
        description:
          'Every year we lose forests we cannot replace. Your gift helps protect and restore them.',
        image: UNSPLASH('photo-1542601906990-b4d3fb778b09'),
        duration: 10,
      },
      {
        id: 'your-impact',
        title: 'Your impact',
        description:
          'Every donation plants trees, restores land, and supports the people who care for it.',
        image: UNSPLASH('photo-1416879595882-3373a0480b5b'),
        duration: 10,
      },
      {
        id: 'scan-to-give',
        title: 'Scan to give',
        description:
          'Point your phone at the QR code on screen to donate in seconds. Every gift counts.',
        image: UNSPLASH('photo-1469474968028-56623f02e42e'),
        duration: 12,
      },
      {
        id: 'thank-you',
        title: 'Thank you',
        description:
          'Your generosity means the world. Together we are growing a greener future.',
        image: UNSPLASH('photo-1441974231531-c6227db76b6e'),
        duration: 8,
      },
    ],
    de: [
      {
        id: 'welcome',
        title: 'Willkommen',
        description:
          'Schön, dass du hier bist. Gemeinsam können wir wirklich etwas für unseren Planeten bewegen.',
        image: UNSPLASH('photo-1540575467063-178a50c2df87'),
        duration: 8,
      },
      {
        id: 'why-it-matters',
        title: 'Darum geht es',
        description:
          'Jedes Jahr verlieren wir Wälder, die wir nicht ersetzen können. Deine Spende hilft, sie zu schützen.',
        image: UNSPLASH('photo-1542601906990-b4d3fb778b09'),
        duration: 10,
      },
      {
        id: 'your-impact',
        title: 'Deine Wirkung',
        description:
          'Jede Spende pflanzt Bäume, stellt Land wieder her und unterstützt die Menschen vor Ort.',
        image: UNSPLASH('photo-1416879595882-3373a0480b5b'),
        duration: 10,
      },
      {
        id: 'scan-to-give',
        title: 'Jetzt spenden',
        description:
          'Richte dein Handy auf den QR-Code auf dem Bildschirm und spende in Sekunden. Jede Gabe zählt.',
        image: UNSPLASH('photo-1469474968028-56623f02e42e'),
        duration: 12,
      },
      {
        id: 'thank-you',
        title: 'Danke',
        description:
          'Deine Großzügigkeit bedeutet uns alles. Gemeinsam lassen wir eine grünere Zukunft wachsen.',
        image: UNSPLASH('photo-1441974231531-c6227db76b6e'),
        duration: 8,
      },
    ],
  };
