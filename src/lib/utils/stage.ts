/**
 * Stage Mode (TV/projector display) helpers.
 */

import type { FundraiserUrlData } from './fundraiser';

import { getFundraiserUrl } from './fundraiser';

/** Path to a fundraiser's Stage Mode view, e.g. `/raise/my-slug/stage`. */
export function getStageUrl(fundraiser: FundraiserUrlData): string {
  return `${getFundraiserUrl(fundraiser)}/stage`;
}

/**
 * Open Stage Mode in a separate, centered 16:9 window sized to fit the screen
 * (capped at 1600px wide). Must be called from a user gesture (e.g. a click) so
 * the popup is not blocked.
 */
export function openStageWindow(fundraiser: FundraiserUrlData): void {
  const { availWidth, availHeight } = window.screen;

  let width = Math.min(1600, availWidth * 0.9);
  let height = (width * 9) / 16;
  if (height > availHeight * 0.9) {
    height = availHeight * 0.9;
    width = (height * 16) / 9;
  }
  width = Math.round(width);
  height = Math.round(height);

  const left = Math.round((availWidth - width) / 2);
  const top = Math.round((availHeight - height) / 2);

  window.open(
    getStageUrl(fundraiser),
    '_blank',
    `width=${width},height=${height},left=${left},top=${top},noopener,noreferrer`
  );
}
