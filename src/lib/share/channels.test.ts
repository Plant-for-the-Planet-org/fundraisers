import { describe, expect, it } from 'vitest';
import { SHARE_CHANNELS } from './channels';
import { SHARE_FORMATS } from './formats';

describe('SHARE_CHANNELS', () => {
  it('makes every video at an even width and height, which H.264 needs', () => {
    const videos = SHARE_CHANNELS.filter(channel =>
      (channel.kinds as readonly string[]).includes('video')
    );

    expect(videos.length).toBeGreaterThan(0);
    for (const channel of videos) {
      const { w, h } = SHARE_FORMATS[channel.format];
      expect(w % 2, `${channel.id} width`).toBe(0);
      expect(h % 2, `${channel.id} height`).toBe(0);
    }
  });

  it('tags every link with lowercase snake_case tokens, as docs/naming.md asks', () => {
    for (const channel of SHARE_CHANNELS) {
      expect(channel.utm.source, channel.id).toMatch(/^[a-z]+(_[a-z]+)*$/);
      expect(channel.utm.medium, channel.id).toMatch(/^[a-z]+(_[a-z]+)*$/);
    }
  });

  it('keeps a tip for after a working copy on every story format, whose link goes somewhere other than the text', () => {
    for (const channel of SHARE_CHANNELS) {
      if (['story', 'tiktok', 'shorts'].includes(channel.format))
        expect('tipOnlyIfCopyFails' in channel, channel.id).toBe(false);
    }
  });

  it('tags the Newsletter tile like the Share tab link of the same name', () => {
    const newsletter = SHARE_CHANNELS.find(
      channel => channel.id === 'newsletter'
    );
    expect(newsletter?.utm).toEqual({ source: 'newsletter', medium: 'email' });
  });
});
