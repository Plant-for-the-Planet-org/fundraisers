import type { ComponentType } from 'react';
import type { ShareData } from '@/lib/share/build-share-data';

import { whatsappTarget } from '@/lib/share/targets/whatsapp';

/**
 * Keys under `Fundraisers.share.targets`. Kept as an explicit union so target
 * labels stay type-checked against the message catalog. Add a key here (and to
 * the locale files) when adding a platform target.
 */
export type ShareTargetLabelKey = 'whatsapp';

/**
 * A share destination shown in the in-app share menu — the fallback surface
 * when native Web Share is unavailable.
 *
 * Platform branches (LinkedIn, Instagram, …) add an entry to
 * {@link SHARE_TARGETS}; the menu maps over the registry, so no menu edits are
 * needed per platform.
 */
export interface ShareTarget {
  /** Stable id, e.g. `'whatsapp'` | `'linkedin'` | `'instagram-story'`. */
  id: string;
  /** i18n key under `Fundraisers.share.targets`. */
  labelKey: ShareTargetLabelKey;
  icon: ComponentType<{ className?: string }>;
  /** Hide the target when it can't handle the data. Defaults to shown. */
  isAvailable?: (data: ShareData) => boolean;
  run: (data: ShareData) => void | Promise<void>;
}

export const SHARE_TARGETS: ShareTarget[] = [whatsappTarget];
