import type { ShareKind } from './channels';
import type { ShareFormatId } from './formats';

import { SHARE_FORMATS } from './formats';

/**
 * The name of a share file, such as `klumforest_story_1080x1920_2x.png`.
 * The size is the format's own; `scale` is how much larger the file was drawn, and a scale of 1 adds nothing.
 */
export function shareFileName({
  slug,
  format,
  kind,
  scale = 1,
}: {
  slug: string;
  format: ShareFormatId;
  kind: ShareKind;
  scale?: number;
}): string {
  const { w, h } = SHARE_FORMATS[format];
  const scaled = scale === 1 ? '' : `_${scale}x`;
  const extension = kind === 'video' ? 'mp4' : 'png';
  return `${slug}_${format}_${w}x${h}${scaled}.${extension}`;
}

/** The name of the zip with every share file. */
export function shareKitFileName(slug: string): string {
  return `${slug}_share-images.zip`;
}
