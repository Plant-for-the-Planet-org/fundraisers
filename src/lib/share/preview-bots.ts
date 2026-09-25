import { HTML_LIMITED_BOT_UA_RE } from 'next/dist/shared/lib/router/utils/html-bots';

// Link preview fetchers missing from Next's list. Each is a pattern part, matched anywhere in the user agent.
const EXTRA_PREVIEW_BOTS = [
  // Pinterestbot, and Pinterest/0.2 for rich pins. Not a bare "Pinterest", which the app's own browser also sends ("[Pinterest/iOS]").
  'Pinterestbot',
  'Pinterest/0\\.',
  // Every Mastodon server fetches previews itself, as "http.rb/5.2 (Mastodon/4.3; +https://<server>/)".
  'Mastodon',
  // Other Fediverse servers and Matrix (Element) homeservers, which also fetch previews themselves.
  'Misskey',
  'Pleroma',
  'Akkoma',
  'Synapse',
  'Viber',
  // Also matched by Next's Twitterbot, since its agent says "like TwitterBot"; listed so it does not depend on that.
  'TelegramBot',
  // Bluesky's card fetcher, "Bluesky Cardyb/1.1".
  'Bluesky',
  'Snap URL Preview',
  // Teams and Outlook.
  'MicrosoftPreview',
  'XING-contenttabreceiver',
  'Mattermost',
  // KakaoTalk, which does not always send facebookexternalhit with it.
  'kakaotalk-scrap',
  // Embed services behind many apps and sites.
  'Embedly',
  'Iframely',
];

/**
 * User agents that read only the HTML, so Next must put the metadata in `<head>` instead of streaming it into `<body>` (`htmlLimitedBots` in next.config.ts).
 * That setting replaces Next's own list, so this starts from it: `HTML_LIMITED_BOT_UA_RE` in next/dist/shared/lib/router/utils/html-bots.js, imported so it follows Next upgrades.
 * Next reads only the pattern's source and always matches without case.
 */
export const LINK_PREVIEW_BOTS = new RegExp(
  [HTML_LIMITED_BOT_UA_RE.source, ...EXTRA_PREVIEW_BOTS].join('|'),
  'i'
);
