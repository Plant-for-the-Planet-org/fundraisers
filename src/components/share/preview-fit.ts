import type { CSSProperties } from 'react';

/** Side by side, what the preview column holds besides the preview: the Video or Image switch, the size line and up to two buttons, with their gaps. */
const PREVIEW_COLUMN_EXTRAS = '10.5rem';

/**
 * Props for the donor preview's wrapper. Side by side (the studio's `@2xl` container), it caps the width so the frame is no taller than the room `fitHeight` leaves.
 * `aspect` is the format's width over its height.
 */
export function previewFitProps(
  fitHeight: string | undefined,
  aspect: number
): { className: string; style?: CSSProperties } {
  if (!fitHeight) return { className: 'flex w-full justify-center' };
  return {
    className: 'flex w-full justify-center @2xl:max-w-(--share-preview-fit)',
    style: {
      '--share-preview-fit': `max(8rem, calc((${fitHeight} - ${PREVIEW_COLUMN_EXTRAS}) * ${aspect}))`,
    } as CSSProperties,
  };
}
