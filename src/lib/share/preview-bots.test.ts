import { HTML_LIMITED_BOT_UA_RE } from 'next/dist/shared/lib/router/utils/html-bots';
import { describe, expect, it } from 'vitest';
import { LINK_PREVIEW_BOTS } from './preview-bots';

// Next rebuilds the pattern from its source with the `i` flag, so test it the same way.
const served = (userAgent: string) =>
  new RegExp(LINK_PREVIEW_BOTS.source, 'i').test(userAgent);

describe('LINK_PREVIEW_BOTS', () => {
  it("keeps all of Next's own list", () => {
    expect(
      LINK_PREVIEW_BOTS.source.startsWith(HTML_LIMITED_BOT_UA_RE.source)
    ).toBe(true);
    for (const agent of [
      'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
      'WhatsApp/2.23.20.0',
      'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
      'Twitterbot/1.0',
      'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
    ]) {
      expect(served(agent), agent).toBe(true);
    }
  });

  it.each([
    'Pinterest/0.2 (+https://www.pinterest.com/bot.html)',
    'Mozilla/5.0 (compatible; Pinterestbot/1.0; +http://www.pinterest.com/bot.html)',
    'http.rb/5.2.0 (Mastodon/4.3.2; +https://mastodon.social/)',
    'Misskey/2024.8.0 (https://misskey.io)',
    'Pleroma 2.6.2; https://pleroma.example <admin@pleroma.example>',
    'Akkoma 3.13.2; https://akkoma.example <admin@akkoma.example>',
    'Synapse (bot; +https://github.com/matrix-org/synapse)',
    'Viber/19.0 (Android)',
    'TelegramBot (like TwitterBot)',
    'Mozilla/5.0 (compatible; Bluesky Cardyb/1.1; +mailto:support@bsky.app)',
    'Snap URL Preview Service; bot; snapchat.com',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MicrosoftPreview/2.0 +https://aka.ms/MicrosoftPreview',
    'XING-contenttabreceiver/2.0',
    'Mattermost-Bot/1.1',
    'kakaotalk-scrap/1.0; +https://devtalk.kakao.com/t/scrap/33984',
    'Mozilla/5.0 (compatible; Embedly/0.2; +http://support.embed.ly/)',
    'Iframely/1.3.1 (+https://iframely.com/docs/about)',
  ])('adds %s', agent => {
    expect(served(agent)).toBe(true);
  });

  it('leaves normal browsers on streamed metadata', () => {
    expect(
      served(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
      )
    ).toBe(false);
    expect(
      served(
        'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36'
      )
    ).toBe(false);
  });

  it("leaves the Pinterest app's own browser on streamed metadata", () => {
    expect(
      served(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [Pinterest/iOS]'
      )
    ).toBe(false);
  });
});
