import type { Fundraiser } from '@/lib/types/fundraiser';

import { getRichTextTextContent } from '@/lib/utils/rich-text';

export type ShareTextSource = 'goal' | 'description' | 'combined';

/**
 * Single switch controlling what the native share `text` AND the page's
 * OpenGraph/Twitter `description` say — the share sheet and the link-preview
 * card always change together. Variants:
 *
 *  - `goal`        — "Help reach €10,000".
 *  - `description` — the fundraiser's own description.
 *  - `combined`    — "<description> · Help reach €10,000".
 */
export const SHARE_TEXT_SOURCE: ShareTextSource = 'combined';

/** Separator between the description and goal in the `combined` variant. */
const COMBINED_SEPARATOR = ' · ';

const MAX_SHARE_TEXT_LENGTH = 200;

/**
 * Plain-text, word-boundary-truncated version of a rich-text description.
 * Returns `undefined` when the description is empty.
 *
 * (Extracted from the fundraiser page metadata so the share text and the OG
 * description share one truncation implementation.)
 */
export function getShareDescription(
  description: Fundraiser['description']
): string | undefined {
  if (!description) {
    return undefined;
  }

  const plainText = getRichTextTextContent(description);
  if (!plainText) {
    return undefined;
  }

  if (plainText.length <= MAX_SHARE_TEXT_LENGTH) {
    return plainText;
  }

  const truncated = plainText.slice(0, MAX_SHARE_TEXT_LENGTH - 3).trimEnd();
  const lastWordBoundary = truncated.lastIndexOf(' ');
  const readable =
    lastWordBoundary > 0 ? truncated.slice(0, lastWordBoundary) : truncated;

  return `${readable}...`;
}

/**
 * Picks the share/OG body text from the configured {@link ShareTextSource}.
 *
 * Both inputs are pre-resolved by the caller (the goal string is already
 * translated + currency-formatted) so this stays framework-free and is reused
 * by the client share button and the server-side `generateMetadata`.
 *
 * Falls back to the other source when the chosen one is empty, so the text is
 * never blank (no goal → description; no description → goal).
 */
export function buildShareText(args: {
  source: ShareTextSource;
  description: Fundraiser['description'];
  /** Already translated + formatted, e.g. "Help reach €10,000". */
  goalText: string | undefined;
}): string | undefined {
  const descriptionText = getShareDescription(args.description);

  if (args.source === 'combined') {
    if (descriptionText && args.goalText) {
      return `${descriptionText}${COMBINED_SEPARATOR}${args.goalText}`;
    }
    return descriptionText ?? args.goalText;
  }

  if (args.source === 'goal') {
    return args.goalText ?? descriptionText;
  }
  return descriptionText ?? args.goalText;
}
