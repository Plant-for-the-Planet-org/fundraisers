import { describe, expect, it } from 'vitest';
import { getChannel } from './channels';
import { shareIntentUrl } from './intent';

const input = {
  link: 'https://x.test/raise/a?utm_source=s&b=1',
  text: 'Hi & bye',
};

describe('shareIntentUrl', () => {
  it('opens the Facebook sharer with the encoded link', () => {
    const url = shareIntentUrl(getChannel('facebookPost'), input);
    expect(url).toBe(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(input.link)}`
    );
  });

  it('has no web page for a Facebook Story', () => {
    expect(shareIntentUrl(getChannel('facebookStory'), input)).toBeNull();
  });

  it('opens LinkedIn and X with the link, and X with the text', () => {
    expect(shareIntentUrl(getChannel('linkedinPost'), input)).toContain(
      'linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fx.test'
    );
    const x = new URL(shareIntentUrl(getChannel('xPost'), input)!);
    expect(x.searchParams.get('text')).toBe(input.text);
    expect(x.searchParams.get('url')).toBe(input.link);
  });

  it('sends a WhatsApp message but not a Status', () => {
    const message = new URL(
      shareIntentUrl(getChannel('whatsappMessage'), input)!
    );
    expect(message.searchParams.get('text')).toBe(
      `${input.text}\n${input.link}`
    );
    expect(shareIntentUrl(getChannel('whatsappStatus'), input)).toBeNull();
  });

  it('has nothing for apps that only share from a phone', () => {
    for (const id of [
      'instagramStory',
      'instagramPost',
      'tiktokVideo',
      'youtubeShort',
    ] as const)
      expect(shareIntentUrl(getChannel(id), input)).toBeNull();
  });
});
