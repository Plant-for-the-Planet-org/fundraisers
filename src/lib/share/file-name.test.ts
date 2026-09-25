import { describe, expect, it } from 'vitest';
import { shareFileName, shareKitFileName } from './file-name';
import { SHARE_FORMATS } from './formats';

describe('shareFileName', () => {
  it('names an image by its format, its size and its scale', () => {
    expect(
      shareFileName({
        slug: 'klumforest',
        format: 'story',
        kind: 'image',
        scale: 2,
      })
    ).toBe('klumforest_story_1080x1920_2x.png');
    expect(
      shareFileName({
        slug: 'klumforest',
        format: 'post',
        kind: 'image',
        scale: 2,
      })
    ).toBe('klumforest_post_1080x1350_2x.png');
    expect(
      shareFileName({
        slug: 'klumforest',
        format: 'banner',
        kind: 'image',
        scale: 2,
      })
    ).toBe('klumforest_banner_1200x630_2x.png');
  });

  it('leaves the scale out at 1', () => {
    expect(
      shareFileName({
        slug: 'klumforest',
        format: 'wide',
        kind: 'image',
        scale: 1,
      })
    ).toBe('klumforest_wide_1200x676.png');
  });

  it('names a video at the format size', () => {
    expect(
      shareFileName({ slug: 'klumforest', format: 'story', kind: 'video' })
    ).toBe('klumforest_story_1080x1920.mp4');
    expect(
      shareFileName({ slug: 'klumforest', format: 'tiktok', kind: 'video' })
    ).toBe('klumforest_tiktok_1080x1920.mp4');
  });

  it('follows the format table, so a new size renames the file', () => {
    for (const [format, { w, h }] of Object.entries(SHARE_FORMATS)) {
      expect(
        shareFileName({
          slug: 'a-b',
          format: format as keyof typeof SHARE_FORMATS,
          kind: 'image',
          scale: 3,
        })
      ).toBe(`a-b_${format}_${w}x${h}_3x.png`);
    }
  });
});

describe('shareKitFileName', () => {
  it('names the zip after the fundraiser', () => {
    expect(shareKitFileName('klumforest')).toBe('klumforest_share-images.zip');
  });
});
